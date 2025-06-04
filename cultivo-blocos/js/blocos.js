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
    cor: cores[tipo],
    expandido: false
  };

  blocos.push(novoBloco);
  renderizarBlocos();
};

function calcularInicio(ordem) {
  const dataInicial = new Date(inputDataInicio.value);
  dataInicial.setDate(dataInicial.getDate() + ordem * 7);
  return dataInicial;
}

function renderizarBlocos() {
  blocosContainer.innerHTML = "";

  blocos.forEach((bloco, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = `w-60 bg-white shadow border rounded overflow-hidden`;

    const expandido = bloco.expandido ?? false;

    const header = document.createElement("div");
    header.className = `${bloco.cor} text-white px-4 py-2 cursor-pointer`;
    header.innerHTML = `<strong>Semana ${i + 1}</strong><br><span class="text-sm">${bloco.inicio} → ${bloco.fim}</span>`;
    header.addEventListener("click", () => {
      bloco.expandido = !expandido;
      renderizarBlocos();
    });

    const corpo = document.createElement("div");
    corpo.className = "p-4 text-sm";
    
    if (!expandido) {
      corpo.innerHTML = `
        <div><strong>${bloco.nome}</strong></div>
        <div>Etapa: ${bloco.etapa || "-"}</div>
        <div>EC In: ${bloco.receita.ec_entrada || "-"}</div>
        <div>PPFD: ${bloco.receita.ppfd || "-"}</div>
      `;
    } else {
      corpo.innerHTML = `
        <label class="block mb-1">Etapa: <input type="text" class="w-full border px-2 py-1 rounded" value="${bloco.etapa || ""}" id="etapa-${i}"></label>
        <label class="block mb-1">Fase: <input type="text" class="w-full border px-2 py-1 rounded" value="${bloco.fase || ""}" id="fase-${i}"></label>
        <label class="block mb-1">Estratégia: <input type="text" class="w-full border px-2 py-1 rounded" value="${bloco.estrategia || ""}" id="estrategia-${i}"></label>
        <label class="block mb-1">EC Entrada: <input type="text" class="w-full border px-2 py-1 rounded" value="${bloco.receita.ec_entrada || ""}" id="ec-${i}"></label>
        <label class="block mb-1">PPFD: <input type="text" class="w-full border px-2 py-1 rounded" value="${bloco.receita.ppfd || ""}" id="ppfd-${i}"></label>
        <label class="block mb-2">Notas: <textarea class="w-full border px-2 py-1 rounded" id="notas-${i}">${bloco.notas || ""}</textarea></label>
        <button class="bg-green-600 text-white px-3 py-1 rounded w-full" onclick="salvarBloco(${i})">💾 Salvar</button>
      `;
    }

    wrapper.appendChild(header);
    wrapper.appendChild(corpo);
    blocosContainer.appendChild(wrapper);
  });
}

window.salvarBloco = function (index) {
  const bloco = blocos[index];
  bloco.etapa = document.getElementById(`etapa-${index}`).value;
  bloco.fase = document.getElementById(`fase-${index}`).value;
  bloco.estrategia = document.getElementById(`estrategia-${index}`).value;
  bloco.receita.ec_entrada = document.getElementById(`ec-${index}`).value;
  bloco.receita.ppfd = document.getElementById(`ppfd-${index}`).value;
  bloco.notas = document.getElementById(`notas-${index}`).value;

  blocos[index] = bloco;
  renderizarBlocos();
};

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
