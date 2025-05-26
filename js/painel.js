// painel.js

import { auth, db } from "./firebase-init.js";
import { verificarLogin, sair } from "./auth.js";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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
    day: "2-digit",
    month: "short",
    year: "numeric"
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
  const dia = hoje.getDay();
  const segundaAtual = new Date(hoje);
  segundaAtual.setDate(hoje.getDate() - (dia === 0 ? 6 : dia - 1));
  segundaAtual.setHours(0, 0, 0, 0);

  const segundaPassada = new Date(segundaAtual);
  segundaPassada.setDate(segundaAtual.getDate() - 7);

  const segundaSeguinte = new Date(segundaAtual);
  segundaSeguinte.setDate(segundaAtual.getDate() + 7);

  return {
    passada: { inicio: segundaPassada, fim: new Date(segundaAtual.getTime() - 1) },
    atual: { inicio: segundaAtual, fim: new Date(segundaSeguinte.getTime() - 1) },
    proxima: { inicio: segundaSeguinte, fim: new Date(segundaSeguinte.getTime() + 6 * 86400000) }
  };
}

function atualizarStickers() {
  const { passada, atual, proxima } = obterSemanas();
  const semanaPassada = [], semanaAtual = [], semanaSeguinte = [];

  for (const cultivo of Object.values(eventosMap)) {
    const base = new Date(cultivo.data);
    cultivo.eventos.forEach(ev => {
      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() + (parseInt(ev.ajuste) || 0));
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + (parseInt(ev.dias) || 0));
      const label = `<strong>${cultivo.titulo}</strong><br>${ev.evento} - ${fim.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}`;
      if (fim >= passada.inicio && fim <= passada.fim) semanaPassada.push({ label, data: fim });
      else if (fim >= atual.inicio && fim <= atual.fim) semanaAtual.push({ label, data: fim });
      else if (fim >= proxima.inicio && fim <= proxima.fim) semanaSeguinte.push({ label, data: fim });
    });
  }

  const stickers = document.getElementById("stickers");
  stickers.innerHTML = "";
  renderSticker("Semana Passada", semanaPassada.sort((a,b)=>a.data-b.data).map(e=>e.label), "bg-blue-100");
  renderSticker("Semana Atual", semanaAtual.sort((a,b)=>a.data-b.data).map(e=>e.label), "bg-yellow-100");
  renderSticker("Semana Seguinte", semanaSeguinte.sort((a,b)=>a.data-b.data).map(e=>e.label), "bg-green-100");
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

  const hoje = new Date();
  const cores = ["#7e22ce", "#2563eb", "#16a34a", "#eab308", "#dc2626"];
  let corIndex = 0;
  const datasets = [];

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
          adapters: { date: luxon },
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
