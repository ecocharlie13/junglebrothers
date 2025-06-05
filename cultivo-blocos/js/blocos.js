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
      ec_saida: "",
      nutrientes: "",
      receita_texto: "",
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
    wrapper.className = `bg-white shadow border rounded overflow-hidden relative ${bloco.expandido ? 'col-span-full' : 'col-span-1'}`;
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
    corpo.className = "p-4 text-sm";

    if (!bloco.expandido) {
      corpo.innerHTML = `
        <div><strong>${bloco.etapa || "-"}</strong></div>
        <div>Fase: ${bloco.fase || "-"}</div>
        <div>Estratégia: ${bloco.estrategia || "-"}</div>
      `;
    } else {
      corpo.innerHTML = `
        <label class="block mb-1">Etapa:
          <select class="w-full border px-2 py-1 rounded" id="etapa-${i}">
            <option value="">--</option>
            <option value="germinacao">germinação</option>
            <option value="vega">vega</option>
            <option value="inicio de flora">início de flora</option>
            <option value="meio de flora">meio de flora</option>
            <option value="fim de flora">fim de flora</option>
            <option value="flush">flush</option>
          </select>
        </label>
        <label class="block mb-1">Fase:
          <select class="w-full border px-2 py-1 rounded" id="fase-${i}">
            <option value="">--</option>
            <option value="propagacao">propagação</option>
            <option value="vegetacao">vegetação</option>
            <option value="estiramento">estiramento</option>
            <option value="engorda">engorda</option>
            <option value="finalizacao">finalização</option>
          </select>
        </label>
        <label class="block mb-1">Estratégia:
          <select class="w-full border px-2 py-1 rounded" id="estrategia-${i}">
            <option value="">--</option>
            <option value="clonagem">clonagem</option>
            <option value="vegetativo">vegetativo</option>
            <option value="generativo">generativo</option>
            <option value="misto (veg/gen)">misto (veg/gen)</option>
          </select>
        </label>
        <label class="block mb-1">EC Entrada: <input type="number" class="w-full border px-2 py-1 rounded" id="ec_entrada-${i}" value="${bloco.receita.ec_entrada || ""}"></label>
        <label class="block mb-1">pH Entrada: <input type="number" class="w-full border px-2 py-1 rounded" id="ph_entrada-${i}" value="${bloco.receita.ph_entrada || ""}"></label>
        <label class="block mb-1">Nutrientes (fabricante): <input type="text" class="w-full border px-2 py-1 rounded" id="nutrientes-${i}" value="${bloco.receita.nutrientes || ""}"></label>
        <label class="block mb-1">Receita: <textarea class="w-full border px-2 py-1 rounded" id="receita_texto-${i}">${bloco.receita.receita_texto || ""}</textarea></label>
        <label class="block mb-1">EC Saída: <input type="number" class="w-full border px-2 py-1 rounded" id="ec_saida-${i}" value="${bloco.receita.ec_saida || ""}"></label>
        <label class="block mb-1">Runoff (%): <input type="number" class="w-full border px-2 py-1 rounded" id="runoff-${i}" value="${bloco.receita.runoff || ""}"></label>
        <label class="block mb-1">Dryback (%): <input type="number" class="w-full border px-2 py-1 rounded" id="dryback-${i}" value="${bloco.receita.dryback || ""}"></label>
        <label class="block mb-1">Temperatura (°C): <input type="number" class="w-full border px-2 py-1 rounded" id="temperatura-${i}" value="${bloco.receita.temperatura || ""}"></label>
        <label class="block mb-1">Umidade Relativa (%): <input type="number" class="w-full border px-2 py-1 rounded" id="ur-${i}" value="${bloco.receita.ur || ""}"></label>
        <label class="block mb-1">VPD (kPa): <input type="number" class="w-full border px-2 py-1 rounded" id="vpd-${i}" value="${bloco.receita.vpd || ""}"></label>
        <label class="block mb-1">PPFD (µmol/m²/s): <input type="number" class="w-full border px-2 py-1 rounded" id="ppfd-${i}" value="${bloco.receita.ppfd || ""}"></label>
        <label class="block mb-1">Notas: <textarea class="w-full border px-2 py-1 rounded" id="notas-${i}">${bloco.notas || ""}</textarea></label>
        <button class="text-red-600 mt-2" onclick="removerBloco(${i})">❌ Excluir Semana</button>
      `;

      setTimeout(() => {
        document.getElementById(`etapa-${i}`).value = bloco.etapa || "";
        document.getElementById(`fase-${i}`).value = bloco.fase || "";
        document.getElementById(`estrategia-${i}`).value = bloco.estrategia || "";
      }, 0);
    }

    wrapper.appendChild(header);
    wrapper.appendChild(corpo);
    blocosContainer.appendChild(wrapper);
  });

  atualizarColheitaEDiaAtual();
}

