import { auth, db } from "/cultivoapp/js/firebase-init.js";
import { verificarLogin, sair } from "./auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let eventosMap = {};
let mostrarPassados = false;

verificarLogin(async (user) => {
  const emailSpan = document.getElementById("user-email");
  const picImg = document.getElementById("user-pic");
  const logoutBtn = document.getElementById("logout");

  if (emailSpan) emailSpan.textContent = user.email;
  if (picImg) picImg.src = user.photoURL;
  if (logoutBtn) logoutBtn.addEventListener("click", sair);

  const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];
  for (const id of selecionados) {
    const docRef = doc(db, "cultivos", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      eventosMap[id] = snap.data();
    }
  }

  window.__debugEventosMap = eventosMap;
  console.log("DEBUG eventosMap", eventosMap);

  const dataHoje = document.getElementById("data-hoje");
  if (dataHoje) {
    dataHoje.textContent = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric"
    });
  }

  renderizarDashboard();
});

function renderizarDashboard() {
  atualizarStickers();
  renderizarGantt(); // Gantt original preservado
}

function atualizarStickers() {
  const stickers = document.getElementById("stickers");
  if (!stickers) return;
  stickers.innerHTML = "";

  const hoje = new Date();
  const domingoAtual = new Date(hoje);
  domingoAtual.setDate(hoje.getDate() - hoje.getDay());

  const semanas = [
    { label: "Semana Passada", cor: "bg-blue-600", inicio: -7 },
    { label: "Semana Atual", cor: "bg-yellow-500", inicio: 0 },
    { label: "Semana Seguinte", cor: "bg-green-600", inicio: 7 }
  ];

  const eventos = [];

  Object.values(eventosMap).forEach((cultivo) => {
    let dataRef = new Date(cultivo.data);
    cultivo.eventos.forEach((ev) => {
      const dias = Math.max(1, parseInt(ev.dias || 0));
      const inicio = new Date(dataRef);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + dias);
      eventos.push({ ...ev, cultivo: cultivo.titulo, inicio, fim });
      dataRef = fim;
    });
  });

  semanas.forEach(({ label, cor, inicio }) => {
    const ini = new Date(domingoAtual);
    ini.setDate(ini.getDate() + inicio);
    const fim = new Date(ini);
    fim.setDate(fim.getDate() + 6);

    const eventosSemana = eventos.filter(ev => ev.inicio <= fim && ev.fim >= ini);

    const texto = `${label} - ${ini.toLocaleDateString("pt-BR")} (${eventosSemana.length} eventos)`;
    const sticker = document.createElement("div");
    sticker.className = `px-4 py-2 rounded ${cor} shadow text-white font-semibold text-sm`;
    sticker.textContent = texto;
    stickers.appendChild(sticker);
  });
}

function renderizarGantt() {
  const container = document.getElementById("gantt");
  if (!container) return;
  container.innerHTML = "";

  const tarefas = [];
  const hoje = new Date();
  let corIndex = 0;

  const cores = ["#7e22ce", "#2563eb", "#16a34a", "#eab308", "#dc2626"];

  Object.values(eventosMap).forEach((cultivo) => {
    let dataBase = new Date(cultivo.data);

    cultivo.eventos.forEach((ev, i) => {
      const dias = Math.max(1, parseInt(ev.dias || 0));
      const inicio = new Date(dataBase);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + dias);
      dataBase = new Date(fim);

      if (!mostrarPassados && fim < hoje) return;

      tarefas.push({
        id: `${cultivo.titulo}-${i}`,
        name: `${cultivo.titulo} - ${String(i + 1).padStart(2, "0")} ${ev.evento}`,
        start: inicio.toISOString().split("T")[0],
        end: fim.toISOString().split("T")[0],
        progress: 100,
        custom_class: `cor-${corIndex % cores.length}`,
        dependencies: ""
      });
    });
    corIndex++;
  });

  if (tarefas.length === 0) {
    container.innerHTML = "<div class='text-gray-400 italic text-center'>Nenhum evento para exibir</div>";
    return;
  }

  new window.Gantt("#gantt", tarefas, {
    view_mode: "Day",
    date_format: "YYYY-MM-DD",
    custom_popup_html: null
  });

  console.log("✅ Gantt e stickers renderizados com sucesso.");
}
