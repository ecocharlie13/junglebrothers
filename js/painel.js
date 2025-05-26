import { auth, db } from "./firebase-init.js";
import { verificarLogin, sair } from "./auth.js";
import {
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let eventosMap = {};

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
    day: '2-digit', month: 'short', year: 'numeric'
  });

  renderizarStickers();
});

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

  const domingoPassado = new Date(segundaPassada);
  domingoPassado.setDate(segundaPassada.getDate() + 6);

  const domingoAtual = new Date(segundaAtual);
  domingoAtual.setDate(segundaAtual.getDate() + 6);

  const domingoProximo = new Date(segundaProxima);
  domingoProximo.setDate(segundaProxima.getDate() + 6);

  return {
    passada: { inicio: segundaPassada, fim: domingoPassado },
    atual: { inicio: segundaAtual, fim: domingoAtual },
    proxima: { inicio: segundaProxima, fim: domingoProximo }
  };
}

function renderizarStickers() {
  const { passada, atual, proxima } = obterSemanas();
  const concluidos = [], atuais = [], proximos = [];

  for (const cultivo of Object.values(eventosMap)) {
    const base = new Date(cultivo.data);

    cultivo.eventos.forEach(ev => {
      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() + (parseInt(ev.ajuste) || 0));
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + (parseInt(ev.dias) || 0));

      const label = `<strong>${cultivo.titulo}</strong><br>${ev.evento} - ${fim.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}`;

      if (fim >= passada.inicio && fim <= passada.fim) {
        concluidos.push({ label, data: fim });
      } else if (fim >= atual.inicio && fim <= atual.fim) {
        atuais.push({ label, data: fim });
      } else if (fim >= proxima.inicio && fim <= proxima.fim) {
        proximos.push({ label, data: fim });
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
