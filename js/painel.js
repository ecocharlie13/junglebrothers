// js/painel.js

import { auth, db } from "./firebase-init.js";
import { verificarLogin, sair } from "./auth.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import Chart from 'https://cdn.jsdelivr.net/npm/chart.js';

let eventosMap = {}; // cultivos[id] = { titulo, data, eventos }
let mostrarPassados = false;

verificarLogin(async (user) => {
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("logout").addEventListener("click", sair);

  // Carregar todos os cultivos do usuário
  const snap = await getDocs(query(collection(db, "cultivos"), where("usuario", "==", user.email)));
  snap.forEach(docSnap => {
    eventosMap[docSnap.id] = docSnap.data();
  });

  document.getElementById("data-hoje").textContent = new Date().toLocaleDateString("pt-BR", {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  document.getElementById("ver").addEventListener("click", () => renderizarDashboard());
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

function atualizarStickers() {
  const hoje = new Date();
  const concluidos = [], atuais = [], proximos = [];

  for (const [id, cultivo] of Object.entries(eventosMap)) {
    const eventos = cultivo.eventos;
    eventos.forEach(ev => {
      const inicio = new Date(cultivo.data);
      inicio.setDate(inicio.getDate() + (parseInt(ev.ajuste) || 0));
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + (parseInt(ev.dias) || 0));

      const label = `<strong>${cultivo.titulo}</strong><br>${ev.evento} - ${fim.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}`;
      if (fim < hoje) {
        concluidos.push(label);
      } else if (inicio <= hoje && fim >= hoje) {
        atuais.push(label);
      } else {
        proximos.push(label);
      }
    });
  }

  const stickers = document.getElementById("stickers");
  stickers.innerHTML = "";

  renderSticker("Eventos Concluídos", concluidos, "bg-blue-100");
  renderSticker("Eventos Atuais", atuais, "bg-yellow-100");
  renderSticker("Próximos Eventos", proximos, "bg-green-100");
}

function renderSticker(titulo, lista, cor) {
  const div = document.createElement("div");
  div.className = `p-4 rounded shadow ${cor}`;
  div.innerHTML = `<h3 class='font-bold mb-2'>${titulo}</h3>` + lista.map(l => `<div class='text-sm mb-1'>${l}</div>`).join("");
  document.getElementById("stickers").appendChild(div);
}

function atualizarGantt() {
  const ctx = document.getElementById("ganttChart").getContext("2d");
  if (window.ganttChart) {
    window.ganttChart.destroy();
  }

  const datasets = [];
  const hoje = new Date();
  let corIndex = 0;
  const cores = ["#7e22ce", "#2563eb", "#16a34a", "#eab308", "#dc2626"];

  const sorted = Object.entries(eventosMap).sort((a, b) => new Date(a[1].data) - new Date(b[1].data));
  for (const [id, cultivo] of sorted) {
    const base = new Date(cultivo.data);
    cultivo.eventos.forEach((ev, i) => {
      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() + (parseInt(ev.ajuste) || 0));
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + (parseInt(ev.dias) || 0));

      if (!mostrarPassados && fim < hoje) return;

      datasets.push({
        label: `${cultivo.titulo} - ${ev.evento}`,
        backgroundColor: cores[corIndex % cores.length],
        data: [{
          x: [inicio, fim],
          y: cultivo.titulo
        }]
      });
    });
    corIndex++;
  }

  window.ganttChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [...new Set(sorted.map(([_, c]) => c.titulo))],
      datasets
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'dd MMM yyyy',
            displayFormats: { day: 'dd MMM' }
          }
        }
      }
    }
  });
}
