// blocos.js

import { db } from "./firebase-init.js";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  Timestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { verificarLogin } from "./auth.js";

let blocos = [];
let cultivoId = null;

const cores = {
  CLONAR: "bg-purple-600",
  VEGETAR: "bg-green-600",
  FLORAR: "bg-orange-500",
  FLUSH: "bg-blue-500",
  PROCESSAR: "bg-red-500",
};

const blocosContainer = document.getElementById("blocos-container");
const inputDataInicio = document.getElementById("data-inicio");
const inputNome = document.getElementById("nome-cultivo");
const btnSalvar = document.getElementById("btn-salvar");

verificarLogin(async (user) => {
  document.getElementById("conteudo-principal").style.display = "block";
});

window.adicionarBloco = function (tipo) {
  if (!inputDataInicio.value) {
    alert("Selecione a data de início primeiro.");
    return;
  }

  const ordem = blocos.length;
  const inicio = new Date(inputDataInicio.value);
  inicio.setDate(inicio.getDate() + ordem * 7);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);

  const bloco = {
    nome: tipo,
    ordem,
    inicio: inicio.toISOString().split("T")[0],
    fim: fim.toISOString().split("T")[0],
    etapa: "",
    fase: "",
    estrategia: "",
    receita: {
      ec_entrada: "",
      ph_entrada: "",
      nutrientes: "",
      receita: "",
      ec_saida: "",
      runoff: "",
      dryback: "",
      temperatura: "",
      ur: "",
      vpd: "",
      ppfd: "",
    },
    notas: "",
    cor: cores[tipo],
  };

  blocos.push(bloco);
  renderizarBlocos();
};

function renderizarBlocos() {
  blocosContainer.innerHTML = "";

  blocos.forEach((bloco, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "bg-white p-4 shadow border rounded";

    wrapper.innerHTML = `
      <h2 class="font-bold text-lg mb-2">${bloco.nome} (Semana ${i + 1})</h2>
      <p class="text-sm mb-2 text-gray-600">${bloco.inicio} a ${bloco.fim}</p>

      <label>Etapa:
        <select id="etapa-${i}" class="w-full border rounded px-2 py-1">
          <option value="">Selecione</option>
          <option value="germinacao">Germinação</option>
          <option value="vega">Vega</option>
          <option value="flora">Flora</option>
        </select>
      </label>

      <label>Fase:
        <input type="text" id="fase-${i}" class="w-full border rounded px-2 py-1" />
      </label>

      <label>Estratégia:
        <select id="estrategia-${i}" class="w-full border rounded px-2 py-1">
          <option value="">Selecione</option>
          <option value="clonagem">Clonagem</option>
          <option value="vegetativo">Vegetativo</option>
          <option value="generativo">Generativo</option>
        </select>
      </label>

      <label>Notas:
        <textarea id="notas-${i}" class="w-full border rounded px-2 py-1"></textarea>
      </label>
    `;

    blocosContainer.appendChild(wrapper);
  });
}

btnSalvar.addEventListener("click", async () => {
  const nome = inputNome.value;
  const data = inputDataInicio.value;
  if (!nome || !data) return alert("Preencha nome e data.");

  blocos.forEach((bloco, i) => {
    bloco.etapa = document.getElementById(`etapa-${i}`)?.value || "";
    bloco.fase = document.getElementById(`fase-${i}`)?.value || "";
    bloco.estrategia = document.getElementById(`estrategia-${i}`)?.value || "";
    bloco.notas = document.getElementById(`notas-${i}`)?.value || "";
  });

  try {
    await addDoc(collection(db, "cultivos_blocos"), {
      nome,
      data_inicio: data,
      blocos,
      criado_em: Timestamp.now(),
    });
    alert("Cultivo salvo com sucesso.");
  } catch (e) {
    console.error(e);
    alert("Erro ao salvar cultivo.");
  }
});