window.removerBloco = function (i) {
  if (confirm("Tem certeza que deseja excluir este bloco?")) {
    blocos.splice(i, 1);
    blocos.forEach((b, idx) => (b.ordem = idx));
    renderizarBlocos();
  }
};

btnSalvar.addEventListener("click", async () => {
  atualizarDados();

  const nome = inputNome.value.trim();
  const data = inputDataInicio.value;

  if (!nome || !data || blocos.length === 0) {
    alert("Preencha o nome, data de início e adicione pelo menos um bloco.");
    return;
  }

  const payload = {
    nome,
    data_inicio: data,
    blocos,
    uid: firebase.auth().currentUser?.uid || null
  };

  if (cultivoId) {
    await updateDoc(doc(db, "cultivos_blocos", cultivoId), payload);
    alert("Cultivo atualizado com sucesso!");
  } else {
    const docRef = await addDoc(collection(db, "cultivos_blocos"), payload);
    cultivoId = docRef.id;
    window.history.replaceState(null, null, `?id=${cultivoId}`);
    alert("Cultivo salvo com sucesso!");
  }
});

function atualizarDados() {
  blocos.forEach((bloco, i) => {
    bloco.etapa = document.getElementById(`etapa-${i}`)?.value || "";
    bloco.fase = document.getElementById(`fase-${i}`)?.value || "";
    bloco.estrategia = document.getElementById(`estrategia-${i}`)?.value || "";
    bloco.notas = document.getElementById(`notas-${i}`)?.value || "";
    bloco.receita.ec_entrada = document.getElementById(`ec_entrada-${i}`)?.value || "";
    bloco.receita.ph_entrada = document.getElementById(`ph_entrada-${i}`)?.value || "";
    bloco.receita.nutrientes = document.getElementById(`nutrientes-${i}`)?.value || "";
    bloco.receita.receita_texto = document.getElementById(`receita_texto-${i}`)?.value || "";
    bloco.receita.ec_saida = document.getElementById(`ec_saida-${i}`)?.value || "";
    bloco.receita.runoff = document.getElementById(`runoff-${i}`)?.value || "";
    bloco.receita.dryback = document.getElementById(`dryback-${i}`)?.value || "";
    bloco.receita.temperatura = document.getElementById(`temperatura-${i}`)?.value || "";
    bloco.receita.ur = document.getElementById(`ur-${i}`)?.value || "";
    bloco.receita.vpd = document.getElementById(`vpd-${i}`)?.value || "";
    bloco.receita.ppfd = document.getElementById(`ppfd-${i}`)?.value || "";
  });
}

async function carregarCultivoExistente(id) {
  const snap = await getDoc(doc(db, "cultivos_blocos", id));
  if (snap.exists()) {
    const dados = snap.data();
    inputNome.value = dados.nome;
    inputDataInicio.value = dados.data_inicio;
    blocos = dados.blocos || [];
    renderizarBlocos();
  }
}
