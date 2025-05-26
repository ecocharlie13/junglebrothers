import { auth, db } from "./firebase-init.js";
import { verificarLogin, sair } from "./auth.js";
import {
  collection,
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
    if (snap.exists()) {
      eventosMap[id] = snap.data();
    }
  }

  document.getElementById("data-hoje").textContent = new Date().toLocaleDateString("pt-BR", {
    day: '2-digit', month: 'long', year: 'numeric'
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
  const diaSemana = hoje.getDay() === 0 ? 7 : hoje.getDay(); // transforma domingo em 7
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
      const inicioEv = new Date(base);
      inicioEv.setDate(inicioEv.getDate() + (parseInt(ev.ajuste) || 0));
      const fimEv = new Date(inicioEv);
      fimEv.setDate(fimEv.getDate() + (parseInt(ev.dias) || 0));

      const label = `<strong>${cultivo.titulo}</strong><br>${ev.evento} - ${fimEv.toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })}`;

      if (fimEv >= passada.inicio && fimEv <= passada.fim) {
        concluidos.push({ label, data: fimEv });
      } else if (fimEv >= atual.inicio && fimEv <= atual.fim) {
        atuais.push({ label, data: fimEv });
      } else if (fimEv >= proxima.inicio && fimEv <= proxima.fim) {
        proximos.push({ label, data: fimEv });
      }
    });
  }

  const stickers = document.getElementById("stickers");
  stickers.innerHTML = "";
  renderSticker("Semana Passada", concluidos.sort((a, b) => a.data - b.data).map(e => e.label), "bg-blue-100");
  renderSticker("Semana Atual", atuais.sort((a, b) => a.data - b.data).map(e => e.label), "bg-yellow-100");
  renderSticker("Semana Seguinte", proximos.sort((a, b) => a.data - b.data).map(e => e.label), "bg-green-100");
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
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          type: "time",
          adapters: {
            date: {
              zone: "utc"
            }
          },
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
