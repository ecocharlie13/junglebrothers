import { auth, db } from "/cultivoapp/js/firebase-init.js";
import { verificarLogin, sair } from "./auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let eventosMap = {};
let mostrarPassados = false;

verificarLogin(async (user) => {
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;
  document.getElementById("logout").addEventListener("click", sair);

  const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];
  for (const id of selecionados) {
    const docRef = doc(db, "cultivos", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      eventosMap[id] = snap.data();
    }
  }

  document.getElementById("data-hoje").textContent = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric"
  });

  document.getElementById("exibir-passados").addEventListener("change", (e) => {
    mostrarPassados = e.target.checked;
    renderizarDashboard();
  });

  renderizarDashboard();
});

function renderizarDashboard() {
  atualizarStickers();
  renderizarGantt();
}

function atualizarStickers() {
  const stickers = document.getElementById("stickers");
  stickers.innerHTML = "<div class='text-gray-400 italic'>Stickers ainda não implementados com Frappe Gantt</div>";
}

function renderizarGantt() {
  const container = document.getElementById("gantt");
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

  new Gantt("#gantt", tarefas, {
    view_mode: "Day",
    date_format: "YYYY-MM-DD",
    custom_popup_html: null
  });
}

window.__debugEventosMap = eventosMap;
