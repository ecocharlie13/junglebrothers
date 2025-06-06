// 🔹 Imports
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

// 🔹 Variáveis globais
let blocos = [];
let cultivoId = null;

const cores = {
  CLONAR: "bg-purple-600",
  VEGETAR: "bg-green-600",
  FLORAR: "bg-orange-500",
  FLUSH: "bg-blue-500",
  PROCESSAR: "bg-red-500",
};

// 🔹 Referências DOM
const blocosContainer = document.getElementById("blocos-container");
const inputDataInicio = document.getElementById("data-inicio");
const inputNome = document.getElementById("nome-cultivo");
const btnSalvar = document.getElementById("btn-salvar");
const colheitaInfo = document.getElementById("colheita-info");
const diaInfo = document.getElementById("dia-info");

// 🔹 Sincroniza datas ao editar data-inicio
inputDataInicio.addEventListener("change", () => {
  blocos.forEach((bloco, i) => {
    const ini = new Date(inputDataInicio.value);
    ini.setDate(ini.getDate() + i * 7);
    const fim = new Date(ini);
    fim.setDate(fim.getDate() + 6);
    bloco.inicio = ini.toISOString().split("T")[0];
    bloco.fim = fim.toISOString().split("T")[0];
  });
  renderizarBlocos();
});

// 🔹 Utilitários
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
  const processar = blocos.find(b => b.nome === "PROCESSAR");
  colheitaInfo.textContent = processar ? `🌾 Colheita em ${formatarData(processar.inicio)}` : "";

  const ativo = blocos.find(b => {
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
      if (hoje > fim) diaTotal += 7;
      else if (hoje >= ini && hoje <= fim)
        diaTotal += Math.floor((hoje - ini) / (1000 * 60 * 60 * 24)) + 1;
    }
    diaInfo.textContent = `📅 ${faseAtual} dia ${diaTotal}`;
  } else {
    diaInfo.textContent = "";
  }
}
  
