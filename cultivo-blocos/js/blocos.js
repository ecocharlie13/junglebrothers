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
  TAREFA: "bg-red-500",
  EVENTO: "bg-red-500", // Novo tipo visualmente igual ao antigo "TAREFA"
};

// 🔹 Referências DOM
const blocosContainer = document.getElementById("blocos-container");
const btnSalvar = document.getElementById("salvar");
const btnEditar = document.getElementById("editar");
const tituloColheita = document.getElementById("titulo-colheita");
const tituloDiaAtual = document.getElementById("titulo-dia-atual");

// 🔹 Utilitários
function formatarData(dataStr) {
  if (!dataStr) return "--";
  const [ano, mes, dia] = dataStr.split("-");
  const meses = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${dia}-${meses[parseInt(mes) - 1]}-${ano}`;
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

// 🔹 Renderização dos blocos
function renderizarBlocos() {
  blocosContainer.innerHTML = "";

  blocos.forEach((bloco, i) => {
    const wrapper = criarElemento("div", "relative border rounded p-4 mb-4 shadow bg-white");
    const header = criarElemento("div", `text-white px-4 py-2 rounded-t ${cores[bloco.tipo] || "bg-gray-400"}`);
    const corpo = criarElemento("div", "mt-2");

    // 🔹 Título do bloco
    const titulo = document.createElement("div");
    titulo.innerHTML = `<strong>Semana ${i + 1} - ${bloco.nome}</strong>`;
    header.appendChild(titulo);

    // 🔹 Datas do bloco (condicional)
    if (
      bloco.tipo !== "EVENTO" &&
      bloco.duracao > 0 &&
      bloco.afetaCronograma !== false &&
      bloco.inicio &&
      bloco.fim
    ) {
      const datas = criarElemento("div", "text-xs text-gray-200", `${formatarData(bloco.inicio)} → ${formatarData(bloco.fim)}`);
      header.appendChild(datas);
    }

    // 🔹 Corpo do bloco
    if (!bloco.expandido) {
      if (bloco.tipo === "EVENTO") {
        const nota = bloco.notas?.trim();
        corpo.innerHTML = `
          <div><strong>${bloco.nome}</strong></div>
          <div class="text-sm text-gray-600 mt-1">${nota ? nota.replace(/\n/g, "<br>") : "<em class='text-gray-400'>Sem notas</em>"}</div>
        `;
      } else {
        const estrategia = bloco.estrategia || "-";
        const vpd = bloco.receita?.vpd || "-";
        const temp = bloco.receita?.temperatura || "-";
        const ur = bloco.receita?.ur || "-";
        const ppfd = bloco.receita?.ppfd || "-";
        const ecEntrada = bloco.receita?.ec_entrada || "-";
        const receita = bloco.receita?.A || bloco.receita?.B || bloco.receita?.C
          ? `A:${bloco.receita.A || "-"} / B:${bloco.receita.B || "-"} / C:${bloco.receita.C || "-"}`
          : "-";
        const runoff = bloco.receita?.runoff || "-";
        const dryback = bloco.receita?.dryback || "-";
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
      // 🔹 Bloco EXPANDIDO
      if (bloco.tipo === "EVENTO") {
        corpo.innerHTML = `
          <label class="block font-semibold mb-1">Notas:</label>
          <textarea id="notas-${i}" rows="6" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"}>${bloco.notas || ""}</textarea>
        `;
      } else {
        corpo.innerHTML = `
          <label>Etapa:
            <select id="etapa-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"}>
              ${["", "PROPAGAR", "VEGETAR", "INÍCIO DE FLORA", "MEIO DE FLORA", "FIM DE FLORA", "FLUSH"]
                .map(opt => `<option value="${opt}" ${opt === bloco.etapa ? "selected" : ""}>${opt || "Selecione"}</option>`)
                .join("")}
            </select>
          </label>
          <label>Fase:
            <select id="fase-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"}>
              ${["", "PROPAGAR", "VEGETAR", "ESTIRAMENTO", "VOLUME", "ACABAMENTO"]
                .map(opt => `<option value="${opt}" ${opt === bloco.fase ? "selected" : ""}>${opt || "Selecione"}</option>`)
                .join("")}
            </select>
          </label>
          <label>Estratégia:
            <select id="estrategia-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"}>
              ${["", "PROPAGAR", "VEGETATIVO", "GENERATIVO", "MISTO (VEG/GEN)"]
                .map(opt => `<option value="${opt}" ${opt === bloco.estrategia ? "selected" : ""}>${opt || "Selecione"}</option>`)
                .join("")}
            </select>
          </label>
          <label>Nutrientes: <input type="text" id="nutrientes-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="${bloco.receita.nutrientes || ""}" /></label>
          <label>Receita (g/L): <input type="text" id="receita-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="A: ${bloco.receita.A || ""} / B: ${bloco.receita.B || ""} / C: ${bloco.receita.C || ""}" /></label>
          <label>EC Entrada: <input type="text" id="ec-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="${bloco.receita.ec_entrada || ""}" /></label>
          <label>EC Saída: <input type="text" id="ec_saida-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="${bloco.receita.ec_saida || ""}" /></label>
          <label>Runoff (%): <input type="text" id="runoff-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="${bloco.receita.runoff || ""}" /></label>
          <label>Dryback (%): <input type="text" id="dryback-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="${bloco.receita.dryback || ""}" /></label>
          <label>Temperatura: <input type="text" id="temp-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="${bloco.receita.temperatura || ""}" /></label>
          <label>UR: <input type="text" id="ur-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="${bloco.receita.ur || ""}" /></label>
          <label>VPD: <input type="text" id="vpd-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="${bloco.receita.vpd || ""}" /></label>
          <label>PPFD: <input type="text" id="ppfd-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"} value="${bloco.receita.ppfd || ""}" /></label>
          <label>Notas: <textarea id="notas-${i}" class="w-full border rounded px-2 py-1" ${modoEdicao ? "" : "disabled"}>${bloco.notas || ""}</textarea></label>
          ${modoEdicao ? `<button class="absolute top-1 right-1 text-red-600" onclick="removerBloco(${i})">❌</button>` : ""}
        `;
      }
    }

    wrapper.appendChild(header);
    wrapper.appendChild(corpo);
    blocosContainer.appendChild(wrapper);
  });

  atualizarColheitaEDiaAtual();
}

// 🔹 Atualiza inputs sempre que houver mudança
function atualizarCampo(i, campo, valor) {
  if (!blocos[i]) return;
  if (campo === "etapa") blocos[i].etapa = valor;
  if (campo === "fase") blocos[i].fase = valor;
  if (campo === "estrategia") blocos[i].estrategia = valor;
  if (campo === "notas") blocos[i].notas = valor;
  if (campo === "nutrientes") blocos[i].receita.nutrientes = valor;
  if (campo === "receita") {
    const [a, b, c] = valor.split("/").map(s => parseFloat(s.replace(/[^\d.]/g, "")) || 0);
    blocos[i].receita.A = a;
    blocos[i].receita.B = b;
    blocos[i].receita.C = c;
  }
  if (campo === "ec") blocos[i].receita.ec_entrada = valor;
  if (campo === "ec_saida") blocos[i].receita.ec_saida = valor;
  if (campo === "runoff") blocos[i].receita.runoff = valor;
  if (campo === "dryback") blocos[i].receita.dryback = valor;
  if (campo === "temp") blocos[i].receita.temperatura = valor;
  if (campo === "ur") blocos[i].receita.ur = valor;
  if (campo === "vpd") blocos[i].receita.vpd = valor;
  if (campo === "ppfd") blocos[i].receita.ppfd = valor;
}

// 🔹 Adiciona novo bloco
function adicionarBloco(tipo = "PADRAO") {
  const hoje = new Date().toISOString().slice(0, 10);
  blocos.push({
    nome: `Semana ${blocos.length + 1}`,
    tipo,
    inicio: hoje,
    fim: hoje,
    etapa: "",
    fase: "",
    estrategia: "",
    notas: "",
    receita: {
      nutrientes: "",
      A: 0,
      B: 0,
      C: 0,
      ec_entrada: "",
      ec_saida: "",
      runoff: "",
      dryback: "",
      temperatura: "",
      ur: "",
      vpd: "",
      ppfd: ""
    }
  });
  renderizarBlocos();
}

// 🔹 Remove bloco
function removerBloco(i) {
  if (!confirm("Tem certeza que deseja remover este bloco?")) return;
  blocos.splice(i, 1);
  renderizarBlocos();
}

// 🔹 Salvar no Firestore
async function salvarCultivo() {
  if (!usuario) return alert("Usuário não autenticado.");
  const nome = document.getElementById("nome-cultivo").value.trim();
  const dataInicio = document.getElementById("data-inicio").value;
  if (!nome || !dataInicio) return alert("Preencha o nome e a data de início.");

  const docRef = cultivoId
    ? doc(db, "cultivos", cultivoId)
    : doc(collection(db, "cultivos"));

  const payload = {
    nome,
    data_inicio: dataInicio,
    blocos
  };

  await setDoc(docRef, payload);
  alert("Cultivo salvo!");
  if (!cultivoId) {
    window.location.href = `cultivos-salvos.html`;
  }
}

// 🔹 Carregar dados do Firestore
async function carregarCultivo(id) {
  const docRef = doc(db, "cultivos", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const data = snap.data();
  cultivoId = id;
  document.getElementById("nome-cultivo").value = data.nome || "";
  document.getElementById("data-inicio").value = data.data_inicio || "";
  blocos = data.blocos || [];
  renderizarBlocos();
}

// 🔹 Atualiza colheita prevista e dia atual
function atualizarColheitaEDiaAtual() {
  const dataHoje = new Date().toISOString().slice(0, 10);
  let diasAcumulados = 0;
  let colheita = "";
  let faseAtual = "";
  blocos.forEach((b) => {
    if (!b.inicio || !b.fim || b.tipo === "TAREFA") return;
    if (!b.afetaCronograma) return;
    const inicio = new Date(b.inicio);
    const fim = new Date(b.fim);
    const duracao = Math.round((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
    if (b.nome.toUpperCase().includes("PROCESSAR") && !colheita) {
      colheita = b.inicio;
    }
    if (dataHoje >= b.inicio && dataHoje <= b.fim) {
      faseAtual = `${b.tipo || "?"} dia ${diasAcumulados + 1}`;
    }
    diasAcumulados += duracao;
  });

  document.getElementById("colheita").textContent = colheita
    ? `🌾 Colheita em ${formatarData(colheita)}`
    : "";
  document.getElementById("dia-atual").textContent = faseAtual
    ? `📆 ${faseAtual}`
    : "";
}

// 🔹 Formatar data para exibição
function formatarData(iso) {
  if (!iso) return "-";
  const [ano, mes, dia] = iso.split("-");
  const nomesMes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${dia}-${nomesMes[parseInt(mes) - 1]}-${ano}`;
}

// 🔹 Atualizações diretas de campos no array
function atualizarCampo(i, campo, valor) {
  blocos[i][campo] = valor;
}

function atualizarReceita(i, campo, valor) {
  blocos[i].receita[campo] = valor;
}

// 🔹 Alternar modo edição
document.getElementById("alternar-edicao").addEventListener("click", () => {
  modoEdicao = !modoEdicao;
  document.getElementById("alternar-edicao").textContent = modoEdicao ? "👁 Visualizar" : "✏️ Editar";
  renderizarBlocos();
});

// 🔹 Inicializar
verificarLogin(async (user) => {
  usuario = user;

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  if (id) {
    await carregarCultivo(id);
  } else {
    blocos = [];
    renderizarBlocos();
  }

  document.getElementById("salvar-cultivo").addEventListener("click", salvarCultivo);
  document.getElementById("adicionar-bloco").addEventListener("click", adicionarBloco);
});
