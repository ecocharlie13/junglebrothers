import { auth, db } from "/cultivoapp/js/firebase-init.js";
import { verificarLogin, sair } from "/cultivoapp/js/auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Utilitários
const formatarData = (iso) => {
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const d = new Date(iso);
  return `${d.getDate()} ${meses[d.getMonth()]}`;
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

  document.getElementById("subtitulo").textContent = `${formatarData(domingo.toISOString())} - ${formatarData(sabado.toISOString())}`;

  const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];
  const eventosSemana = { passada: [], atual: [], seguinte: [] };
  const tarefas = [];

  for (const id of selecionados) {
    const snap = await getDoc(doc(db, "cultivos", id));
    if (!snap.exists()) continue;

    const cultivo = snap.data();
    const cor = `hsl(${Math.random() * 360}, 70%, 60%)`;

    cultivo.eventos?.forEach((evento, index) => {
      const ini = new Date(evento.data_inicio);
      const fim = new Date(evento.data_fim);
      const nome = evento.nome || `Evento ${index + 1}`;

      // Agrupamento visual
      if (fim >= anteriorIni && fim <= anteriorFim) eventosSemana.passada.push({ nome, fim });
      else if (fim >= domingo && fim <= sabado) eventosSemana.atual.push({ nome, fim });
      else if (fim >= seguinteIni && fim <= seguinteFim) eventosSemana.seguinte.push({ nome, fim });

      // Gantt
      tarefas.push({
        id: `${id}-${index + 1}`,
        name: nome,
        start: evento.data_inicio,
        end: evento.data_fim,
        progress: 100,
        custom_class: "",
        color: cor,
      });
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
    const gantt = new Gantt("#gantt", tarefas, {
      view_mode: "Day",
      date_format: "YYYY-MM-DD",
    });
    console.log("✅ Gantt renderizado");
  } else {
    console.warn("⚠️ Gantt.js não carregado");
  }
});
