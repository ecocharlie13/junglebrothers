// IMPORTS
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

// VARIÁVEIS GLOBAIS
let blocos = [];
let cultivoId = null;
let modoEdicao = false;

const cores = {
  CLONAR: "bg-purple-600",
  VEGETAR: "bg-green-600",
  FLORAR: "bg-orange-500",
  FLUSH: "bg-blue-500",
  TAREFA: "bg-red-500",
};

// REFERÊNCIAS DOM
const blocosContainer = document.getElementById("blocos-container");
const inputDataInicio = document.getElementById("data-inicio");
const inputNome = document.getElementById("nome-cultivo");
const btnSalvar = document.getElementById("btn-salvar");
const colheitaInfo = document.getElementById("colheita-info");
const diaInfo = document.getElementById("dia-info");
const acoesControle = document.getElementById("acoes-controle");

// ALTERAÇÃO: BOTÃO VISUALIZAR/EDITAR
const btnEditar = document.createElement("button");
btnEditar.textContent = "✏️ Editar";
btnEditar.className = "fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 z-50 md:bottom-6 md:right-6";
btnEditar.addEventListener("click", () => {
  modoEdicao = !modoEdicao;
  btnEditar.textContent = modoEdicao ? "✅ Visualizar" : "✏️ Editar";
  acoesControle.style.display = modoEdicao ? "block" : "none";
  renderizarBlocos();
});
document.body.appendChild(btnEditar);

// SINCRONIZAÇÃO DE DATAS
inputDataInicio.addEventListener("change", () => {
  sincronizarDatas();
  renderizarBlocos();
});

function sincronizarDatas() {
  let indice = 0;
  blocos.forEach((bloco) => {
    if (bloco.nome === "TAREFA") return;
    const ini = new Date(inputDataInicio.value);
    ini.setDate(ini.getDate() + indice * 7);
    const fim = new Date(ini);
    fim.setDate(fim.getDate() + 6);
    bloco.inicio = ini.toISOString().split("T")[0];
    bloco.fim = fim.toISOString().split("T")[0];
    indice++;
  });
}

function formatarData(dataStr) {
  if (!dataStr) return "--";
  const meses = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}-${meses[parseInt(mes) - 1]}-${ano}`;
}

function atualizarColheitaEDiaAtual() {
  const hoje = new Date();
  const blocosValidos = blocos.filter(b => b.nome !== "TAREFA");

  const ultimo = blocosValidos.at(-1);
  colheitaInfo.textContent = ultimo ? `🌾 Colheita em ${formatarData(ultimo.fim)}` : "";

  const ativo = blocosValidos.find(b => {
    const ini = new Date(b.inicio);
    const fim = new Date(b.fim);
    return ini <= hoje && fim >= hoje;
  });
  if (ativo) {
    const faseAtual = ativo.nome;
    let diaTotal = 0;
    for (const bloco of blocosValidos) {
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

function renderizarBlocos() {
  atualizarDados();
  blocosContainer.innerHTML = "";
  const hoje = new Date();
  const contagemPorTipo = {};

  let indiceReal = 0;
  blocos.forEach((bloco, i) => {
    const tipo = bloco.nome;
    let semanaNumero = 1;

    if (tipo !== "TAREFA") {
      contagemPorTipo[tipo] = (contagemPorTipo[tipo] || 0) + 1;
      semanaNumero = contagemPorTipo[tipo];
    }

    const wrapper = document.createElement("div");
    wrapper.className = `w-full bg-white shadow border rounded overflow-hidden relative mb-4`;
    wrapper.setAttribute("data-index", i);

    let estiloExtra = "";
    const inicio = bloco.inicio ? new Date(bloco.inicio) : null;
    const fim = bloco.fim ? new Date(bloco.fim) : null;
    if (inicio && fim && tipo !== "TAREFA") {
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
    corpo.innerHTML = bloco.expandido ? `<textarea id="notas-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"}>${bloco.notas || ""}</textarea>` : `<div>Notas: ${bloco.notas || "-"}</div>`;
    if (modoEdicao && bloco.expandido) {
      corpo.innerHTML += `<button class="absolute top-1 right-1 text-red-600" onclick="removerBloco(${i})">❌</button>`;
    }

    wrapper.appendChild(header);
    wrapper.appendChild(corpo);
    blocosContainer.appendChild(wrapper);
  });

  atualizarColheitaEDiaAtual();

  if (modoEdicao) {
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
        sincronizarDatas();
        renderizarBlocos();
      }
    });
  }
}

function atualizarDados() {
  blocos.forEach((bloco, i) => {
    if (bloco.nome === "TAREFA") {
      bloco.notas = document.getElementById(`notas-${i}`)?.value || bloco.notas;
    }
  });
}

window.adicionarBloco = function (tipo) {
  if (!inputDataInicio.value) return alert("Selecione a data de início.");
  const ordem = blocos.length;
  const inicio = tipo === "TAREFA" ? "" : calcularInicio(blocos.filter(b => b.nome !== "TAREFA").length);
  const fim = tipo === "TAREFA" ? "" : new Date(inicio);
  if (fim) fim.setDate(fim.getDate() + 6);

  blocos.push({
    nome: tipo,
    inicio: inicio ? inicio.toISOString().split("T")[0] : "",
    fim: fim ? fim.toISOString().split("T")[0] : "",
    notas: "",
    cor: cores[tipo],
    expandido: false,
  });
  renderizarBlocos();
};

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

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has("id")) {
    cultivoId = params.get("id");
    carregarCultivoExistente(cultivoId);
  }
  acoesControle.style.display = "none";
});

btnSalvar?.addEventListener("click", salvarCultivo);

window.removerBloco = function (index) {
  blocos.splice(index, 1);
  renderizarBlocos();
};
