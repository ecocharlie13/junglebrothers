// js/eventos.js

import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getDoc,
  doc,
  updateDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let usuario = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "/login.html");
  usuario = user;
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;
  await carregarEventos();
});

async function carregarEventos() {
  const cultivosSelecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];
  const tabela = document.getElementById("tabela-eventos");
  tabela.innerHTML = "";

  for (const cultivoId of cultivosSelecionados) {
    const ref = doc(db, "cultivos", cultivoId);
    const snap = await getDoc(ref);
    if (!snap.exists()) continue;

    const data = snap.data();
    const eventos = data.eventos || [];
    const dataInicial = new Date(data.data);

    let inicio = new Date(dataInicial);

    eventos.forEach((ev, index) => {
      const ajuste = parseInt(ev.ajuste) || 0;
      const dias = parseInt(ev.dias) || 0;

      if (index > 0) {
        inicio.setDate(inicio.getDate() + ajuste);
      } else {
        inicio.setDate(inicio.getDate() + ajuste);
      }

      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + dias);

      const tr = document.createElement("tr");

      const tdCultivo = document.createElement("td");
      tdCultivo.className = "border px-2 py-1";
      tdCultivo.textContent = data.titulo;

      const tdEvento = document.createElement("td");
      tdEvento.className = "border px-2 py-1";
      tdEvento.textContent = ev.evento;

      const tdDias = document.createElement("td");
      tdDias.className = "border px-2 py-1";
      const inputDias = document.createElement("input");
      inputDias.type = "number";
      inputDias.value = dias;
      inputDias.className = "dias border rounded w-full px-1";
      tdDias.appendChild(inputDias);

      const tdInicio = document.createElement("td");
      tdInicio.className = "border px-2 py-1";
      tdInicio.textContent = inicio.toISOString().split("T")[0];

      const tdFim = document.createElement("td");
      tdFim.className = "border px-2 py-1";
      tdFim.textContent = fim.toISOString().split("T")[0];

      const tdNotas = document.createElement("td");
      tdNotas.className = "border px-2 py-1";
      const inputNotas = document.createElement("input");
      inputNotas.value = ev.notas || "";
      inputNotas.className = "notas border rounded w-full px-1";
      tdNotas.appendChild(inputNotas);

      tr.append(tdCultivo, tdEvento, tdDias, tdInicio, tdFim, tdNotas);
      tabela.appendChild(tr);

      inicio = new Date(fim); // próxima etapa começa após fim atual
    });
  }
}

// TODO: Adicionar função de salvar atualizações no Firestore caso necessário
// TODO: Botão para recalcular datas se o número de dias mudar
