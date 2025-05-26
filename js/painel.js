import { auth, db } from "./firebase-init.js";
import { verificarLogin, sair } from "./auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const emailSpan = document.getElementById("user-email");
const userPic = document.getElementById("user-pic");
const logoutBtn = document.getElementById("logout");
const periodoSelect = document.getElementById("periodo");
const exibirPassadosCheckbox = document.getElementById("exibir-passados");
const eventosConcluidosDiv = document.getElementById("eventos-concluidos");
const eventosAtuaisDiv = document.getElementById("eventos-atuais");
const eventosProximosDiv = document.getElementById("eventos-proximos");
const ganttContainer = document.getElementById("gantt-container");

let cultivos = [];

verificarLogin(async (user) => {
  emailSpan.textContent = user.email;
  userPic.src = user.photoURL;
  logoutBtn.addEventListener("click", sair);
  await carregarCultivos(user.email);
  renderizarPainel();
});

async function carregarCultivos(email) {
  const q = query(collection(db, "cultivos"), where("usuario", "==", email));
  const snap = await getDocs(q);
  cultivos = [];
  snap.forEach((docSnap) => {
    cultivos.push({ id: docSnap.id, ...docSnap.data() });
  });
  cultivos.sort((a, b) => new Date(a.data) - new Date(b.data));
}

function renderizarPainel() {
  eventosConcluidosDiv.innerHTML = "";
  eventosAtuaisDiv.innerHTML = "";
  eventosProximosDiv.innerHTML = "";
  ganttContainer.innerHTML = "";

  const hoje = new Date();
  const mostrarPassados = exibirPassadosCheckbox.checked;
  const coresCiclo = {};
  let corIndex = 0;
  const cores = ["#4ade80", "#60a5fa", "#f472b6", "#facc15", "#34d399"];

  cultivos.forEach((cultivo, idx) => {
    if (!coresCiclo[cultivo.id]) {
      coresCiclo[cultivo.id] = cores[corIndex % cores.length];
      corIndex++;
    }
    const cor = coresCiclo[cultivo.id];
    let inicio = new Date(cultivo.data);

    cultivo.eventos.forEach((ev, i) => {
      inicio.setDate(inicio.getDate() + (parseInt(ev.ajuste) || 0));
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + (parseInt(ev.dias) || 0));

      if (!mostrarPassados && fim < hoje) return;

      const eventoHTML = `<p><strong>${cultivo.titulo}</strong> - ${ev.evento} - ${formatarData(fim)}</p>`;

      if (fim < hoje) {
        eventosConcluidosDiv.innerHTML += eventoHTML;
      } else if (inicio <= hoje && fim >= hoje) {
        eventosAtuaisDiv.innerHTML += eventoHTML;
      } else {
        eventosProximosDiv.innerHTML += eventoHTML;
      }

      const barra = document.createElement("div");
      barra.className = "rounded h-6 text-xs text-white text-center truncate";
      barra.textContent = `${cultivo.titulo} - ${ev.evento}`;
      barra.style.background = cor;
      barra.style.marginBottom = "8px";
      barra.style.width = `${(ev.dias || 1) * 10}px`;

      ganttContainer.appendChild(barra);
      inicio = new Date(fim);
    });
  });
}

function formatarData(data) {
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

periodoSelect.addEventListener("change", renderizarPainel);
exibirPassadosCheckbox.addEventListener("change", renderizarPainel);
