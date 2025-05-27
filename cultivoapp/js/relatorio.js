import { db } from "/cultivoapp/js/firebase-init.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

function formatar(data) {
  return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function intervaloSemana(offset = 0) {
  const hoje = new Date();
  const domingo = new Date(hoje.setDate(hoje.getDate() - hoje.getDay() + offset * 7));
  const sabado = new Date(domingo);
  sabado.setDate(domingo.getDate() + 6);
  return { inicio: domingo, fim: sabado };
}

function dentroDaSemana(data, semana) {
  return data >= semana.inicio && data <= semana.fim;
}

async function carregarRelatorio() {
  const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados") || "[]");
  if (!selecionados.length) return;

  const semanaPassada = intervaloSemana(-1);
  const semanaAtual = intervaloSemana(0);
  const semanaSeguinte = intervaloSemana(1);

  const listas = {
    passada: document.getElementById("lista-passada"),
    atual: document.getElementById("lista-atual"),
    seguinte: document.getElementById("lista-seguinte"),
  };

  for (const id of selecionados) {
    const snap = await getDoc(doc(db, "cultivos", id));
    if (!snap.exists()) continue;

    const { titulo, data: inicioISO, eventos } = snap.data();
    let cursor = new Date(inicioISO);

    for (const ev of eventos) {
      const ajuste = ev.ajuste || 0;
      const dias = ev.dias || 0;

      cursor.setDate(cursor.getDate() + ajuste);
      const fim = new Date(cursor);
      fim.setDate(fim.getDate() + dias);

      const item = document.createElement("li");
      item.textContent = `• ${titulo} – ${ev.nome} / ${formatar(fim)}`;

      if (dentroDaSemana(fim, semanaPassada)) listas.passada.appendChild(item);
      else if (dentroDaSemana(fim, semanaAtual)) listas.atual.appendChild(item);
      else if (dentroDaSemana(fim, semanaSeguinte)) listas.seguinte.appendChild(item);

      cursor = new Date(fim);
    }
  }
}

carregarRelatorio();
