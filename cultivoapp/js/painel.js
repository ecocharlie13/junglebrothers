// painel.js (usando Frappe Gantt)
import { auth, db } from "/cultivoapp/js/firebase-init.js";
import { verificarLogin, sair } from "./auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let eventosMap = {};

verificarLogin(async (user) => {
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;
  document.getElementById("logout").addEventListener("click", sair);

  const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];
  for (const id of selecionados) {
    const snap = await getDoc(doc(db, "cultivos", id));
    if (snap.exists()) eventosMap[id] = snap.data();
  }

  document.getElementById("data-hoje").textContent = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric"
  });

  renderizarGantt();
});

function renderizarGantt() {
  const tarefas = [];
  const cores = ["#7e22ce", "#2563eb", "#16a34a", "#eab308", "#dc2626"];
  let corIndex = 0;

  for (const cultivo of Object.values(eventosMap)) {
    const base = new Date(cultivo.data);
    for (let i = 0; i < cultivo.eventos.length; i++) {
      const ev = cultivo.eventos[i];
      const ajuste = parseInt(ev.ajuste) || 0;
      const dias = Math.max(1, parseInt(ev.dias) || 0);

      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() + ajuste);

      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + dias);

      tarefas.push({
        id: `${cultivo.titulo}-${i}`,
        name: ev.evento,
        start: inicio.toISOString().split("T")[0],
        end: fim.toISOString().split("T")[0],
        progress: 100,
        custom_class: "bar-cor" + (corIndex % cores.length)
      });
    }
    corIndex++;
  }

  const gantt = new Gantt("#gantt", tarefas, {
    view_mode: "Day",
    language: "pt-br",
    custom_popup_html: null
  });
}  

window.__debugEventosMap = eventosMap;
