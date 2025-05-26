// NOVO painel.js - CultivoApp Gantt Corrigido & Elegante

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
  const diaSemana = hoje.getDay() === 0 ? 7 : hoje.getDay();
  const segundaAtual = new Date(hoje);
  segundaAtual.setDate(hoje.getDate() - diaSemana + 1);
  segundaAtual.setHours(0, 0, 0, 0);

  const segundaPassada = new Date(segundaAtual);
  segundaPassada.setDate(segundaAtual.getDate() - 7);

  const segundaProxima = new Date(segundaAtual);
  segundaProxima.setDate(segundaAtual.getDate() + 7);

  const domingoAtual = new Date(segundaAtual);
  domingoAtual.setDate(segundaAtual.getDate() + 6);

  const domingoPassado = new Date(segundaPassada);
  domingoPassado.setDate(segundaPassada.getDate() + 6);

  const domingoProximo = new Date(segundaProxima);
  domingoProximo.setDate(segundaProxima.getDate() + 6);

  return {
    passada: { inicio: segundaPassada, fim: domingoPassado },
    atual: { inicio: segundaAtual, fim: domingoAtual },
    proxima: { inicio: segundaProxima, fim: domingoProximo }
  };
}

function atualizarStickers() {
  const { passada, atual, proxima } = obterSemanas();
  const concluidos = [], atuais = [], proximos = [];

  for (const cultivo of Object.values(eventosMap)) {
    const base = new Date(cultivo.data);
    cultivo.eventos.forEach(ev => {
      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() + (parseInt(ev.ajuste) || 0));
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + Math.max(1, parseInt(ev.dias) || 0));
      const fimData = new Date(fim.toDateString());
      const label = `<strong>${cultivo.titulo}</strong><br>${ev.evento} - ${fimData.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}`;
      if (fimData >= passada.inicio && fimData <= passada.fim) concluidos.push({ label, data: fimData });
      else if (fimData >= atual.inicio && fimData <= atual.fim) atuais.push({ label, data: fimData });
      else if (fimData >= proxima.inicio && fimData <= proxima.fim) proximos.push({ label, data: fimData });
    });
  }

  const div = document.getElementById("stickers");
  div.innerHTML = "";
  renderSticker("Semana Passada", concluidos.map(e => e.label), "bg-blue-100");
  renderSticker("Semana Atual", atuais.map(e => e.label), "bg-yellow-100");
  renderSticker("Semana Seguinte", proximos.map(e => e.label), "bg-green-100");
}

function renderSticker(titulo, lista, cor) {
  const d = document.createElement("div");
  d.className = `p-4 rounded shadow ${cor}`;
  d.innerHTML = `<h3 class='font-bold mb-2'>${titulo}</h3>` + lista.map(l => `<div class='text-sm mb-1'>${l}</div>`).join("");
  document.getElementById("stickers").appendChild(d);
}

function atualizarGantt() {
  const canvas = document.getElementById("ganttChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (window.ganttChart) window.ganttChart.destroy();

  const hoje = new Date();
  let corIndex = 0;
  const cores = ["#7e22ce", "#2563eb", "#16a34a", "#eab308", "#dc2626"];
  const datasets = [];

  const sorted = Object.entries(eventosMap).sort((a, b) => new Date(a[1].data) - new Date(b[1].data));
  for (const [_, cultivo] of sorted) {
    const base = new Date(cultivo.data);
    for (const ev of cultivo.eventos) {
      const dias = Math.max(1, parseInt(ev.dias) || 0);
      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() + (parseInt(ev.ajuste) || 0));
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + dias);
      if (!mostrarPassados && fim < hoje) continue;

      datasets.push({
        label: `${cultivo.titulo} - ${ev.evento}`,
        backgroundColor: cores[corIndex % cores.length],
        data: [{ x: [inicio, fim], y: cultivo.titulo }]
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
