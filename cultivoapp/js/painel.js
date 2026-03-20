import { auth, db } from "/cultivoapp/js/firebase-init.js";
import { verificarLogin, sair } from "/cultivoapp/js/auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Utilidades
const formatarData = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};
const hoje = new Date();
const domingo = new Date(hoje);
domingo.setDate(domingo.getDate() - domingo.getDay());
const sabado = new Date(domingo);
sabado.setDate(sabado.getDate() + 6);
const anteriorIni = new Date(domingo);
anteriorIni.setDate(anteriorIni.getDate() - 7);
const anteriorFim = new Date(domingo);
anteriorFim.setDate(anteriorFim.getDate() - 1);
const seguinteIni = new Date(sabado);
seguinteIni.setDate(seguinteIni.getDate() + 1);
const seguinteFim = new Date(sabado);
seguinteFim.setDate(seguinteFim.getDate() + 7);

// Início
verificarLogin(async (user) => {
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;
  document.getElementById("logout").addEventListener("click", sair);
  document.getElementById("subtitulo").textContent = `${formatarData(domingo)} - ${formatarData(sabado)}`;

  const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];
  const eventosSemana = { passada: [], atual: [], seguinte: [] };
  const tarefas = [];

  for (const cultivoId of selecionados) {
    const snap = await getDoc(doc(db, "cultivos", cultivoId));
    if (!snap.exists()) continue;

    const cultivo = snap.data();
    const dataInicial = new Date(cultivo.data);
    const eventos = cultivo.eventos || [];
    let dataBase = new Date(dataInicial);
    const cor = `hsl(${Math.random() * 360}, 70%, 60%)`;

    eventos.forEach((ev, i) => {
      const ajuste = parseInt(ev.ajuste ?? 0);
      const dias = parseInt(ev.dias ?? 1);
      const nome = ev.nome || `Evento ${i + 1}`;

      const dataInicio = new Date(dataBase);
      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() + dias);

      tarefas.push({
        id: `${cultivoId}-${i + 1}`,
        name: nome,
        start: dataInicio.toISOString().slice(0, 10),
        end: dataFim.toISOString().slice(0, 10),
        progress: 100,
        color: cor
      });

      // Classificação semanal
      if (dataFim >= anteriorIni && dataFim <= anteriorFim) eventosSemana.passada.push({ nome, fim: new Date(dataFim) });
      else if (dataFim >= domingo && dataFim <= sabado) eventosSemana.atual.push({ nome, fim: new Date(dataFim) });
      else if (dataFim >= seguinteIni && dataFim <= seguinteFim) eventosSemana.seguinte.push({ nome, fim: new Date(dataFim) });

      dataBase = new Date(dataFim);
      dataBase.setDate(dataBase.getDate() + ajuste);
    });
  }

  // Stickers
  const stickersDiv = document.getElementById("stickers");
  const grupos = [
    { titulo: "Semana Passada", cor: "bg-blue-100 border-blue-500 text-blue-800", eventos: eventosSemana.passada },
    { titulo: "Semana Atual", cor: "bg-yellow-100 border-yellow-500 text-yellow-800", eventos: eventosSemana.atual },
    { titulo: "Semana Seguinte", cor: "bg-green-100 border-green-500 text-green-800", eventos: eventosSemana.seguinte }
  ];

  grupos.forEach(({ titulo, cor, eventos }) => {
    const div = document.createElement("div");
    div.className = `p-4 rounded border-l-4 ${cor}`;
    const h3 = document.createElement("h3");
    h3.className = "font-semibold mb-2 text-lg";
    h3.textContent = titulo;
    div.appendChild(h3);

    if (eventos.length === 0) {
      const p = document.createElement("p");
      p.textContent = "Nenhum evento.";
      div.appendChild(p);
    } else {
      const ul = document.createElement("ul");
      eventos.forEach(ev => {
        const li = document.createElement("li");
        li.textContent = `${ev.nome} (${formatarData(ev.fim.toISOString())})`;
        ul.appendChild(li);
      });
      div.appendChild(ul);
    }

    stickersDiv.appendChild(div);
  });

  // Gantt
  if (window.Gantt) {
    new Gantt("#gantt", tarefas);
    console.log("✅ Gantt renderizado");
  } else {
    console.warn("⚠️ Gantt.js não disponível");
  }
});
