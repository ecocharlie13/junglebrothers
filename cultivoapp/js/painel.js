import { auth, db } from "/cultivoapp/js/firebase-init.js";
import { verificarLogin, sair } from "./auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const semanaInicio = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // domingo
  return d;
};

const semanaFim = (date) => {
  const d = semanaInicio(date);
  d.setDate(d.getDate() + 6);
  return d;
};

const formatarData = (iso) => {
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const d = new Date(iso);
  return `${d.getDate()} ${meses[d.getMonth()]}`;
};

const corAleatoria = () => `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

verificarLogin(async (user) => {
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;
  document.getElementById("logout").addEventListener("click", sair);

  const hoje = new Date();
  const inicioSemanaAtual = semanaInicio(hoje);
  const fimSemanaAtual = semanaFim(hoje);

  const inicioSemanaAnterior = new Date(inicioSemanaAtual);
  inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7);
  const fimSemanaAnterior = new Date(inicioSemanaAtual);
  fimSemanaAnterior.setDate(fimSemanaAnterior.getDate() - 1);

  const inicioSemanaSeguinte = new Date(fimSemanaAtual);
  inicioSemanaSeguinte.setDate(inicioSemanaSeguinte.getDate() + 1);
  const fimSemanaSeguinte = new Date(fimSemanaAtual);
  fimSemanaSeguinte.setDate(fimSemanaSeguinte.getDate() + 7);

  document.getElementById("subtitulo").textContent = `${formatarData(inicioSemanaAtual.toISOString())} - ${formatarData(fimSemanaAtual.toISOString())}`;

  const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];
  const eventosPorSemana = { anterior: [], atual: [], seguinte: [] };
  const tarefasGantt = [];

  for (const id of selecionados) {
    const snap = await getDoc(doc(db, "cultivos", id));
    if (!snap.exists()) continue;
    const cultivo = snap.data();
    const cor = corAleatoria();

    for (const evento of cultivo.eventos) {
      const ini = new Date(evento.data_inicio);
      const fim = new Date(evento.data_fim);

      tarefasGantt.push({
        id: `${id}-${evento.nome}`,
        name: evento.nome,
        start: evento.data_inicio,
        end: evento.data_fim,
        progress: 100,
        custom_class: "",
        color: cor,
      });

      if (fim >= inicioSemanaAnterior && fim <= fimSemanaAnterior) {
        eventosPorSemana.anterior.push(evento);
      } else if (fim >= inicioSemanaAtual && fim <= fimSemanaAtual) {
        eventosPorSemana.atual.push(evento);
      } else if (fim >= inicioSemanaSeguinte && fim <= fimSemanaSeguinte) {
        eventosPorSemana.seguinte.push(evento);
      }
    }
  }

  const stickersDiv = document.getElementById("stickers");
  const blocos = [
    { cor: "bg-blue-100 border-blue-400 text-blue-800", eventos: eventosPorSemana.anterior, titulo: "Semana Passada" },
    { cor: "bg-yellow-100 border-yellow-400 text-yellow-800", eventos: eventosPorSemana.atual, titulo: "Semana Atual" },
    { cor: "bg-green-100 border-green-400 text-green-800", eventos: eventosPorSemana.seguinte, titulo: "Semana Seguinte" },
  ];

  blocos.forEach(({ cor, eventos, titulo }) => {
    const div = document.createElement("div");
    div.className = `border-l-4 p-4 rounded shadow ${cor}`;
    const h3 = document.createElement("h3");
    h3.className = "font-semibold mb-1";
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
        li.textContent = `${ev.nome} (${formatarData(ev.data_fim)})`;
        ul.appendChild(li);
      });
      div.appendChild(ul);
    }
    stickersDiv.appendChild(div);
  });

  if (window.Gantt) {
    const gantt = new Gantt("#gantt", tarefasGantt, {
      view_mode: "Day",
      date_format: "YYYY-MM-DD",
      custom_popup_html: null,
    });

    // linha de hoje
    const svg = document.querySelector("#gantt svg");
    const hojeX = gantt.getXCoordinateForDate(new Date().toISOString().split("T")[0]);
    const height = svg.getBoundingClientRect().height;
    const linha = document.createElementNS("http://www.w3.org/2000/svg", "line");
    linha.setAttribute("x1", hojeX);
    linha.setAttribute("x2", hojeX);
    linha.setAttribute("y1", "0");
    linha.setAttribute("y2", height.toString());
    linha.setAttribute("stroke", "red");
    linha.setAttribute("stroke-width", "1");
    svg.appendChild(linha);
  }
});
