import { db } from "/cultivoapp/js/firebase-init.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

function formatarData(data) {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function obterIntervaloSemana(offset = 0) {
  const hoje = new Date();
  const domingo = new Date(hoje);
  domingo.setDate(hoje.getDate() - hoje.getDay() + offset * 7);
  const sabado = new Date(domingo);
  sabado.setDate(domingo.getDate() + 6);
  return { inicio: domingo, fim: sabado };
}

function renderizarSticker(stickerId, dataInicio, dataFim, eventos) {
  document.getElementById(`data-${stickerId}`).textContent = `(${formatarData(dataInicio)} - ${formatarData(dataFim)})`;
  const lista = document.getElementById(`lista-${stickerId}`);
  lista.innerHTML = "";
  eventos.forEach(({ titulo, nome, data }) => {
    const li = document.createElement("li");
    li.textContent = `– ${titulo}: ${nome} / ${formatarData(new Date(data))}`;
    lista.appendChild(li);
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

    const cultivo = snap.data();
    const { titulo, data: dataInicial, eventos } = cultivo;
    let dataBase = new Date(dataInicial);

    for (const ev of eventos) {
      const inicio = new Date(dataBase);
      inicio.setDate(inicio.getDate() + (ev.ajuste || 0));
      const fim = new Date(inicio);
      fim.setDate(inicio.getDate() + (ev.dias || 0));

      const semana = fim >= semanaPassada.inicio && fim <= semanaPassada.fim
        ? "passada"
        : fim >= semanaAtual.inicio && fim <= semanaAtual.fim
        ? "atual"
        : fim >= semanaSeguinte.inicio && fim <= semanaSeguinte.fim
        ? "seguinte"
        : null;

      if (semana) {
        eventosPorSemana[semana].push({
          titulo,
          nome: ev.nome || "Evento sem nome",
          data: fim
        });
      }

      dataBase = fim;
    }
  }

  renderizarSticker("passada", semanaPassada.inicio, semanaPassada.fim, eventosPorSemana.passada);
  renderizarSticker("atual", semanaAtual.inicio, semanaAtual.fim, eventosPorSemana.atual);
  renderizarSticker("seguinte", semanaSeguinte.inicio, semanaSeguinte.fim, eventosPorSemana.seguinte);
}

carregarRelatorio();
