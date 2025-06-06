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

    diaInfo.textContent = `📅 ${faseAtual} dia ${diaTotal}`;
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
    wrapper.className = `w-full bg-white shadow border rounded overflow-hidden relative mb-4`;
    wrapper.setAttribute("data-index", i);

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
    corpo.className = bloco.expandido ? "p-4 text-sm bg-gray-50 w-full" : "p-4 text-sm";

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
        <option value="PROPAGAR" ${bloco.etapa === "PROPAGAR" ? "selected" : ""}>PROPAGAR</option>
        <option value="VEGETAR" ${bloco.etapa === "VEGETAR" ? "selected" : ""}>VEGETAR</option>
        <option value="INÍCIO DE FLORA" ${bloco.etapa === "INÍCIO DE FLORA" ? "selected" : ""}>INÍCIO DE FLORA</option>
        <option value="MEIO DE FLORA" ${bloco.etapa === "MEIO DE FLORA" ? "selected" : ""}>MEIO DE FLORA</option>
        <option value="FIM DE FLORA" ${bloco.etapa === "FIM DE FLORA" ? "selected" : ""}>FIM DE FLORA</option>
        <option value="FLUSH" ${bloco.etapa === "FLUSH" ? "selected" : ""}>FLUSH</option>
      </select>
    </label>

    <label class="block mb-1">Fase:
      <select id="fase-${i}" class="w-full border rounded px-2 py-1">
        <option value="">Selecione</option>
        <option value="PROPAGAR" ${bloco.fase === "PROPAGAR" ? "selected" : ""}>PROPAGAR</option>
        <option value="VEGETAR" ${bloco.fase === "VEGETAR" ? "selected" : ""}>VEGETAR</option>
        <option value="ESTIRAMENTO" ${bloco.fase === "ESTIRAMENTO" ? "selected" : ""}>ESTIRAMENTO</option>
        <option value="VOLUME" ${bloco.fase === "VOLUME" ? "selected" : ""}>VOLUME</option>
        <option value="ACABAMENTO" ${bloco.fase === "ACABAMENTO" ? "selected" : ""}>ACABAMENTO</option>
      </select>
    </label>

    <label class="block mb-1">Estratégia:
      <select id="estrategia-${i}" class="w-full border rounded px-2 py-1">
        <option value="">Selecione</option>
        <option value="PROPAGAR" ${bloco.estrategia === "PROPAGAR" ? "selected" : ""}>PROPAGAR</option>
        <option value="VEGETATIVO" ${bloco.estrategia === "VEGETATIVO" ? "selected" : ""}>VEGETATIVO</option>
        <option value="GENERATIVO" ${bloco.estrategia === "GENERATIVO" ? "selected" : ""}>GENERATIVO</option>
        <option value="MISTO (VEG/GEN)" ${bloco.estrategia === "MISTO (VEG/GEN)" ? "selected" : ""}>MISTO (VEG/GEN)</option>
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
        <button class="absolute top-1 right-1 text-red-600" onclick="removerBloco(${i})">❌</button>
      `;
    }

    wrapper.appendChild(header);
    wrapper.appendChild(corpo);
    blocosContainer.appendChild(wrapper);
  });

  atualizarColheitaEDiaAtual();

  Sortable.create(blocosContainer, {
    animation: 150,
    onEnd: (evt) => {
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
}

// ... restante do código permanece inalterado

function atualizarDados() {
  blocos.forEach((bloco, i) => {
    bloco.etapa = document.getElementById(`etapa-${i}`)?.value || bloco.etapa;
    bloco.fase = document.getElementById(`fase-${i}`)?.value || bloco.fase;
    bloco.estrategia = document.getElementById(`estrategia-${i}`)?.value || bloco.estrategia;
    bloco.receita.nutrientes = document.getElementById(`nutrientes-${i}`)?.value || bloco.receita.nutrientes;

    const receitaCompleta = document.getElementById(`receita-${i}`)?.value || "";
    const matches = receitaCompleta.match(/A:\s*([\d.,]+)\s*\/\s*B:\s*([\d.,]+)\s*\/\s*C:\s*([\d.,]+)/);
    if (matches) {
      bloco.receita.A = matches[1];
      bloco.receita.B = matches[2];
      bloco.receita.C = matches[3];
    }

    bloco.receita.ec_entrada = document.getElementById(`ec-${i}`)?.value || bloco.receita.ec_entrada;
    bloco.receita.ec_saida = document.getElementById(`ec_saida-${i}`)?.value || bloco.receita.ec_saida;
    bloco.receita.runoff = document.getElementById(`runoff-${i}`)?.value || bloco.receita.runoff;
    bloco.receita.dryback = document.getElementById(`dryback-${i}`)?.value || bloco.receita.dryback;
    bloco.receita.temperatura = document.getElementById(`temp-${i}`)?.value || bloco.receita.temperatura;
    bloco.receita.ur = document.getElementById(`ur-${i}`)?.value || bloco.receita.ur;
    bloco.receita.vpd = document.getElementById(`vpd-${i}`)?.value || bloco.receita.vpd;
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
    alert("Erro ao salvar cultivo.");
  }
}

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

