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
    const ref = doc(db, "cultivos", id);
    const snap = await getDoc(ref);
    if (snap.exists()) eventosMap[id] = snap.data();
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
  atualizarGantt();
}

function obterSemanas() {
  const hoje = new Date();
  const dia = hoje.getDay() === 0 ? 7 : hoje.getDay();
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() - dia + 1);
  segunda.setHours(0, 0, 0, 0);

  const anterior = new Date(segunda); anterior.setDate(segunda.getDate() - 7);
  const seguinte = new Date(segunda); seguinte.setDate(segunda.getDate() + 7);

  const domingoAnt = new Date(anterior); domingoAnt.setDate(anterior.getDate() + 6);
  const domingoAtual = new Date(segunda); domingoAtual.setDate(segunda.getDate() + 6);
  const domingoSeg = new Date(seguinte); domingoSeg.setDate(seguinte.getDate() + 6);

  return {
    passada: { inicio: anterior, fim: domingoAnt },
    atual: { inicio: segunda, fim: domingoAtual },
    proxima: { inicio: seguinte, fim: domingoSeg }
  };
}

function atualizarStickers() {
  const { passada, atual, proxima } = obterSemanas();
  const concluidos = [], atuais = [], proximos = [];

  for (const cultivo of Object.values(eventosMap)) {
    const base = new Date(cultivo.data);
    for (const ev of cultivo.eventos) {
      const ajuste = parseInt(ev.ajuste) || 0;
      const dias = Math.max(1, parseInt(ev.dias) || 0);

      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() + ajuste);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + dias);

      const fimFormat = new Date(fim.toDateString());
      const label = `<strong>${cultivo.titulo}</strong><br>${ev.evento} - ${fimFormat.toLocaleDateString("pt-BR")}`;

      if (fimFormat >= passada.inicio && fimFormat <= passada.fim) {
        concluidos.push({ label, data: fimFormat });
      } else if (fimFormat >= atual.inicio && fimFormat <= atual.fim) {
        atuais.push({ label, data: fimFormat });
      } else if (fimFormat >= proxima.inicio && fimFormat <= proxima.fim) {
        proximos.push({ label, data: fimFormat });
      }
    }
  }

  const el = document.getElementById("stickers");
  el.innerHTML = "";
  renderSticker("Semana Passada", concluidos, "bg-blue-100");
  renderSticker("Semana Atual", atuais, "bg-yellow-100");
  renderSticker("Semana Seguinte", proximos, "bg-green-100");
}

function renderSticker(titulo, itens, cor) {
  const box = document.createElement("div");
  box.className = `p-4 rounded shadow ${cor}`;
  box.innerHTML = `<h3 class='font-bold mb-2'>${titulo}</h3>` +
    itens.sort((a, b) => a.data - b.data).map(e => `<div class='text-sm mb-1'>${e.label}</div>`).join("");
  document.getElementById("stickers").appendChild(box);
}

function atualizarGantt() {
  const canvas = document.getElementById("ganttChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (window.ganttChart?.destroy) window.ganttChart.destroy();

  const hoje = new Date();
  let corIndex = 0;
  const cores = ["#7e22ce", "#2563eb", "#16a34a", "#eab308", "#dc2626"];
  const datasets = [];

  const sorted = Object.entries(eventosMap).sort((a, b) => new Date(a[1].data) - new Date(b[1].data));

  for (const [_, cultivo] of sorted) {
    const base = new Date(cultivo.data);
    for (const ev of cultivo.eventos) {
      const ajuste = parseInt(ev.ajuste) || 0;
      const dias = Math.max(1, parseInt(ev.dias) || 0);

      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() + ajuste);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + dias);

      if (!mostrarPassados && fim < hoje) continue;

      datasets.push({
        label: `${cultivo.titulo} - ${ev.evento}`,
        backgroundColor: cores[corIndex % cores.length],
        data: [{
          x: [inicio, fim],
          y: cultivo.titulo
        }]
      });
    }
    corIndex++;
  }

  canvas.height = Math.min(Math.max(datasets.length * 40, 300), 1200);

  window.ganttChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [...new Set(sorted.map(([_, c]) => c.titulo))],
      datasets
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
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

window.__debugEventosMap = eventosMap;
