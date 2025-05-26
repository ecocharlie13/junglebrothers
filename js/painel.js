import { auth, db } from "./firebase-init.js";
import { verificarLogin, sair } from "./auth.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let eventosMap = {};
let mostrarPassados = false;

verificarLogin(async (user) => {
  const emailSpan = document.getElementById("user-email");
  const userPic = document.getElementById("user-pic");
  const logoutBtn = document.getElementById("logout");

  if (!emailSpan || !userPic || !logoutBtn) return;

  emailSpan.textContent = user.email;
  userPic.src = user.photoURL;
  logoutBtn.addEventListener("click", sair);

  const snap = await getDocs(query(collection(db, "cultivos"), where("usuario", "==", user.email)));
  snap.forEach(docSnap => {
    eventosMap[docSnap.id] = docSnap.data();
  });

  const hojeSpan = document.getElementById("data-hoje");
  if (hojeSpan) {
    hojeSpan.textContent = new Date().toLocaleDateString("pt-BR", {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  const verBtn = document.getElementById("ver");
  const checkPassados = document.getElementById("exibir-passados");

  if (verBtn) verBtn.addEventListener("click", renderizarDashboard);
  if (checkPassados) checkPassados.addEventListener("change", (e) => {
    mostrarPassados = e.target.checked;
    renderizarDashboard();
  });

  renderizarDashboard();
});

function renderizarDashboard() {
  atualizarStickers();
  atualizarGantt();
}

function atualizarStickers() {
  const hoje = new Date();
  const concluidos = [], atuais = [], proximos = [];

  for (const cultivo of Object.values(eventosMap)) {
    const eventos = cultivo.eventos;
    const base = new Date(cultivo.data);

    eventos.forEach(ev => {
      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() + (parseInt(ev.ajuste) || 0));
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + (parseInt(ev.dias) || 0));

      const label = `<strong>${cultivo.titulo}</strong><br>${ev.evento} - ${fim.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}`;

      if (fim < hoje) {
        concluidos.push(label);
      } else if (inicio <= hoje && fim >= hoje) {
        atuais.push(label);
      } else {
        proximos.push(label);
      }
    });
  }

  const stickers = document.getElementById("stickers");
  if (!stickers) return;
  stickers.innerHTML = "";

  renderSticker("Eventos Concluídos", concluidos, "bg-blue-100");
  renderSticker("Eventos Atuais", atuais, "bg-yellow-100");
  renderSticker("Próximos Eventos", proximos, "bg-green-100");
}

function renderSticker(titulo, lista, cor) {
  const div = document.createElement("div");
  div.className = `p-4 rounded shadow ${cor}`;
  div.innerHTML = `<h3 class='font-bold mb-2'>${titulo}</h3>` + lista.map(l => `<div class='text-sm mb-1'>${l}</div>`).join("");
  document.getElementById("stickers").appendChild(div);
}

function atualizarGantt() {
  const canvas = document.getElementById("ganttChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (window.ganttChart) window.ganttChart.destroy();

  const datasets = [];
  const hoje = new Date();
  let corIndex = 0;
  const cores = ["#7e22ce", "#2563eb", "#16a34a", "#eab308", "#dc2626"];

  const sorted = Object.entries(eventosMap).sort((a, b) =>
    new Date(a[1].data) - new Date(b[1].data)
  );

  for (const [_, cultivo] of sorted) {
    const base = new Date(cultivo.data);
    for (const ev of cultivo.eventos) {
      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() + (parseInt(ev.ajuste) || 0));
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + (parseInt(ev.dias) || 0));

      if (!mostrarPassados && fim < hoje) continue;

      datasets.push({
        label: `${cultivo.titulo} - ${ev.evento}`,
        backgroundColor: cores[corIndex % cores.length],
        data: [{
          x: [inicio, fim],
          y: cultivo.titulo
        }]
      });
    }
    corIndex++;
  }

  window.ganttChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [...new Set(sorted.map(([_, c]) => c.titulo))],
      datasets
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
            tooltipFormat: "dd MMM yyyy",
            displayFormats: { day: "dd MMM" }
          }
        }
      }
    }
  });
}
