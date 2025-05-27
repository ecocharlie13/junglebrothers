import { db } from "/cultivoapp/js/firebase-init.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

function formatarData(data) {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function obterSemana(offset = 0) {
  const hoje = new Date();
  const domingo = new Date(hoje.setDate(hoje.getDate() - hoje.getDay() + offset * 7));
  const sabado = new Date(domingo);
  sabado.setDate(domingo.getDate() + 6);
  return { inicio: domingo, fim: sabado };
}

function renderizarSticker(id, inicio, fim, eventos) {
  document.getElementById(`data-${id}`).textContent = `(${formatarData(inicio)} - ${formatarData(fim)})`;
  const ul = document.getElementById(`lista-${id}`);
  ul.innerHTML = "";
  eventos.forEach(({ titulo, nome, data }) => {
    const li = document.createElement("li");
    li.textContent = `– ${titulo}: ${nome} / ${formatarData(data)}`;
    ul.appendChild(li);
  });
}

async function carregarRelatorio() {
  const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados") || "[]");
  if (!selecionados.length) return;

  const semana = {
    passada: obterSemana(-1),
    atual: obterSemana(0),
    seguinte: obterSemana(1),
  };

  const eventos = {
    passada: [],
    atual: [],
    seguinte: [],
  };

  for (const id of selecionados) {
    const snap = await getDoc(doc(db, "cultivos", id));
    if (!snap.exists()) continue;

    const cultivo = snap.data();
    const dataBase = new Date(cultivo.data);
    let cursor = new Date(dataBase);

    for (const ev of cultivo.eventos || []) {
      const ajuste = ev.ajuste || 0;
      const dias = ev.dias || 0;
      const nome = ev.nome || "Evento";

      const inicio = new Date(cursor);
      inicio.setDate(inicio.getDate() + ajuste);

      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + dias);

      for (const chave in semana) {
        const s = semana[chave];
        if (fim >= s.inicio && fim <= s.fim) {
          eventos[chave].push({ titulo: cultivo.titulo, nome, data: fim });
        }
      }

      cursor = new Date(fim);
    }
  }

  for (const chave in semana) {
    renderizarSticker(chave, semana[chave].inicio, semana[chave].fim, eventos[chave]);
  }
}

carregarRelatorio();
