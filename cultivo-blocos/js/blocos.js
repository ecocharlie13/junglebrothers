import { db } from "./firebase-init.js";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  Timestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/modular/sortable.esm.js";

// Configurações
const CORES = {
  CLONAR: "bg-purple-600",
  VEGETAR: "bg-green-600",
  FLORAR: "bg-orange-500",
  FLUSH: "bg-blue-500",
  PROCESSAR: "bg-red-500",
};

const ETAPAS = [
  "PROPAGAR",
  "VEGETAR",
  "INÍCIO DE FLORA",
  "MEIO DE FLORA",
  "FIM DE FLORA",
  "FLUSH",
];

const FASES = ["PROPAGAR", "VEGETAR", "ESTIRAMENTO", "VOLUME", "ACABAMENTO"];
const ESTRATEGIAS = ["PROPAGAR", "VEGETATIVO", "GENERATIVO", "MISTO (VEG/GEN)"];

// Estado
let blocos = [];
let cultivoId = null;

// Elementos DOM
const DOM = {
  blocosContainer: document.getElementById("blocos-container"),
  inputDataInicio: document.getElementById("data-inicio"),
  inputNome: document.getElementById("nome-cultivo"),
  btnSalvar: document.getElementById("btn-salvar"),
  colheitaInfo: document.getElementById("colheita-info"),
  diaInfo: document.getElementById("dia-info"),
};

// Inicialização
const params = new URLSearchParams(window.location.search);
if (params.has("id")) {
  cultivoId = params.get("id");
  carregarCultivoExistente(cultivoId);
}

// Funções utilitárias
function createElementWithProps(tag, props = {}, children = []) {
  const element = document.createElement(tag);
  Object.assign(element, props);
  children.forEach((child) => element.appendChild(child));
  return element;
}

