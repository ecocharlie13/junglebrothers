// painel.js
import { auth, db } from "./firebase-init.js";
import { verificarLogin, sair } from "./auth.js";
import {
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import { Chart } from 'https://cdn.jsdelivr.net/npm/frappe-charts@1.5.6/dist/frappe-charts.min.esm.js';

let cultivosSelecionados = [];
let eventosMap = {};
let mostrarPassados = false;

verificarLogin(async (user) => {
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;
  document.getElementById("logout").addEventListener("click", sair);

  cultivosSelecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];
  for (const cultivoId of cultivosSelecionados) {
    const snap = await getDoc(doc(db, "cultivos", cultivoId));
    if (snap.exists()) eventosMap[cultivoId] = snap.data();
  }

  renderizarDashboard();
});

function renderizarDashboard() {
  const hoje = new Date();
  const concluidos = [], atuais = [], proximos = [];
  const ganttData = [];
  const corPorCultivo = {};
  let corIndex = 0;
  const paleta = ["#4f46e5", "#16a34a", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6"];

  for (const [cultivoId, cultivo] of Object.entries(eventosMap)) {
    const eventos = cultivo.eventos;
    let cor = paleta[corIndex % paleta.length];
    corPorCultivo[cultivo.titulo] = cor;
    corIndex++;

    let dataRef = new Date(cultivo.data);

    eventos.forEach((ev, i) => {
      const ajuste = parseInt(ev.ajuste || 0);
      dataRef.setDate(dataRef.getDate() + ajuste);
      const inicio = new Date(dataRef);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + parseInt(ev.dias || 0));

      const hojeSemHoras = new Date();
      hojeSemHoras.setHours(0, 0, 0, 0);

      const status = fim < hojeSemHoras ? "concluido" : (inicio <= hojeSemHoras && fim >= hojeSemHoras ? "atual" : "proximo");

      if (!mostrarPassados && status === "concluido") return;

      const label = `${cultivo.titulo} - ${ev.evento}`;
      const item = {
        nome: cultivo.titulo,
        evento: ev.evento,
        fim: fim.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })
      };

      if (status === "concluido") concluidos.push(item);
      if (status === "atual") atuais.push(item);
      if (status === "proximo") proximos.push(item);

      ganttData.push({
        label,
        start: inicio.toISOString().split("T")[0],
        end: fim.toISOString().split("T")[0],
        color: cor
      });

      dataRef = new Date(fim);
    });
  }

  atualizarStickers(concluidos, atuais, proximos);
  desenharGrafico(ganttData);
}

function atualizarStickers(concluidos, atuais, proximos) {
  const set = (id, lista, cor) => {
    const el = document.getElementById(id);
    el.innerHTML = "";
    lista.forEach(ev => {
      const div = document.createElement("div");
      div.className = `bg-${cor}-100 text-${cor}-800 border-l-4 border-${cor}-500 p-2 mb-2 text-sm`;
      div.textContent = `${ev.nome} - ${ev.evento} (${ev.fim})`;
      el.appendChild(div);
    });
  };

  set("eventos-concluidos", concluidos, "blue");
  set("eventos-atuais", atuais, "yellow");
  set("eventos-proximos", proximos, "green");
}

function desenharGrafico(data) {
  const chart = new Chart("grafico-gantt", {
    type: 'bar',
    height: 300,
    data: {
      labels: data.map(e => e.label),
      datasets: [{ values: data.map((_, i) => i + 1) }] // apenas visual
    },
    colors: data.map(e => e.color),
    barOptions: {
      stacked: false
    }
  });
}

document.getElementById("toggle-passados").addEventListener("click", () => {
  mostrarPassados = !mostrarPassados;
  renderizarDashboard();
});
