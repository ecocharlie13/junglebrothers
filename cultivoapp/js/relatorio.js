import { db } from "/cultivoapp/js/firebase-init.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

function formatarData(data) {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function obterIntervaloSemana(offset = 0) {
  const hoje = new Date();
  const domingo = new Date(hoje.setDate(hoje.getDate() - hoje.getDay() + offset * 7));
  const sabado = new Date(domingo);
  sabado.setDate(domingo.getDate() + 6);
  return { inicio: domingo, fim: sabado };
}

function renderizarSticker(id, dataInicio, dataFim, eventos) {
  document.getElementById(`data-${id}`).textContent = `(${formatarData(dataInicio)} - ${formatarData(dataFim)})`;
  const ul = document.getElementById(`lista-${id}`);
  ul.innerHTML = "";
  eventos.forEach(({ titulo, evento, data }) => {
    const li = document.createElement("li");
    li.textContent = `– ${titulo}: ${evento} / ${formatarData(new Date(data))}`;
    ul.appendChild(li);
  });
}

async function carregarRelatorio() {
  const ids = JSON.parse(localStorage.getItem("cultivosSelecionados") || "[]");
  if (!ids.length) return;

  const semanaPassada = obterIntervaloSemana(-1);
  const semanaAtual = obterIntervaloSemana(0);
  const semanaSeguinte = obterIntervaloSemana(1);

  const eventosPorSemana = {
    passada: [],
    atual: [],
    seguinte: [],
  };

  for (const id of ids) {
    const snap = await getDoc(doc(db, "cultivos", id));
    if (!snap.exists()) continue;

    const { titulo, data, eventos } = snap.data();
    let base = new Date(data);

    for (const ev of eventos) {
      const ini = new Date(base);
      ini.setDate(ini.getDate() + (ev.ajuste || 0));
      const fim = new Date(ini);
      fim.setDate(fim.getDate() + (ev.dias || 0));

      const semana =
        fim >= semanaPassada.inicio && fim <= semanaPassada.fim ? "passada" :
        fim >= semanaAtual.inicio && fim <= semanaAtual.fim ? "atual" :
        fim >= semanaSeguinte.inicio && fim <= semanaSeguinte.fim ? "seguinte" : null;

      if (semana) {
        eventosPorSemana[semana].push({
          titulo,
          evento: ev.evento || "Evento",
          data: fim,
        });
      }

      base = fim;
    }
  }

  renderizarSticker("passada", semanaPassada.inicio, semanaPassada.fim, eventosPorSemana.passada);
  renderizarSticker("atual", semanaAtual.inicio, semanaAtual.fim, eventosPorSemana.atual);
  renderizarSticker("seguinte", semanaSeguinte.inicio, semanaSeguinte.fim, eventosPorSemana.seguinte);
}

carregarRelatorio();