function formatarData(dataStr) {
  if (!dataStr) return "--";
  const meses = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}-${meses[parseInt(mes) - 1]}-${ano}`;
}

function calcularInicio(ordem, dataInicial) {
  const inicio = new Date(dataInicial);
  inicio.setDate(inicio.getDate() + ordem * 7);
  return inicio;
}

// Funções de blocos
window.adicionarBloco = function (tipo) {
  if (!DOM.inputDataInicio.value) {
    alert("Selecione a data de início primeiro.");
    return;
  }

  const ordem = blocos.length;
  const inicio = calcularInicio(ordem, DOM.inputDataInicio.value);
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
      ppfd: "",
    },
    notas: "",
    tarefas: [],
    cor: CORES[tipo],
    expandido: false,
  };

  blocos.push(novoBloco);
  renderizarBlocos();
};

function renderizarBlocos() {
  DOM.blocosContainer.innerHTML = "";
  const hoje = new Date();
  const contagemPorTipo = {};

  blocos.forEach((bloco, i) => {
    const tipo = bloco.nome;
    contagemPorTipo[tipo] = (contagemPorTipo[tipo] || 0) + 1;
    const semanaNumero = contagemPorTipo[tipo];

    const inicio = bloco.inicio ? new Date(bloco.inicio) : null;
    const fim = bloco.fim ? new Date(bloco.fim) : null;
    const estiloExtra = inicio && fim ? (fim < hoje ? "opacity-40" : inicio <= hoje && fim >= hoje ? "ring-4 ring-yellow-400" : "") : "";

    const header = createElementWithProps("div", {
      className: `${bloco.cor} text-white px-4 py-2 cursor-pointer ${estiloExtra}`,
      innerHTML: `<strong>Semana ${semanaNumero} - ${tipo}</strong><br><span class="text-sm">${formatarData(bloco.inicio)} → ${formatarData(bloco.fim)}</span>`,
    });

    header.addEventListener("click", () => {
      bloco.expandido = !bloco.expandido;
      renderizarBlocos();
    });

    const corpo = createElementWithProps("div", {
      className: bloco.expandido ? "p-4 text-sm bg-gray-50 w-full" : "p-4 text-sm",
    });

    if (!bloco.expandido) {
      corpo.innerHTML = `
        <div><strong>${bloco.nome}</strong></div>
        <div>Etapa: ${bloco.etapa || "-"}</div>
        <div>Fase: ${bloco.fase || "-"}</div>
        <div>Estratégia: ${bloco.estrategia || "-"}</div>
      `;
    } else {
      corpo.innerHTML = `
        <label class="block mb-1">Etapa:
          <select id="etapa-${i}" class="w-full border rounded px-2 py-1">
            <option value="">Selecione</option>
            ${ETAPAS.map((etapa) => `<option value="${etapa}" ${bloco.etapa === etapa ? "selected" : ""}>${etapa}</option>`).join("")}
          </select>
        </label>
        <label class="block mb-1">Fase:
          <select id="fase-${i}" class="w-full border rounded px-2 py-1">
            <option value="">Selecione</option>
            ${FASES.map((fase) => `<option value="${fase}" ${bloco.fase === fase ? "selected" : ""}>${fase}</option>`).join("")}
          </select>
        </label>
        <label class="block mb-1">Estratégia:
          <select id="estrategia-${i}" class="w-full border rounded px-2 py-1">
            <option value="">Selecione</option>
            ${ESTRATEGIAS.map((estrategia) => `<option value="${estrategia}" ${bloco.estrategia === estrategia ? "selected" : ""}>${estrategia}</option>`).join("")}
          </select>
        </label>
        <label class="block">Nutrientes: <input type="text" id="nutrientes-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.nutrientes || ""}" /></label>
        <label class="block">Receita (g/L): <input type="text" id="receita-${i}" class="w-full border rounded px-2 py-1" value="A: ${bloco.receita.A || ""} / B: ${bloco.receita.B || ""} / C: ${bloco.receita.C || ""}" /></label>
        <label class="block">EC Entrada (mS/cm): <input type="number" id="ec-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.ec_entrada || ""}" /></label>
        <label class="block">EC Saída (mS/cm): <input type="number" id="ec_saida-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.ec_saida || ""}" /></label>
        <label class="block">Runoff (%): <input type="number" id="runoff-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.runoff || ""}" /></label>
        <label class="block">Dryback (%): <input type="number" id="dryback-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.dryback || ""}" /></label>
        <label class="block">Temperatura (°C): <input type="number" id="temp-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.temperatura || ""}" /></label>
        <label class="block">RH (%): <input type="number" id="ur-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.ur || ""}" /></label>
        <label class="block">VPD (kPa): <input type="number" id="vpd-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.vpd || ""}" /></label>
        <label class="block">PPFD: <input type="number" id="ppfd-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.ppfd || ""}" /></label>
        <label class="block">Notas: <textarea id="notas-${i}" class="w-full border rounded px-2 py-1">${bloco.notas || ""}</textarea></label>
        <button class="absolute top-1 right-1 text-red-600" aria-label="Remover bloco" onclick="removerBloco(${i})">❌</button>
      `;
    }

    const wrapper = createElementWithProps(
      "div",
      {
        className: `w-full bg-white shadow border rounded overflow-hidden relative mb-4`,
        dataset: { index: i },
      },
      [header, corpo]
    );

    DOM.blocosContainer.appendChild(wrapper);
  });

  atualizarColheitaEDiaAtual();

  Sortable.create(DOM.blocosContainer, {
    animation: 150,
    onEnd: (evt) => {
      const novosBlocos = [];
      const blocosDom = DOM.blocosContainer.querySelectorAll("[data-index]");
      blocosDom.forEach((el) => {
        const index = parseInt(el.getAttribute("data-index"));
        novosBlocos.push(blocos[index]);
      });
      blocos = novosBlocos;
      blocos.forEach((bloco, i) => {
        const ini = calcularInicio(i, DOM.inputDataInicio.value);
        const fim = new Date(ini);
        fim.setDate(fim.getDate() + 6);
        bloco.inicio = ini.toISOString().split("T")[0];
        bloco.fim = fim.toISOString().split("T")[0];
      });
      renderizarBlocos();
    },
  });
}

function atualizarColheitaEDiaAtual() {
  const hoje = new Date();
  const processar = blocos.find((b) => b.nome === "PROCESSAR");
  DOM.colheitaInfo.textContent = processar ? `🌾 Colheita em ${formatarData(processar.inicio)}` : "";

  const ativo = blocos.find((b) => {
    const ini = new Date(b.inicio);
    const fim = new Date(b.fim);
    return ini <= hoje && fim >= hoje;
  });

  if (ativo) {
    const faseAtual = ativo.nome;
    let diaTotal = 0;

    for (const bloco of blocos) {
      if (bloco.nome !== faseAtual) continue;
      const ini = new Date(bloco.inicio);
      const fim = new Date(bloco.fim);

      if (hoje > fim) {
        diaTotal += 7;
      } else if (hoje >= ini && hoje <= fim) {
        diaTotal += Math.floor((hoje - ini) / (1000 * 60 * 60 * 24)) + 1;
        break;
      }
    }

    DOM.diaInfo.textContent = `📅 ${faseAtual} dia ${diaTotal}`;
  } else {
    DOM.diaInfo.textContent = "";
  }
}

function atualizarDados() {
  blocos.forEach((bloco, i) => {
    const getValue = (id) => document.getElementById(id)?.value || bloco[id.split("-")[0]] || "";
    bloco.etapa = getValue(`etapa-${i}`);
    bloco.fase = getValue(`fase-${i}`);
    bloco.estrategia = getValue(`estrategia-${i}`);
    bloco.receita.nutrientes = getValue(`nutrientes-${i}`);

    const receitaCompleta = getValue(`receita-${i}`);
    const matches = receitaCompleta.match(/A:\s*([\d.,]+)\s*\/\s*B:\s*([\d.,]+)\s*\/\s*C:\s*([\d.,]+)/);
    if (matches) {
      bloco.receita.A = matches[1];
      bloco.receita.B = matches[2];
      bloco.receita.C = matches[3];
    }

    bloco.receita.ec_entrada = getValue(`ec-${i}`);
    bloco.receita.ec_saida = getValue(`ec_saida-${i}`);
    bloco.receita.runoff = getValue(`runoff-${i}`);
    bloco.receita.dryback = getValue(`dryback-${i}`);
    bloco.receita.temperatura = getValue(`temp-${i}`);
    bloco.receita.ur = getValue(`ur-${i}`);
    bloco.receita.vpd = getValue(`vpd-${i}`);
    bloco.receita.ppfd = getValue(`ppfd-${i}`);
    bloco.notas = getValue(`notas-${i}`);
  });
}

// Funções de persistência
async function salvarCultivo() {
  atualizarDados();
  if (!DOM.inputDataInicio.value || !DOM.inputNome.value) {
    alert("Preencha o nome do cultivo e a data de início.");
    return;
  }

  const cultivo = {
    nome: DOM.inputNome.value,
    data_inicio: DOM.inputDataInicio.value,
    criado_em: Timestamp.now(),
    blocos,
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
    alert("Erro ao salvar Cultivo.");
  }
}

async function carregarCultivoExistente(id) {
  try {
    const docSnap = await getDoc(doc(db, "cultivos_blocos", id));
    if (docSnap.exists()) {
      const dados = docSnap.data();
      DOM.inputDataInicio.value = dados.data_inicio;
      DOM.inputNome.value = dados.nome;
      blocos = dados.blocos || [];
      renderizarBlocos();
    }
  } catch (e) {
    console.error("Erro ao carregar cultivo:", e);
  }
}

// Inicialização de eventos
DOM.btnSalvar?.addEventListener("click", salvarCultivo);
