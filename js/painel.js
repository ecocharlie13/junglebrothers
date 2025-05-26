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

function getPeriodos() {
  const hoje = new Date();
  const periodoSelecionado = document.getElementById("periodo").value;

  const startOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // segunda-feira
    return new Date(d.setDate(diff));
  };

  let anterior = {}, atual = {}, proximo = {};

  switch (periodoSelecionado) {
    case "diario":
      anterior.inicio = new Date(hoje); anterior.inicio.setDate(hoje.getDate() - 1);
      anterior.fim = new Date(anterior.inicio);
      atual.inicio = new Date(hoje);
      atual.fim = new Date(hoje);
      proximo.inicio = new Date(hoje); proximo.inicio.setDate(hoje.getDate() + 1);
      proximo.fim = new Date(proximo.inicio);
      break;

    case "semanal": {
      const atualInicio = startOfWeek(hoje);
      const anteriorInicio = new Date(atualInicio); anteriorInicio.setDate(atualInicio.getDate() - 7);
      const proximoInicio = new Date(atualInicio); proximoInicio.setDate(atualInicio.getDate() + 7);

      anterior.inicio = anteriorInicio;
      anterior.fim = new Date(anteriorInicio); anterior.fim.setDate(anteriorInicio.getDate() + 6);
      atual.inicio = atualInicio;
      atual.fim = new Date(atualInicio); atual.fim.setDate(atualInicio.getDate() + 6);
      proximo.inicio = proximoInicio;
      proximo.fim = new Date(proximoInicio); proximo.fim.setDate(proximoInicio.getDate() + 6);
      break;
    }

    case "mensal": {
      const y = hoje.getFullYear();
      const m = hoje.getMonth();
      anterior.inicio = new Date(y, m - 1, 1);
      anterior.fim = new Date(y, m, 0);
      atual.inicio = new Date(y, m, 1);
      atual.fim = new Date(y, m + 1, 0);
      proximo.inicio = new Date(y, m + 1, 1);
      proximo.fim = new Date(y, m + 2, 0);
      break;
    }

    case "anual": {
      const y = hoje.getFullYear();
      anterior.inicio = new Date(y - 1, 0, 1);
      anterior.fim = new Date(y - 1, 11, 31);
      atual.inicio = new Date(y, 0, 1);
      atual.fim = new Date(y, 11, 31);
      proximo.inicio = new Date(y + 1, 0, 1);
      proximo.fim = new Date(y + 1, 11, 31);
      break;
    }
  }
  return { anterior, atual, proximo };
}

function atualizarStickers() {
  const { anterior, atual, proximo } = getPeriodos();
  const concluidos = [], atuais = [], proximos = [];

  for (const cultivo of Object.values(eventosMap)) {
    const base = new Date(cultivo.data);

    cultivo.eventos.forEach(ev => {
      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() + (parseInt(ev.ajuste) || 0));
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + (parseInt(ev.dias) || 0));

      const label = `<strong>${cultivo.titulo}</strong><br>${ev.evento} - ${fim.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}`;

      if (fim >= anterior.inicio && fim <= anterior.fim) {
        concluidos.push(label);
      } else if (fim >= atual.inicio && fim <= atual.fim) {
        atuais.push(label);
      } else if (fim >= proximo.inicio && fim <= proximo.fim) {
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
  const canvas = document.getElementById("ganttChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (window.ganttChart && typeof window.ganttChart.destroy === "function") {
    window.ganttChart.destroy();
  }

  const datasets = [];
  const hoje = new Date();
  let corIndex = 0;
  const cores = ["#7e22ce", "#2563eb", "#16a34a", "#eab308", "#dc2626"];

  const sorted = Object.entries(eventosMap).sort((a, b) => new Date(a[1].data) - new Date(b[1].data));

  for (const [_, cultivo] of sorted) {
    const base = new Date(cultivo.data);
    for (const ev of cultivo.eventos) {
      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() + (parseInt(ev.ajuste) || 0));
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + (parseInt(ev.dias) || 0));

      if (!mostrarPassados && fim < hoje) continue;

      datasets.push({
        label: `${cultivo.titulo} - ${ev.evento}`,
        backgroundColor: cores[corIndex % cores.length],
        data: [{ x: [inicio, fim], y: cultivo.titulo }]
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
          }
        }
      }
    }
  });
}
