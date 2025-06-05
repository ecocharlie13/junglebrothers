// ==========================
// ✅ ARQUIVO 2: bloco.js
// ==========================

import { db } from "./firebase-init.js";
import {
  collection,
  addDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let blocos = [];
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

window.adicionarBloco = function (tipo) {
  const ordem = blocos.length;
  const inicio = new Date(inputDataInicio.value);
  inicio.setDate(inicio.getDate() + ordem * 7);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);

  blocos.push({
    nome: tipo,
    inicio: inicio.toISOString().split("T")[0],
    fim: fim.toISOString().split("T")[0],
    etapa: "",
    fase: "",
    estrategia: "",
    receita: {},
    notas: "",
    ordem,
    cor: cores[tipo],
  });

  renderizarBlocos();
};

function renderizarBlocos() {
  blocosContainer.innerHTML = "";
  blocos.forEach((b, i) => {
    const div = document.createElement("div");
    div.className = `${b.cor} p-4 rounded shadow text-white`;
    div.innerHTML = `
      <h2 class="font-bold mb-2">${b.nome} #${i + 1}</h2>
      <p>Início: ${b.inicio}</p>
      <p>Fim: ${b.fim}</p>
    `;
    blocosContainer.appendChild(div);
  });
}

btnSalvar.addEventListener("click", async () => {
  if (!inputNome.value || !inputDataInicio.value || blocos.length === 0) {
    alert("Preencha os campos e adicione ao menos um bloco.");
    return;
  }
  await addDoc(collection(db, "cultivos"), {
    nome: inputNome.value,
    inicio: inputDataInicio.value,
    blocos,
    criado_em: Timestamp.now(),
  });
  alert("Cultivo salvo com sucesso!");
});