// 🔹 Renderiza todos os blocos
function renderizarBlocos() {
  atualizarDados(); // garante que os campos editados sejam preservados
  blocosContainer.innerHTML = "";
  const hoje = new Date();
  const contagemPorTipo = {};

  blocos.forEach((bloco, i) => {
    const tipo = bloco.nome;

// se for FLUSH, número total acumulado até aqui
let semanaNumero;
if (tipo === "FLUSH") {
  const semanasFlorar = blocos.slice(0, i).filter(b => b.nome === "FLORAR").length;
  semanaNumero = semanasFlorar + 1;
} else {
  contagemPorTipo[tipo] = (contagemPorTipo[tipo] || 0) + 1;
  semanaNumero = contagemPorTipo[tipo];
}

    const wrapper = document.createElement("div");
    wrapper.className = `w-full bg-white shadow border rounded overflow-hidden relative mb-4`;
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
    corpo.className = bloco.expandido ? "p-4 text-sm bg-gray-50 w-full" : "p-4 text-sm";

    if (!bloco.expandido) {
      if (bloco.nome === "PROCESSAR") {
        corpo.innerHTML = `
          <div><strong>${bloco.nome}</strong></div>
          <div>Notas: ${bloco.notas || "-"}</div>
        `;
      } else {
        corpo.innerHTML = `
          <div><strong>${bloco.nome}</strong></div>
          <div>Etapa: ${bloco.etapa || "-"}</div>
          <div>Fase: ${bloco.fase || "-"}</div>
          <div>Estratégia: ${bloco.estrategia || "-"}</div>
        `;
      }
    } else {
      corpo.innerHTML = `
        <label>Etapa:
          <select id="etapa-${i}" class="w-full border rounded px-2 py-1">
            ${["", "PROPAGAR", "VEGETAR", "INÍCIO DE FLORA", "MEIO DE FLORA", "FIM DE FLORA", "FLUSH"]
              .map(opt => `<option value="${opt}" ${opt === bloco.etapa ? "selected" : ""}>${opt || "Selecione"}</option>`)
              .join("")}
          </select>
        </label>
        <label>Fase:
          <select id="fase-${i}" class="w-full border rounded px-2 py-1">
            ${["", "PROPAGAR", "VEGETAR", "ESTIRAMENTO", "VOLUME", "ACABAMENTO"]
              .map(opt => `<option value="${opt}" ${opt === bloco.fase ? "selected" : ""}>${opt || "Selecione"}</option>`)
              .join("")}
          </select>
        </label>
        <label>Estratégia:
          <select id="estrategia-${i}" class="w-full border rounded px-2 py-1">
            ${["", "PROPAGAR", "VEGETATIVO", "GENERATIVO", "MISTO (VEG/GEN)"]
              .map(opt => `<option value="${opt}" ${opt === bloco.estrategia ? "selected" : ""}>${opt || "Selecione"}</option>`)
              .join("")}
          </select>
        </label>
        <label>Nutrientes: <input type="text" id="nutrientes-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.nutrientes || ""}" /></label>
        <label>Receita (g/L): <input type="text" id="receita-${i}" class="w-full border rounded px-2 py-1" value="A: ${bloco.receita.A || ""} / B: ${bloco.receita.B || ""} / C: ${bloco.receita.C || ""}" /></label>
        <label>EC Entrada: <input type="text" id="ec-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.ec_entrada || ""}" /></label>
        <label>EC Saída: <input type="text" id="ec_saida-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.ec_saida || ""}" /></label>
        <label>Runoff (%): <input type="text" id="runoff-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.runoff || ""}" /></label>
        <label>Dryback (%): <input type="text" id="dryback-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.dryback || ""}" /></label>
        <label>Temperatura: <input type="text" id="temp-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.temperatura || ""}" /></label>
        <label>UR: <input type="text" id="ur-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.ur || ""}" /></label>
        <label>VPD: <input type="text" id="vpd-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.vpd || ""}" /></label>
        <label>PPFD: <input type="text" id="ppfd-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.ppfd || ""}" /></label>
        <label>Notas: <textarea id="notas-${i}" class="w-full border rounded px-2 py-1">${bloco.notas || ""}</textarea></label>
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
    onEnd: () => {
      const novos = [];
      const divs = blocosContainer.querySelectorAll("[data-index]");
      divs.forEach(div => {
        const index = parseInt(div.getAttribute("data-index"));
        novos.push(blocos[index]);
      });
      blocos = novos;
      // Recalcula datas após reordenar
      blocos.forEach((bloco, i) => {
        const ini = new Date(inputDataInicio.value);
        ini.setDate(ini.getDate() + i * 7);
        const fim = new Date(ini);
        fim.setDate(fim.getDate() + 6);
        bloco.inicio = ini.toISOString().split("T")[0];
        bloco.fim = fim.toISOString().split("T")[0];
      });
      renderizarBlocos();
    }
  });
}

// 🔹 Atualiza dados dos inputs para o array
function atualizarDados() {
  blocos.forEach((bloco, i) => {
    const get = id => document.getElementById(`${id}-${i}`)?.value;
    bloco.etapa = get("etapa") || bloco.etapa;
    bloco.fase = get("fase") || bloco.fase;
    bloco.estrategia = get("estrategia") || bloco.estrategia;
    bloco.receita.nutrientes = get("nutrientes") || bloco.receita.nutrientes;

    const r = get("receita") || "";
    const matches = r.match(/A:\s*([\d.,]+)\s*\/\s*B:\s*([\d.,]+)\s*\/\s*C:\s*([\d.,]+)/);
    if (matches) [bloco.receita.A, bloco.receita.B, bloco.receita.C] = [matches[1], matches[2], matches[3]];

    bloco.receita.ec_entrada = get("ec") || bloco.receita.ec_entrada;
    bloco.receita.ec_saida = get("ec_saida") || bloco.receita.ec_saida;
    bloco.receita.runoff = get("runoff") || bloco.receita.runoff;
    bloco.receita.dryback = get("dryback") || bloco.receita.dryback;
    bloco.receita.temperatura = get("temp") || bloco.receita.temperatura;
    bloco.receita.ur = get("ur") || bloco.receita.ur;
    bloco.receita.vpd = get("vpd") || bloco.receita.vpd;
    bloco.receita.ppfd = get("ppfd") || bloco.receita.ppfd;
    bloco.notas = document.getElementById(`notas-${i}`)?.value || bloco.notas;
  });
}

// 🔹 Adicionar novo bloco
window.adicionarBloco = function(tipo) {
  if (!inputDataInicio.value) return alert("Selecione a data de início.");
  const ordem = blocos.length;
  const inicio = calcularInicio(ordem);
  const fim = new Date(inicio); fim.setDate(fim.getDate() + 6);
  blocos.push({
    nome: tipo,
    etapa: "",
    fase: "",
    estrategia: "",
    ordem,
    inicio: inicio.toISOString().split("T")[0],
    fim: fim.toISOString().split("T")[0],
    receita: { ec_entrada: "", ec_saida: "", nutrientes: "", A: "", B: "", C: "", runoff: "", dryback: "", temperatura: "", ur: "", vpd: "", ppfd: "" },
    notas: "",
    tarefas: [],
    cor: cores[tipo],
    expandido: false,
  });
  renderizarBlocos();
};

// 🔹 Salvar cultivo no Firestore
async function salvarCultivo() {
  atualizarDados();
  if (!inputDataInicio.value || !inputNome.value) return alert("Preencha nome e data.");
  const cultivo = {
    nome: inputNome.value,
    data_inicio: inputDataInicio.value,
    criado_em: Timestamp.now(),
    blocos,
  };
  try {
    if (cultivoId) {
      await updateDoc(doc(db, "cultivos_blocos", cultivoId), cultivo);
      alert("Cultivo atualizado.");
    } else {
      await addDoc(collection(db, "cultivos_blocos"), cultivo);
      alert("Cultivo salvo.");
    }
  } catch (e) {
    console.error("Erro ao salvar:", e);
    alert("Erro ao salvar.");
  }
}

// 🔹 Carregar cultivo existente
async function carregarCultivoExistente(id) {
  try {
    const snap = await getDoc(doc(db, "cultivos_blocos", id));
    if (snap.exists()) {
      const dados = snap.data();
      inputDataInicio.value = dados.data_inicio;
      inputNome.value = dados.nome;
      blocos = dados.blocos || [];
      renderizarBlocos();
    }
  } catch (e) {
    console.error("Erro ao carregar:", e);
  }
}

// 🔹 Inicializar se já existir ID na URL
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has("id")) {
    cultivoId = params.get("id");
    carregarCultivoExistente(cultivoId);
  }
});

// 🔹 Botão salvar
btnSalvar?.addEventListener("click", salvarCultivo);
