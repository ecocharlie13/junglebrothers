import { db } from "/cultivoapp/js/firebase-init.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import "/cultivoapp/js/frappe-gantt.min.js";

const container = document.getElementById("gantt");
const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados") || "[]");

if (!container) throw new Error("Elemento #gantt não encontrado");

const tarefas = [];

(async () => {
  for (const id of selecionados) {
    const snap = await getDoc(doc(db, "cultivos", id));
    if (!snap.exists()) continue;

    const cultivo = snap.data();
    let inicio = new Date(cultivo.data);

    cultivo.eventos.forEach((ev, i) => {
      const ini = new Date(inicio);
      ini.setDate(ini.getDate() + (ev.ajuste || 0));
      const fim = new Date(ini);
      fim.setDate(fim.getDate() + (ev.dias || 0));

      tarefas.push({
        id: `${id}-${i}`,
        name: `${ev.evento}`,
        start: ini.toISOString().split("T")[0],
        end: fim.toISOString().split("T")[0],
        progress: 100,
        custom_class: "",
        cultivo: cultivo.titulo
      });

      inicio = fim;
    });
  }

  if (tarefas.length === 0) {
    container.innerHTML = "<p class='text-center text-gray-600'>Nenhum cultivo selecionado.</p>";
    return;
  }

  const cores = {};
  tarefas.forEach((t) => {
    if (!cores[t.cultivo]) {
      const h = Math.floor(Math.random() * 360);
      cores[t.cultivo] = `hsl(${h}, 70%, 60%)`;
    }
    t.color = cores[t.cultivo];
  });

  const svgContainer = document.createElement("div");
  container.appendChild(svgContainer);

  const gantt = new Gantt(svgContainer, tarefas, {
    view_mode: "Day",
    date_format: "YYYY-MM-DD",
    custom_popup_html: null,
  });

  // Linha do dia atual
  const hojeX = gantt.getXCoordinateForDate(new Date().toISOString().split("T")[0]);
  const svg = container.querySelector("svg");
  const height = svg?.getBoundingClientRect().height || 300;
  const linha = document.createElementNS("http://www.w3.org/2000/svg", "line");
  linha.setAttribute("x1", hojeX);
  linha.setAttribute("x2", hojeX);
  linha.setAttribute("y1", "0");
  linha.setAttribute("y2", height.toString());
  linha.setAttribute("stroke", "red");
  linha.setAttribute("stroke-width", "1");
  svg?.appendChild(linha);
})();
