// Novo eventos.js - suporte a edição de data_inicio

import { auth, db } from "/cultivoapp/js/firebase-init.js";
import { verificarLogin, sair } from "/cultivoapp/js/auth.js";
import {
  getDoc, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let cultivosSelecionados = [];
let eventosMap = {}; // idCultivo => { titulo, eventos[] }

verificarLogin(async (user) => {
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;
  document.getElementById("logout").addEventListener("click", sair);

  cultivosSelecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];

  for (const id of cultivosSelecionados) {
    const snap = await getDoc(doc(db, "cultivos", id));
    if (!snap.exists()) continue;
    eventosMap[id] = snap.data();
  }

  renderTabela();
});

function renderTabela() {
  const container = document.getElementById("tabela-eventos");
  container.innerHTML = "";

  for (const [id, cultivo] of Object.entries(eventosMap)) {
    const h2 = document.createElement("h2");
    h2.className = "text-xl font-bold mt-6 mb-2";
    h2.textContent = cultivo.titulo;
    container.appendChild(h2);

    const tabela = document.createElement("table");
    tabela.className = "w-full table-auto border-collapse mb-4";
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr class="bg-gray-200">
        <th class="border px-2 py-1">Evento</th>
        <th class="border px-2 py-1">Início</th>
        <th class="border px-2 py-1">Dias</th>
        <th class="border px-2 py-1">Ajuste</th>
        <th class="border px-2 py-1">Fim</th>
        <th class="border px-2 py-1">Notas</th>
      </tr>`;
    tabela.appendChild(thead);

    const tbody = document.createElement("tbody");
    cultivo.eventos.forEach((ev, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="border px-2 py-1">${ev.evento}</td>
        <td class="border px-2 py-1"><input type="date" class="inicio-input w-full" data-index="${i}" data-id="${id}" value="${ev.data_inicio?.slice(0,10) || ""}"></td>
        <td class="border px-2 py-1">${ev.dias}</td>
        <td class="border px-2 py-1">${ev.ajuste}</td>
        <td class="border px-2 py-1">${ev.data_fim?.slice(0,10) || ""}</td>
        <td class="border px-2 py-1">${ev.notas}</td>`;
      tbody.appendChild(row);
    });
    tabela.appendChild(tbody);
    container.appendChild(tabela);
  }

  document.querySelectorAll(".inicio-input").forEach(input => {
    input.addEventListener("change", (e) => {
      const id = e.target.dataset.id;
      const index = parseInt(e.target.dataset.index);
      const novaData = new Date(e.target.value);
      atualizarEventos(id, index, novaData);
      renderTabela();
    });
  });

  const btn = document.getElementById("salvar");
  btn.onclick = salvarFirestore;
}

function atualizarEventos(id, indiceAlterado, novaData) {
  const cultivo = eventosMap[id];
  let cursor = new Date(novaData);

  for (let i = indiceAlterado; i < cultivo.eventos.length; i++) {
    const ev = cultivo.eventos[i];
    ev.data_inicio = cursor.toISOString();
    cursor.setDate(cursor.getDate() + ev.dias + ev.ajuste);
    ev.data_fim = cursor.toISOString();
  }
}

async function salvarFirestore() {
  for (const [id, cultivo] of Object.entries(eventosMap)) {
    await updateDoc(doc(db, "cultivos", id), {
      eventos: cultivo.eventos
    });
  }
  alert("Eventos atualizados com sucesso!");
} 
