import { auth, db } from "/cultivoapp/js/firebase-init.js";
import { verificarLogin, sair } from "/cultivoapp/js/auth.js";
import {
  getDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

function formatarDataParaInput(date) {
  return new Date(date).toISOString().split("T")[0];
}

function formatarDataParaMostrar(date) {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function calcularDatas(eventos, dataInicial) {
  let base = new Date(dataInicial);
  return eventos.map(ev => {
    const inicio = new Date(base);
    inicio.setDate(inicio.getDate() + (ev.ajuste || 0));
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + (ev.dias || 0));
    base = fim;
    return {
      ...ev,
      data_inicio: inicio.toISOString(),
      data_fim: fim.toISOString()
    };
  });
}

verificarLogin(async (user) => {
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;
  document.getElementById("logout").addEventListener("click", sair);

  const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados") || "[]");
  if (!selecionados.length) return;

  const tabela = document.querySelector("tbody");
  const linhas = [];

  for (const id of selecionados) {
    const snap = await getDoc(doc(db, "cultivos", id));
    if (!snap.exists()) continue;

    const cultivo = snap.data();
    const eventosComDatas = calcularDatas(cultivo.eventos, cultivo.data);

    eventosComDatas.forEach((ev, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="border px-2 py-1">${cultivo.titulo}</td>
        <td class="border px-2 py-1">${ev.evento}</td>
        <td class="border px-2 py-1"><input type="number" value="${ev.dias}" class="w-16 dias"/></td>
        <td class="border px-2 py-1"><input type="date" value="${formatarDataParaInput(ev.data_inicio)}" class="data-inicio"/></td>
        <td class="border px-2 py-1 data-fim">${formatarDataParaMostrar(ev.data_fim)}</td>
        <td class="border px-2 py-1"><input type="text" value="${ev.notas || ""}" class="w-full notas"/></td>
      `;
      tabela.appendChild(tr);
      linhas.push({ id, i, ev, tr });
    });
  }

  document.getElementById("atualizar").addEventListener("click", async () => {
    const cultivosAtualizados = {};

    for (const { id, i, tr } of linhas) {
      const dias = parseInt(tr.querySelector(".dias").value);
      const dataInicio = new Date(tr.querySelector(".data-inicio").value);
      const notas = tr.querySelector(".notas").value;

      if (!cultivosAtualizados[id]) {
        const snap = await getDoc(doc(db, "cultivos", id));
        cultivosAtualizados[id] = snap.data();
      }

      const cultivo = cultivosAtualizados[id];
      cultivo.eventos[i].dias = dias;
      cultivo.eventos[i].ajuste = 0;
      cultivo.eventos[i].notas = notas;
      cultivo.data = dataInicio.toISOString();
      cultivo.eventos = calcularDatas(cultivo.eventos, cultivo.data);
    }

    for (const id in cultivosAtualizados) {
      await updateDoc(doc(db, "cultivos", id), {
        data: cultivosAtualizados[id].data,
        eventos: cultivosAtualizados[id].eventos
      });
    }

    location.reload();
  });
});
