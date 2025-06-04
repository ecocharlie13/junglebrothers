import { db } from "./firebase-init.js";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  Timestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let blocos = [];
let cultivoId = null;

const cores = {
  "CLONAR": "bg-purple-600",
  "VEGETAR": "bg-green-600",
  "FLORAR": "bg-orange-500",
  "FLUSH": "bg-blue-500",
  "PROCESSAR": "bg-red-500"
};

const blocosContainer = document.getElementById("blocos-container");
const inputDataInicio = document.getElementById("data-inicio");
const inputNome = document.getElementById("nome-cultivo");
const btnSalvar = document.getElementById("btn-salvar");

const params = new URLSearchParams(window.location.search);
if (params.has("id")) {
  cultivoId = params.get("id");
  carregarCultivoExistente(cultivoId);
}

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

function formatarData(dataStr) {
  if (!dataStr) return "--";
  const meses = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}-${meses[parseInt(mes) - 1]}-${ano}`;
}

function renderizarBlocos() {
  blocosContainer.innerHTML = "";
  const hoje = new Date();
  const contagemPorTipo = {};

  blocos.forEach((bloco, i) => {
    const tipo = bloco.nome;
    contagemPorTipo[tipo] = (contagemPorTipo[tipo] || 0) + 1;
    const semanaNumero = contagemPorTipo[tipo];

    const wrapper = document.createElement("div");
    wrapper.className = `w-60 bg-white shadow border rounded overflow-hidden`;

    let estiloExtra = "";
    const inicio = bloco.inicio ? new Date(bloco.inicio) : null;
    const fim = bloco.fim ? new Date(bloco.fim) : null;

    if (inicio && fim) {
      if (fim < hoje) {
        estiloExtra = "opacity-40";
      } else if (inicio <= hoje && fim >= hoje) {
        estiloExtra = "ring-4 ring-yellow-400";
      }
    }

    const header = document.createElement("div");
    header.className = `${bloco.cor} text-white px-4 py-2 cursor-pointer ${estiloExtra}`;
    header.innerHTML = `<strong>Semana ${semanaNumero} - ${tipo}</strong><br><span class="text-sm">${formatarData(bloco.inicio)} → ${formatarData(bloco.fim)}</span>`;
    header.addEventListener("click", () => {
      bloco.expandido = !bloco.expandido;
      renderizarBlocos();
    });

    const corpo = document.createElement("div");
    corpo.className = "p-4 text-sm";

    if (!bloco.expandido) {
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
      `;
    }

    wrapper.appendChild(header);
    wrapper.appendChild(corpo);
    blocosContainer.appendChild(wrapper);
  });
}

inputDataInicio.addEventListener("change", () => {
  const base = new Date(inputDataInicio.value);
  blocos.forEach((bloco, i) => {
    const ini = new Date(base);
    ini.setDate(ini.getDate() + i * 7);
    const fim = new Date(ini);
    fim.setDate(fim.getDate() + 6);
    bloco.inicio = ini.toISOString().split("T")[0];
    bloco.fim = fim.toISOString().split("T")[0];
  });
  renderizarBlocos();
});

function atualizarDados() {
  blocos.forEach((bloco, i) => {
    bloco.etapa = document.getElementById(`etapa-${i}`)?.value || bloco.etapa;
    bloco.fase = document.getElementById(`fase-${i}`)?.value || bloco.fase;
    bloco.estrategia = document.getElementById(`estrategia-${i}`)?.value || bloco.estrategia;
    bloco.receita.ec_entrada = document.getElementById(`ec-${i}`)?.value || bloco.receita.ec_entrada;
    bloco.receita.ppfd = document.getElementById(`ppfd-${i}`)?.value || bloco.receita.ppfd;
    bloco.notas = document.getElementById(`notas-${i}`)?.value || bloco.notas;
  });
}

document.getElementById("btn-salvar")?.addEventListener("click", salvarCultivo);

async function salvarCultivo() {
  atualizarDados();

  if (!inputDataInicio.value || !inputNome.value) {
    alert("Preencha o nome do cultivo e a data de início.");
    return;
  }

  const cultivo = {
    nome: inputNome.value,
    data_inicio: inputDataInicio.value,
    criado_em: Timestamp.now(),
    blocos
  };

  try {
    if (cultivoId) {
      await updateDoc(doc(db, "cultivos_blocos", cultivoId), cultivo);
      alert("Cultivo atualizado com sucesso!");
    } else {
      await addDoc(collection(db, "cultivos_blocos"), cultivo);
      alert("Cultivo salvo com sucesso!");
    }
  } catch (e) {
    console.error("Erro ao salvar:", e);
    alert("Erro ao salvar cultivo.");
  }
}

// Removido: salvarCultivo está agora registrado diretamente com addEventListener

async function carregarCultivoExistente(id) {
  try {
    const docSnap = await getDoc(doc(db, "cultivos_blocos", id));
    if (docSnap.exists()) {
      const dados = docSnap.data();
      inputDataInicio.value = dados.data_inicio;
      inputNome.value = dados.nome;
      blocos = dados.blocos || [];
      renderizarBlocos();
    }
  } catch (e) {
    console.error("Erro ao carregar cultivo:", e);
  }
}
