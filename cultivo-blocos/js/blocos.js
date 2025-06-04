import { db } from "./firebase-init.js";
import {
  collection,
  addDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let blocos = [];

const cores = {
  "CLONAR": "bg-purple-600",
  "VEGETAR": "bg-green-600",
  "FLORAR": "bg-orange-500",
  "FLUSH": "bg-blue-500",
  "PROCESSAR": "bg-red-500"
};

const blocosContainer = document.getElementById("blocos-container");
const inputDataInicio = document.getElementById("data-inicio");

// Adiciona um novo bloco
window.adicionarBloco = function(tipo) {
  if (!inputDataInicio.value) {
    alert("Selecione a data de início primeiro.");
    return;
  }

  const ordem = blocos.length;
  const inicio = calcularInicio(ordem);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);

  const novoBloco = {
    nome: tipo,
    etapa: "",
    fase: "",
    estrategia: "",
    ordem,
    inicio: inicio.toISOString().split("T")[0],
    fim: fim.toISOString().split("T")[0],
    receita: {
      ec_entrada: "",
      ec_saida: "",
      nutrientes: "",
      A: "",
      B: "",
      C: "",
      runoff: "",
      dryback: "",
      temperatura: "",
      ur: "",
      vpd: "",
      ppfd: ""
    },
    notas: "",
    tarefas: [],
    cor: cores[tipo]
  };

  blocos.push(novoBloco);
  renderizarBlocos();
};

// Calcula a data de início de um bloco com base na posição
function calcularInicio(ordem) {
  const dataInicial = new Date(inputDataInicio.value);
  dataInicial.setDate(dataInicial.getDate() + ordem * 7);
  return dataInicial;
}

// Renderiza os stickers na tela
function renderizarBlocos() {
  blocosContainer.innerHTML = "";

  blocos.forEach((bloco, i) => {
    const div = document.createElement("div");
    div.className = `w-60 p-4 text-white rounded shadow ${bloco.cor}`;
    div.innerHTML = `
      <div class="font-bold text-lg mb-1">Semana ${i + 1}</div>
      <div class="text-sm">${bloco.inicio} → ${bloco.fim}</div>
      <div class="mt-2 text-sm">Etapa: ${bloco.etapa || bloco.nome}</div>
      <div class="text-sm">EC In: ${bloco.receita.ec_entrada || "-"}</div>
      <div class="text-sm">PPFD: ${bloco.receita.ppfd || "-"}</div>
    `;
    blocosContainer.appendChild(div);
  });
}

// Salva todos os blocos no Firestore
window.salvarCultivo = async function () {
  if (!inputDataInicio.value || blocos.length === 0) {
    alert("Preencha a data de início e adicione ao menos um bloco.");
    return;
  }

  const cultivo = {
    data_inicio: inputDataInicio.value,
    criado_em: Timestamp.now(),
    blocos
  };

  try {
    await addDoc(collection(db, "cultivos_blocos"), cultivo);
    alert("Cultivo salvo com sucesso!");
    blocos = [];
    renderizarBlocos();
  } catch (e) {
    console.error("Erro ao salvar:", e);
    alert("Erro ao salvar cultivo.");
  }
};
