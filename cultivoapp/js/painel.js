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
  renderizarGantt();
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

  semanas.forEach(({ label, cor, inicio }) => {
    const data = new Date(domingoAtual);
    data.setDate(data.getDate() + inicio);
    const texto = `${label} - ${data.toLocaleDateString("pt-BR")}`;
    const sticker = document.createElement("div");
    sticker.className = `px-4 py-2 rounded ${cor} shadow`;
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

  Object.values(eventosMap).forEach((cultivo, idx) => {
    const base = new Date(cultivo.data);

    cultivo.eventos.forEach((ev, i) => {
      const ajuste = parseInt(ev.ajuste || 0);
      const dias = Math.max(1, parseInt(ev.dias || 0));
      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() + ajuste);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + dias);

      if (!mostrarPassados && fim < hoje) return;

      tarefas.push({
        id: `${cultivo.titulo}-${i}`,
        name: `${ev.evento}`,
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
}
