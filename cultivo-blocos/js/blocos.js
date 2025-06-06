// Arquivo original recebido: blocos.js
// Etapa 1: Organização em módulos para clareza e manutenção

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

// 🔹 Variáveis globais e configurações
let blocos = [];
let cultivoId = null;
const cores = {
  CLONAR: "bg-purple-600",
  VEGETAR: "bg-green-600",
  FLORAR: "bg-orange-500",
  FLUSH: "bg-blue-500",
  PROCESSAR: "bg-red-500",
};

// 🔹 Elementos da interface
const blocosContainer = document.getElementById("blocos-container");
const inputDataInicio = document.getElementById("data-inicio");
const inputNome = document.getElementById("nome-cultivo");
const btnSalvar = document.getElementById("btn-salvar");
const colheitaInfo = document.getElementById("colheita-info");
const diaInfo = document.getElementById("dia-info");

// 🔹 Inicialização e carregamento do cultivo (se houver)
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has("id")) {
    cultivoId = params.get("id");
    carregarCultivoExistente(cultivoId);
  }

  // 🔹 Funções utilitárias
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
});

// 🔹 Renderização dos blocos
function renderizarBlocos() {
  // função dividida em outro módulo futuramente...
  // ...manteremos esse ponto aqui para continuidade
}

// 🔹 Atualização dos campos a partir do DOM
function atualizarDados() {
  blocos.forEach((bloco, i) => {
    const getInput = id => document.getElementById(`${id}-${i}`)?.value;
    bloco.etapa = getInput("etapa") || bloco.etapa;
    bloco.fase = getInput("fase") || bloco.fase;
    bloco.estrategia = getInput("estrategia") || bloco.estrategia;
    bloco.receita.nutrientes = getInput("nutrientes") || bloco.receita.nutrientes;

    const receitaCompleta = getInput("receita") || "";
    const matches = receitaCompleta.match(/A:\s*([\d.,]+)\s*\/\s*B:\s*([\d.,]+)\s*\/\s*C:\s*([\d.,]+)/);
    if (matches) [bloco.receita.A, bloco.receita.B, bloco.receita.C] = [matches[1], matches[2], matches[3]];

    bloco.receita.ec_entrada = getInput("ec") || bloco.receita.ec_entrada;
    bloco.receita.ec_saida = getInput("ec_saida") || bloco.receita.ec_saida;
    bloco.receita.runoff = getInput("runoff") || bloco.receita.runoff;
    bloco.receita.dryback = getInput("dryback") || bloco.receita.dryback;
    bloco.receita.temperatura = getInput("temp") || bloco.receita.temperatura;
    bloco.receita.ur = getInput("ur") || bloco.receita.ur;
    bloco.receita.vpd = getInput("vpd") || bloco.receita.vpd;
    bloco.receita.ppfd = getInput("ppfd") || bloco.receita.ppfd;
    bloco.notas = document.getElementById(`notas-${i}`)?.value || bloco.notas;
  });
}

// 🔹 Ações com Firestore
async function salvarCultivo() {
  atualizarDados();
  if (!inputDataInicio.value || !inputNome.value) return alert("Preencha o nome do cultivo e a data de início.");
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
    console.error("Erro ao carregar cultivo:", e);
  }
}

// 🔹 Evento de salvar
btnSalvar?.addEventListener("click", salvarCultivo);

// 🔹 Funções públicas (window)
window.adicionarBloco = function(tipo) {
  if (!inputDataInicio.value) return alert("Selecione a data de início primeiro.");
  const ordem = blocos.length;
  const inicio = calcularInicio(ordem);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);

  blocos.push({
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
  });

  renderizarBlocos();
};
