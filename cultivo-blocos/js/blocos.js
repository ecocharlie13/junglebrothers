// blocos.js. 330 linhas bom
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

window.removerBloco = function (index) {
  if (confirm("Deseja remover este bloco?")) {
    blocos.splice(index, 1);
    renderizarBlocos();
  }
};

inputDataInicio.addEventListener("change", () => {
  if (!inputDataInicio.value) return;
  const base = new Date(inputDataInicio.value);
  if (isNaN(base)) return;

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

document.getElementById("btn-salvar")?.addEventListener("click", salvarCultivo);

function atualizarDados() {
  blocos.forEach((bloco, i) => {
    bloco.etapa = document.getElementById(`etapa-${i}`)?.value || "";
    bloco.fase = document.getElementById(`fase-${i}`)?.value || "";
    bloco.estrategia = document.getElementById(`estrategia-${i}`)?.value || "";

    bloco.receita.ec_entrada = document.getElementById(`ec-${i}`)?.value || "";
    bloco.receita.ph_entrada = document.getElementById(`ph-${i}`)?.value || "";
    bloco.receita.nutrientes = document.getElementById(`nutrientes-${i}`)?.value || "";
    bloco.receita.receita = document.getElementById(`receita-${i}`)?.value || "";
    bloco.receita.ec_saida = document.getElementById(`ec_saida-${i}`)?.value || "";
    bloco.receita.runoff = document.getElementById(`runoff-${i}`)?.value || "";
    bloco.receita.dryback = document.getElementById(`dryback-${i}`)?.value || "";
    bloco.receita.temperatura = document.getElementById(`temp-${i}`)?.value || "";
    bloco.receita.ur = document.getElementById(`ur-${i}`)?.value || "";
    bloco.receita.vpd = document.getElementById(`vpd-${i}`)?.value || "";
    bloco.receita.ppfd = document.getElementById(`ppfd-${i}`)?.value || "";
    bloco.notas = document.getElementById(`notas-${i}`)?.value || "";
  });
}

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
    blocos: JSON.parse(JSON.stringify(blocos)),
  };

  try {
    if (cultivoId) {
      await updateDoc(doc(db, "cultivos_blocos", cultivoId), cultivo);
      alert("✅ Cultivo atualizado com sucesso!");
    } else {
      const ref = await addDoc(collection(db, "cultivos_blocos"), cultivo);
      cultivoId = ref.id;
      window.history.replaceState(null, null, `?id=${cultivoId}`);
      alert("✅ Cultivo salvo com sucesso!");
    }
  } catch (e) {
    console.error("❌ Erro ao salvar:", e);
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
      blocos = (dados.blocos || []).map(b => ({ ...b, expandido: false }));
      renderizarBlocos();
    }
  } catch (e) {
    console.error("Erro ao carregar cultivo:", e);
  }
}
