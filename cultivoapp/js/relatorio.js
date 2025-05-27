// cultivoapp/js/relatorio.js

import { auth, db } from "/cultivoapp/js/firebase-init.js";
import { verificarLogin, sair } from "/cultivoapp/js/auth.js";
import {
  collection,
  getDoc,
  getDocs,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const HOJE = new Date();
const DOMINGO = new Date(HOJE);
DOMINGO.setDate(DOMINGO.getDate() - DOMINGO.getDay());
const SEMANAS = {
  passada: [diasAntes(DOMINGO, 7), diasAntes(DOMINGO, 1)],
  atual: [DOMINGO, diasDepois(DOMINGO, 6)],
  seguinte: [diasDepois(DOMINGO, 7), diasDepois(DOMINGO, 13)]
};

function diasAntes(data, dias) {
  const d = new Date(data);
  d.setDate(d.getDate() - dias);
  return d;
}
function diasDepois(data, dias) {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}
function formatarData(d) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function atualizarDatas() {
  document.getElementById("data-passada").textContent = `(${formatarData(
    SEMANAS.passada[0]
  )} - ${formatarData(SEMANAS.passada[1])})`;
  document.getElementById("data-atual").textContent = `(${formatarData(
    SEMANAS.atual[0]
  )} - ${formatarData(SEMANAS.atual[1])})`;
  document.getElementById("data-seguinte").textContent = `(${formatarData(
    SEMANAS.seguinte[0]
  )} - ${formatarData(SEMANAS.seguinte[1])})`;
}

function eventoNaSemana(evento, semana) {
  const fim = new Date(evento.data_fim);
  return fim >= semana[0] && fim <= semana[1];
}

function adicionarEvento(listaId, cultivoId, evento) {
  const li = document.createElement("li");
  li.textContent = `- ${cultivoId}\n-- ${evento.nome} / ${formatarData(new Date(evento.data_fim))}`;
  document.getElementById(listaId).appendChild(li);
}

verificarLogin(async (user) => {
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;
  document.getElementById("logout").addEventListener("click", sair);

  atualizarDatas();

  const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];

  for (const id of selecionados) {
    const snap = await getDoc(doc(db, "cultivos", id));
    if (!snap.exists()) continue;
    const cultivo = snap.data();
    const eventos = cultivo.eventos || [];

    eventos.forEach((evento, index) => {
      if (!evento?.data_fim || !evento?.nome) return;
      if (eventoNaSemana(evento, SEMANAS.passada)) adicionarEvento("lista-passada", id, evento);
      if (eventoNaSemana(evento, SEMANAS.atual)) adicionarEvento("lista-atual", id, evento);
      if (eventoNaSemana(evento, SEMANAS.seguinte)) adicionarEvento("lista-seguinte", id, evento);
    });
  }
});
