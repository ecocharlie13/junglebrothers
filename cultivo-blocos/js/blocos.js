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

import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/modular/sortable.esm.js";

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
const colheitaInfo = document.getElementById("colheita-info");
const diaInfo = document.getElementById("dia-info");

const params = new URLSearchParams(window.location.search);
if (params.has("id")) {
  cultivoId = params.get("id");
  carregarCultivoExistente(cultivoId);
}

window.adicionarBloco = function (tipo) {
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
    tarefas: [],
    cor: cores[tipo],
    expandido: false,
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

function atualizarColheitaEDiaAtual() {
  const hoje = new Date();
  const processar = blocos.find((b) => b.nome === "PROCESSAR");
  colheitaInfo.textContent = processar ? `🌾 Colheita em ${formatarData(processar.inicio)}` : "";

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
    diaInfo.textContent = `🗕️ ${faseAtual} dia ${diaTotal}`;
  } else {
    diaInfo.textContent = "";
  }
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
    wrapper.className = `bg-white shadow border rounded overflow-hidden relative ${bloco.expandido ? 'col-span-full' : ''}`;
    wrapper.setAttribute("data-index", i);

    let estiloExtra = "";
    const inicio = bloco.inicio ? new Date(bloco.inicio) : null;
    const fim = bloco.fim ? new Date(bloco.fim) : null;
    if (inicio && fim) {
      if (fim < hoje) estiloExtra = "opacity-40";
      else if (inicio <= hoje && fim >= hoje) estiloExtra = "ring-4 ring-yellow-400";
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
        <div>Fase: ${bloco.fase || "-"}</div>
        <div>Estratégia: ${bloco.estrategia || "-"}</div>
      `;
    } else {
      const selected = (val, atual) => val === atual ? 'selected' : '';
      corpo.innerHTML = `
        <label class="block mb-1">Etapa:
          <select id="etapa-${i}" class="w-full border rounded px-2 py-1">
            <option value="">Selecione</option>
            <option value="germinacao" ${selected("germinacao", bloco.etapa)}>germinação</option>
            <option value="vega" ${selected("vega", bloco.etapa)}>vega</option>
            <option value="inicio de flora" ${selected("inicio de flora", bloco.etapa)}>início de flora</option>
            <option value="meio de flora" ${selected("meio de flora", bloco.etapa)}>meio de flora</option>
            <option value="fim de flora" ${selected("fim de flora", bloco.etapa)}>fim de flora</option>
            <option value="flush" ${selected("flush", bloco.etapa)}>flush</option>
          </select>
        </label>
        <label class="block mb-1">Fase:
          <select id="fase-${i}" class="w-full border rounded px-2 py-1">
            <option value="">Selecione</option>
            <option value="propagacao" ${selected("propagacao", bloco.fase)}>propagação</option>
            <option value="vegetacao" ${selected("vegetacao", bloco.fase)}>vegetacão</option>
            <option value="estiramento" ${selected("estiramento", bloco.fase)}>estiramento</option>
            <option value="engorda" ${selected("engorda", bloco.fase)}>engorda</option>
            <option value="finalizacao" ${selected("finalizacao", bloco.fase)}>finalização</option>
          </select>
        </label>
        <label class="block mb-1">Estratégia:
          <select id="estrategia-${i}" class="w-full border rounded px-2 py-1">
            <option value="">Selecione</option>
            <option value="clonagem" ${selected("clonagem", bloco.estrategia)}>clonagem</option>
            <option value="vegetativo" ${selected("vegetativo", bloco.estrategia)}>vegetativo</option>
            <option value="generativo" ${selected("generativo", bloco.estrategia)}>generativo</option>
            <option value="misto" ${selected("misto", bloco.estrategia)}>misto (veg/gen)</option>
          </select>
        </label>
      `;
    }

    wrapper.appendChild(header);
    wrapper.appendChild(corpo);
    blocosContainer.appendChild(wrapper);
  });

  atualizarColheitaEDiaAtual();
  Sortable.create(blocosContainer, {
    animation: 150,
    onEnd: () => {
      const novosBlocos = [];
      const blocosDom = blocosContainer.querySelectorAll("[data-index]");
      blocosDom.forEach((el) => {
        const index = parseInt(el.getAttribute("data-index"));
        novosBlocos.push(blocos[index]);
      });
      blocos = novosBlocos;
      blocos.forEach((bloco, i) => {
        const ini = new Date(inputDataInicio.value);
        ini.setDate(ini.getDate() + i * 7);
        const fim = new Date(ini);
        fim.setDate(fim.getDate() + 6);
        bloco.inicio = ini.toISOString().split("T")[0];
        bloco.fim = fim.toISOString().split("T")[0];
      });
      renderizarBlocos();
    },
  });
} // continua...
// Continuação do blocos.js após o limite de caracteres

function gerarFormularioExpandido(bloco, i) {
  return `
    <label class="block mb-1">Etapa:
      <select id="etapa-${i}" class="w-full border rounded px-2 py-1">
        <option value="">Selecione</option>
        <option value="germinacao" ${bloco.etapa === "germinacao" ? "selected" : ""}>germinação</option>
        <option value="vega" ${bloco.etapa === "vega" ? "selected" : ""}>vega</option>
        <option value="inicio de flora" ${bloco.etapa === "inicio de flora" ? "selected" : ""}>início de flora</option>
        <option value="meio de flora" ${bloco.etapa === "meio de flora" ? "selected" : ""}>meio de flora</option>
        <option value="fim de flora" ${bloco.etapa === "fim de flora" ? "selected" : ""}>fim de flora</option>
        <option value="flush" ${bloco.etapa === "flush" ? "selected" : ""}>flush</option>
      </select>
    </label>
    <label class="block mb-1">Fase:
      <select id="fase-${i}" class="w-full border rounded px-2 py-1">
        <option value="">Selecione</option>
        <option value="propagacao" ${bloco.fase === "propagacao" ? "selected" : ""}>propagação</option>
        <option value="vegetacao" ${bloco.fase === "vegetacao" ? "selected" : ""}>vegetação</option>
        <option value="estiramento" ${bloco.fase === "estiramento" ? "selected" : ""}>estiramento</option>
        <option value="engorda" ${bloco.fase === "engorda" ? "selected" : ""}>engorda</option>
        <option value="finalizacao" ${bloco.fase === "finalizacao" ? "selected" : ""}>finalização</option>
      </select>
    </label>
    <label class="block mb-1">Estratégia:
      <select id="estrategia-${i}" class="w-full border rounded px-2 py-1">
        <option value="">Selecione</option>
        <option value="clonagem" ${bloco.estrategia === "clonagem" ? "selected" : ""}>clonagem</option>
        <option value="vegetativo" ${bloco.estrategia === "vegetativo" ? "selected" : ""}>vegetativo</option>
        <option value="generativo" ${bloco.estrategia === "generativo" ? "selected" : ""}>generativo</option>
        <option value="misto" ${bloco.estrategia === "misto" ? "selected" : ""}>misto (veg/gen)</option>
      </select>
    </label>
    <label class="block mb-1">EC Entrada:
      <input type="number" id="ec-${i}" value="${bloco.receita.ec_entrada}" class="w-full border rounded px-2 py-1" />
    </label>
    <label class="block mb-1">pH Entrada:
      <input type="number" id="ph-${i}" value="${bloco.receita.ph_entrada}" class="w-full border rounded px-2 py-1" />
    </label>
    <label class="block mb-1">Nutrientes:
      <input type="text" id="nutrientes-${i}" value="${bloco.receita.nutrientes}" class="w-full border rounded px-2 py-1" />
    </label>
    <label class="block mb-1">Receita:
      <textarea id="receita-${i}" class="w-full border rounded px-2 py-1">${bloco.receita.receita}</textarea>
    </label>
    <label class="block mb-1">EC Saída:
      <input type="number" id="ec_saida-${i}" value="${bloco.receita.ec_saida}" class="w-full border rounded px-2 py-1" />
    </label>
    <label class="block mb-1">Runoff (%):
      <input type="number" id="runoff-${i}" value="${bloco.receita.runoff}" class="w-full border rounded px-2 py-1" />
    </label>
    <label class="block mb-1">Dryback (%):
      <input type="number" id="dryback-${i}" value="${bloco.receita.dryback}" class="w-full border rounded px-2 py-1" />
    </label>
    <label class="block mb-1">Temperatura (°C):
      <input type="number" id="temp-${i}" value="${bloco.receita.temperatura}" class="w-full border rounded px-2 py-1" />
    </label>
    <label class="block mb-1">Umidade Relativa (%):
      <input type="number" id="ur-${i}" value="${bloco.receita.ur}" class="w-full border rounded px-2 py-1" />
    </label>
    <label class="block mb-1">VPD (kPa):
      <input type="number" id="vpd-${i}" value="${bloco.receita.vpd}" class="w-full border rounded px-2 py-1" />
    </label>
    <label class="block mb-1">PPFD (µmol/m²/s):
      <input type="number" id="ppfd-${i}" value="${bloco.receita.ppfd}" class="w-full border rounded px-2 py-1" />
    </label>
    <label class="block mb-1">Notas:
      <textarea id="notas-${i}" class="w-full border rounded px-2 py-1">${bloco.notas}</textarea>
    </label>
  `;
}
