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
let modoEdicao = false;
let sortableInstance = null;

const cores = {
  CLONAR: "bg-purple-600",
  VEGETAR: "bg-green-600",
  FLORAR: "bg-orange-500",
  FLUSH: "bg-blue-500",
  EVENTO: "bg-red-500",
};

// 🔹 Referências DOM
const blocosContainer = document.getElementById("blocos-container");
const salvarBtn = document.getElementById("salvar");
const cultivoInput = document.getElementById("nome-cultivo");
const dataInput = document.getElementById("data-inicio");
const alternarBtn = document.getElementById("alternar");
const previsaoColheita = document.getElementById("previsao-colheita");
const diaAtualLinha = document.getElementById("dia-atual");

// 🔹 Utilitários
function formatarData(dataStr) {
  if (!dataStr) return "-";
  const data = new Date(dataStr);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function calcularDiasEntre(inicio, fim) {
  const i = new Date(inicio);
  const f = new Date(fim);
  const diff = (f - i) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
}

function criarElemento(tag, classe = "", html = "") {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (html) el.innerHTML = html;
  return el;
}

function atualizarColheitaEDiaAtual() {
  const hoje = new Date();
  let colheita = null;
  let acumulado = 0;

  for (const bloco of blocos) {
    if (bloco.nome === "EVENTO") continue;

    const inicio = new Date(bloco.inicio);
    const fim = new Date(bloco.fim);
    if (hoje >= inicio && hoje <= fim) {
      const dia = calcularDiasEntre(inicio, hoje) + 1;
      diaAtualLinha.textContent = `🌱 ${bloco.nome} dia ${dia}`;
    }

    if (!colheita && bloco.nome === "PROCESSAR") {
      colheita = bloco.inicio;
    }
  }

  previsaoColheita.textContent = colheita
    ? `🌾 Colheita em ${formatarData(colheita)}`
    : "🌾 Colheita: não definida";
}

// 🔹 Renderização
function renderizarBlocos() {
  blocosContainer.innerHTML = "";
  blocos.forEach((bloco, i) => {
    const wrapper = criarElemento("div", "relative p-4 rounded shadow mb-4 " + (cores[bloco.nome] || "bg-gray-300"));

    const header = criarElemento("div", "flex justify-between items-center cursor-pointer");
    header.innerHTML = `
      <strong class="text-white">Semana ${i + 1} – ${bloco.nome}</strong>
      <button class="text-sm text-white underline" onclick="alternarVisualizacao(${i})">${bloco.expandido ? "Fechar" : "Expandir"}</button>
    `;

    const corpo = criarElemento("div", "mt-2 bg-white p-3 rounded");

    if (!bloco.expandido) {
      if (bloco.nome === "EVENTO") {
        const dataHtml = modoEdicao
          ? `
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-700">📅</span>
              <input type="date" id="evento-${i}" class="border px-2 py-1 rounded" value="${bloco.data || ""}" onchange="atualizarDataEvento(${i}, this.value)">
            </div>`
          : `<div class="text-sm text-gray-700">${bloco.data ? `📅 ${formatarData(bloco.data)}` : "Sem data"}</div>`;

        corpo.innerHTML = `
          <div><strong>${bloco.nome}</strong></div>
          <div class="mt-2">${dataHtml}</div>
          <label class="block mt-4">
            Notas:
            <textarea id="notas-${i}" class="w-full border rounded px-2 py-1 mt-1" ${modoEdicao ? "" : "disabled"}>${bloco.notas || ""}</textarea>
          </label>
        `;
      } else {
        const estrategia = bloco.estrategia || "-";
        const vpd = bloco.receita.vpd || "-";
        const temp = bloco.receita.temperatura || "-";
        const ur = bloco.receita.ur || "-";
        const ppfd = bloco.receita.ppfd || "-";
        const ecEntrada = bloco.receita.ec_entrada || "-";
        const receita = bloco.receita.A || bloco.receita.B || bloco.receita.C
          ? `A:${bloco.receita.A || "-"} / B:${bloco.receita.B || "-"} / C:${bloco.receita.C || "-"}`
          : "-";
        const runoff = bloco.receita.runoff || "-";
        const dryback = bloco.receita.dryback || "-";
        const notas = bloco.notas || "-";

        corpo.innerHTML = `
          <div><strong>${bloco.nome}</strong></div>
          <div>${formatarData(bloco.inicio)} → ${formatarData(bloco.fim)}</div>
          <div><strong>Estratégia:</strong> ${estrategia}</div>
          <div class="grid grid-cols-2 gap-x-4 mt-2 text-sm">
            <div>VPD: ${vpd}</div>
            <div>EC Entrada: ${ecEntrada}</div>
            <div>Temp: ${temp}</div>
            <div>Receita: ${receita}</div>
            <div>UR: ${ur}</div>
            <div>Runoff: ${runoff}</div>
            <div>PPFD: ${ppfd}</div>
            <div>Dryback: ${dryback}</div>
          </div>
          <div class="mt-2"><strong>Notas:</strong> ${notas}</div>
        `;
      }
    } else {
      corpo.innerHTML = `
        <label>Etapa:
          <select id="etapa-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"}>
            ${["", "CLONAR", "VEGETAR", "FLORAR", "FLUSH", "PROCESSAR", "EVENTO"]
              .map(opt => `<option value="${opt}" ${opt === bloco.nome ? "selected" : ""}>${opt || "Selecione"}</option>`)
              .join("")}
          </select>
        </label>
        <label>Início:
          <input type="date" id="inicio-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="${bloco.inicio || ""}">
        </label>
        <label>Fim:
          <input type="date" id="fim-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="${bloco.fim || ""}">
        </label>
        <label>Estratégia:
          <input type="text" id="estrategia-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="${bloco.estrategia || ""}">
        </label>
        <label>Receita:
          <input type="text" id="receita-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="A:${bloco.receita.A || ""} / B:${bloco.receita.B || ""} / C:${bloco.receita.C || ""}">
        </label>
        <label>Notas:
          <textarea id="notas-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"}>${bloco.notas || ""}</textarea>
        </label>
      `;
    }

    wrapper.appendChild(header);
    wrapper.appendChild(corpo);
    blocosContainer.appendChild(wrapper);
  });

  atualizarColheitaEDiaAtual();
}

// 🔹 Funções de interação
window.alternarVisualizacao = (index) => {
  blocos[index].expandido = !blocos[index].expandido;
  renderizarBlocos();
};

window.atualizarDataEvento = (index, novaData) => {
  blocos[index].data = novaData;
};

window.adicionarBloco = () => {
  blocos.push({
    nome: "CLONAR",
    inicio: "",
    fim: "",
    estrategia: "",
    receita: {},
    notas: "",
    expandido: true,
  });
  renderizarBlocos();
};

window.removerBloco = (index) => {
  if (confirm("Remover este bloco?")) {
    blocos.splice(index, 1);
    renderizarBlocos();
  }
};

alternarBtn.addEventListener("click", () => {
  modoEdicao = !modoEdicao;
  alternarBtn.textContent = modoEdicao ? "🔒 Visualizar" : "✏️ Editar";
  renderizarBlocos();
});

salvarBtn.addEventListener("click", async () => {
  const nome = cultivoInput.value.trim();
  const data = dataInput.value;

  if (!nome || !data) {
    alert("Preencha nome e data de início.");
    return;
  }

  const dados = {
    nome,
    data,
    blocos,
    atualizado: Timestamp.now()
  };

  try {
    if (cultivoId) {
      await updateDoc(doc(db, "cultivos", cultivoId), dados);
    } else {
      const docRef = await addDoc(collection(db, "cultivos"), dados);
      cultivoId = docRef.id;
    }
    alert("Cultivo salvo!");
  } catch (e) {
    console.error("Erro ao salvar:", e);
    alert("Erro ao salvar cultivo.");
  }
});

// 🔹 Inicialização
(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  if (!id) return;

  try {
    const snap = await getDoc(doc(db, "cultivos", id));
    if (snap.exists()) {
      const dados = snap.data();
      cultivoInput.value = dados.nome || "";
      dataInput.value = dados.data || "";
      blocos = dados.blocos || [];
      cultivoId = id;
      renderizarBlocos();
    }
  } catch (e) {
    console.error("Erro ao carregar cultivo:", e);
  }
})();
