import { auth, db } from "/cultivoapp/js/firebase-init.js";
import { verificarLogin, sair } from "./auth.js";
import {
  getDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let eventosMap = {};
let cultivosSelecionados = [];

verificarLogin(async (user) => {
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;
  document.getElementById("logout").addEventListener("click", sair);
  document.getElementById("atualizar").addEventListener("click", atualizarEventos);

  cultivosSelecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];

  for (const cultivoId of cultivosSelecionados) {
    const ref = doc(db, "cultivos", cultivoId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      eventosMap[cultivoId] = snap.data();
    }
  }

  atualizarTabela();
});

function atualizarTabela() {
  const tbody = document.getElementById("tabela-eventos");
  tbody.innerHTML = "";

  for (const [cultivoId, cultivo] of Object.entries(eventosMap)) {
    let inicio = new Date(cultivo.data);

    cultivo.eventos.forEach((ev, i) => {
      inicio.setDate(inicio.getDate() + (parseInt(ev.ajuste) || 0));
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + (parseInt(ev.dias) || 0));

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="border px-2 py-1">${cultivo.titulo}</td>
        <td class="border px-2 py-1">${ev.evento}</td>
        <td class="border px-2 py-1">
          <input class="dias w-16 px-1 border rounded" type="number" value="${ev.dias}" data-cultivo="${cultivoId}" data-index="${i}" />
        </td>
        <td class="border px-2 py-1">${ev.ajuste}</td>
        <td class="border px-2 py-1">${inicio.toISOString().split("T")[0]}</td>
        <td class="border px-2 py-1">${fim.toISOString().split("T")[0]}</td>
        <td class="border px-2 py-1">
          <input class="notas w-full px-1 border rounded" value="${ev.notas || ""}" data-cultivo="${cultivoId}" data-index="${i}" />
        </td>
      `;
      tbody.appendChild(tr);
      inicio = new Date(fim); // Encadeia o próximo
    });
  }
}

async function atualizarEventos() {
  document.querySelectorAll(".dias").forEach((input) => {
    const { cultivo, index } = input.dataset;
    eventosMap[cultivo].eventos[index].dias = parseInt(input.value);
  });

  document.querySelectorAll(".notas").forEach((input) => {
    const { cultivo, index } = input.dataset;
    eventosMap[cultivo].eventos[index].notas = input.value;
  });

  for (const [cultivoId, cultivo] of Object.entries(eventosMap)) {
    await updateDoc(doc(db, "cultivos", cultivoId), { eventos: cultivo.eventos });
  }

  atualizarTabela();
  alert("✅ Eventos atualizados com sucesso!");
}
