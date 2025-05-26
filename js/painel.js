// painel.js

import { auth, db } from "./firebase-init.js";
import { verificarLogin, sair } from "./auth.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let eventosMap = {};
let mostrarPassados = false;

verificarLogin(async (user) => {
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;
  document.getElementById("logout").addEventListener("click", sair);

  const snap = await getDocs(query(collection(db, "cultivos"), where("usuario", "==", user.email)));
  snap.forEach(docSnap => {
    eventosMap[docSnap.id] = docSnap.data();
  });

  document.getElementById("data-hoje").textContent = new Date().toLocaleDateString("pt-BR", {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  document.getElementById("ver").addEventListener("click", renderizarDashboard);
  document.getElementById("exibir-passados").addEventListener("change", (e) => {
    mostrarPassados = e.target.checked;
    renderizarDashboard();
  });

  renderizarDashboard();
});

function renderizarDashboard() {
  atualizarStickers();
  atualizarGantt();
}

function obterPeriodoAtual() {
  const tipo = document.getElementById("periodo").value;
  const hoje = new Date();
  let inicio, fim;

  if (tipo === "diario") {
    inicio = new Date(hoje.setHours(0,0,0,0));
    fim = new Date(inicio);
    fim.setDate(fim.getDate() + 1);
  } else if (tipo === "semanal") {
    const dia = hoje.getDay();
    const diff = (dia === 0 ? -6 : 1 - dia); // segunda-feira como início
    inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() + diff);
    inicio.setHours(0,0,0,0);
    fim = new Date(inicio);
    fim.setDate(fim.getDate() + 7);
  } else if (tipo === "mensal") {
    inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
  } else if (tipo === "anual") {
    inicio = new Date(hoje.getFullYear(), 0, 1);
    fim = new Date(hoje.getFullYear() + 1, 0, 1);
  }

  return { inicio, fim, tipo };
}

function atualizarStickers() {
  const { inicio, fim, tipo } = obterPeriodoAtual();
  const anteriores = [], atuais = [], proximos = [];

  for (const cultivo of Object.values(eventosMap)) {
    const base = new Date(cultivo.data);

    cultivo.eventos.forEach(ev => {
      const inicioEv = new Date(base);
      inicioEv.setDate(inicioEv.getDate() + (parseInt(ev.ajuste) || 0));
      const fimEv = new Date(inicioEv);
      fimEv.setDate(fimEv.getDate() + (parseInt(ev.dias) || 0));

      const label = `<strong>${cultivo.titulo}</strong><br>${ev.evento} - ${fimEv.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}`;

      if (fimEv < inicio) {
        anteriores.push({ label, data: fimEv });
      } else if (inicioEv < fim && fimEv >= inicio) {
        atuais.push({ label, data: fimEv });
      } else if (inicioEv >= fim) {
        proximos.push({ label, data: fimEv });
      }
    });
  }

  anteriores.sort((a, b) => a.data - b.data);
  atuais.sort((a, b) => a.data - b.data);
  proximos.sort((a, b) => a.data - b.data);

  const stickers = document.getElementById("stickers");
  stickers.innerHTML = "";
  renderSticker("Eventos Concluídos", anteriores.map(e => e.label), "bg-blue-100");
  renderSticker("Eventos Atuais", atuais.map(e => e.label), "bg-yellow-100");
  renderSticker("Próximos Eventos", proximos.map(e => e.label), "bg-green-100");
}

function renderSticker(titulo, lista, cor) {
  const div = document.createElement("div");
  div.className = `p-4 rounded shadow ${cor}`;
  div.innerHTML = `<h3 class='font-bold mb-2'>${titulo}</h3>` + lista.map(l => `<div class='text-sm mb-1'>${l}</div>`).join("");
  document.getElementById("stickers").appendChild(div);
}

function atualizarGantt() {
  const canvas = document.getElementById("ganttChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (window.ganttChart && typeof window.ganttChart.destroy === "function") window.ganttChart.destroy();

  const { inicio, fim } = obterPeriodoAtual();
  const hoje = new Date();
  let corIndex = 0;
  const cores = ["#7e22ce", "#2563eb", "#16a34a", "#eab308", "#dc2626"];
  const datasets = [];

  const sorted = Object.entries(eventosMap).sort((a, b) => new Date(a[1].data) - new Date(b[1].data));
  for (const [_, cultivo] of sorted) {
    const base = new Date(cultivo.data);
    for (const ev of cultivo.eventos) {
      const inicioEv = new Date(base);
      inicioEv.setDate(inicioEv.getDate() + (parseInt(ev.ajuste) || 0));
      const fimEv = new Date(inicioEv);
      fimEv.setDate(fimEv.getDate() + (parseInt(ev.dias) || 0));

      if (!mostrarPassados && fimEv < hoje) continue;
      if (fimEv < inicio || inicioEv > fim) continue;

      datasets.push({
        label: `${cultivo.titulo} - ${ev.evento}`,
        backgroundColor: cores[corIndex % cores.length],
        data: [{ x: [inicioEv, fimEv], y: cultivo.titulo }]
      });
    }
    corIndex++;
  }

  window.ganttChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [...new Set(sorted.map(([_, c]) => c.titulo))],
      datasets
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
            tooltipFormat: "dd MMM yyyy",
            displayFormats: { day: "dd MMM" }
          },
          min: inicio,
          max: fim
        }
      }
    }
  });
}
