// blocos.js atualiz 3
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
    diaInfo.textContent = `📅 ${faseAtual} dia ${diaTotal}`;
  } else {
    diaInfo.textContent = "";
  }
}

function renderizarBlocos() {
  // 🛠️ Salva dados dos blocos expandidos antes de redesenhar
  blocos.forEach((bloco, i) => {
    if (bloco.expandido) {
      bloco.etapa = document.getElementById(`etapa-${i}`)?.value || "";
      bloco.fase = document.getElementById(`fase-${i}`)?.value || "";
      bloco.estrategia = document.getElementById(`estrategia-${i}`)?.value || "";
      bloco.ec_entrada = document.getElementById(`ec_entrada-${i}`)?.value || "";
      bloco.ph_entrada = document.getElementById(`ph_entrada-${i}`)?.value || "";
      bloco.nutrientes = document.getElementById(`nutrientes-${i}`)?.value || "";
      bloco.receita = document.getElementById(`receita-${i}`)?.value || "";
      bloco.ec_saida = document.getElementById(`ec_saida-${i}`)?.value || "";
      bloco.runoff = document.getElementById(`runoff-${i}`)?.value || "";
      bloco.dryback = document.getElementById(`dryback-${i}`)?.value || "";
      bloco.temperatura = document.getElementById(`temperatura-${i}`)?.value || "";
      bloco.umidade = document.getElementById(`umidade-${i}`)?.value || "";
      bloco.vpd = document.getElementById(`vpd-${i}`)?.value || "";
      bloco.ppfd = document.getElementById(`ppfd-${i}`)?.value || "";
      bloco.notas = document.getElementById(`notas-${i}`)?.value || "";
    }
  });

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
      // Salva dados atuais antes de trocar expansão
      blocos.forEach((b, j) => {
        if (b.expandido && j !== i) {
          b.etapa = document.getElementById(`etapa-${j}`)?.value || "";
          b.fase = document.getElementById(`fase-${j}`)?.value || "";
          b.estrategia = document.getElementById(`estrategia-${j}`)?.value || "";
          b.ec_entrada = document.getElementById(`ec_entrada-${j}`)?.value || "";
          b.ph_entrada = document.getElementById(`ph_entrada-${j}`)?.value || "";
          b.nutrientes = document.getElementById(`nutrientes-${j}`)?.value || "";
          b.receita = document.getElementById(`receita-${j}`)?.value || "";
          b.ec_saida = document.getElementById(`ec_saida-${j}`)?.value || "";
          b.runoff = document.getElementById(`runoff-${j}`)?.value || "";
          b.dryback = document.getElementById(`dryback-${j}`)?.value || "";
          b.temperatura = document.getElementById(`temperatura-${j}`)?.value || "";
          b.umidade = document.getElementById(`umidade-${j}`)?.value || "";
          b.vpd = document.getElementById(`vpd-${j}`)?.value || "";
          b.ppfd = document.getElementById(`ppfd-${j}`)?.value || "";
          b.notas = document.getElementById(`notas-${j}`)?.value || "";
          b.expandido = false;
        }
      });

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
      corpo.innerHTML = gerarFormularioExpandido(bloco, i); // Função que monta o HTML dos campos
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
}

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
      corpo.innerHTML = gerarFormularioExpandido(bloco, i);
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
}

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
      corpo.innerHTML = `
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
        <label class="block">EC Entrada (mS/cm): <input type="number" id="ec-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.ec_entrada || ""}" /></label>
        <label class="block">pH Entrada: <input type="number" id="ph-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.ph_entrada || ""}" /></label>
        <label class="block">Nutrientes: <input type="text" id="nutrientes-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.nutrientes || ""}" /></label>
        <label class="block">Receita: <textarea id="receita-${i}" class="w-full border rounded px-2 py-1">${bloco.receita.receita || ""}</textarea></label>
        <label class="block">EC Saída (mS/cm): <input type="number" id="ec_saida-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.ec_saida || ""}" /></label>
        <label class="block">Runoff (%): <input type="number" id="runoff-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.runoff || ""}" /></label>
        <label class="block">Dryback (%): <input type="number" id="dryback-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.dryback || ""}" /></label>
        <label class="block">Temperatura (°C): <input type="number" id="temp-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.temperatura || ""}" /></label>
        <label class="block">Umidade Relativa (%): <input type="number" id="ur-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.ur || ""}" /></label>
        <label class="block">VPD (kPa): <input type="number" id="vpd-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.vpd || ""}" /></label>
        <label class="block">PPFD (µmol/m²/s): <input type="number" id="ppfd-${i}" class="w-full border rounded px-2 py-1" value="${bloco.receita.ppfd || ""}" /></label>
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
        bloco.expandido = false; // força todos a iniciarem fechados
      });
      renderizarBlocos();
    },
  });
}

window.removerBloco = function (index) {
  if (confirm("Deseja remover este bloco?")) {
    blocos.splice(index, 1);
    renderizarBlocos();
  }
};

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
  // ⚠️ Salva os dados do DOM nos objetos blocos antes de montar o cultivo
  atualizarDados();

  if (!inputDataInicio.value || !inputNome.value) {
    alert("Preencha o nome do cultivo e a data de início.");
    return;
  }

  const cultivo = {
    nome: inputNome.value,
    data_inicio: inputDataInicio.value,
    criado_em: Timestamp.now(),
    blocos: JSON.parse(JSON.stringify(blocos)), // 🔒 cópia profunda pra garantir persistência do estado
  };

  try {
    if (cultivoId) {
      await updateDoc(doc(db, "cultivos_blocos", cultivoId), cultivo);
      alert("Cultivo atualizado com sucesso!");
    } else {
      const docRef = await addDoc(collection(db, "cultivos_blocos"), cultivo);
      cultivoId = docRef.id;
      window.history.replaceState(null, null, `?id=${cultivoId}`);
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
      blocos = (dados.blocos || []).map(b => ({ ...b, expandido: false }));
      renderizarBlocos();
    }
  } catch (e) {
    console.error("Erro ao carregar cultivo:", e);
  }
}
