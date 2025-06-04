import { db } from "./firebase-init.js";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let blocos = [];
let cultivoId = null;

const cores = {
  "CLONAR": "bg-purple-600",
  "VEGETAR": "bg-green-600",
  "FLORAR": "bg-orange-500",
  "FLUSH": "bg-blue-500",
  "PROCESSAR": "bg-red-500"
};

const inputNomeCultivo = document.getElementById("nome-cultivo");
const inputDataInicio = document.getElementById("data-inicio");
const blocosContainer = document.getElementById("blocos-container");

// Detecta e carrega cultivo salvo via ?id=XYZ
window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  cultivoId = params.get("id");
  if (cultivoId) {
    const docRef = doc(db, "cultivos_blocos", cultivoId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const cultivo = snap.data();
      inputNomeCultivo.value = cultivo.nome || "";
      inputDataInicio.value = cultivo.data_inicio || "";
      blocos = cultivo.blocos || [];
      renderizarBlocos();
    } else {
      alert("Cultivo não encontrado.");
    }
  }
});

window.adicionarBloco = function(tipo) {
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
      ppfd: ""
    },
    notas: "",
    tarefas: [],
    cor: cores[tipo],
    expandido: false
  };

  blocos.push(novoBloco);
  renderizarBlocos();
};

function calcularInicio(ordem) {
  const dataInicial = new Date(inputDataInicio.value);
  dataInicial.setDate(dataInicial.getDate() + ordem * 7);
  return dataInicial;
}

function renderizarBlocos() {
  blocosContainer.innerHTML = "";

  blocos.forEach((bloco, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = `w-60 bg-white shadow border rounded overflow-hidden`;

    const expandido = bloco.expandido ?? false;

    const header = document.createElement("div");
    header.className = `${bloco.cor} text-white px-4 py-2 cursor-pointer`;
    header.innerHTML = `<strong>Semana ${i + 1}</strong><br><span class="text-sm">${bloco.inicio} → ${bloco.fim}</span>`;
    header.addEventListener("click", () => {
      bloco.expandido = !expandido;
      renderizarBlocos();
    });

    const corpo = document.createElement("div");
    corpo.className = "p-4 text-sm";

    if (!expandido) {
      corpo.innerHTML = `
        <div><strong>${bloco.nome}</strong></div>
        <div>Etapa: ${bloco.etapa || "-"}</div>
        <div>EC In: ${bloco.receita.ec_entrada || "-"}</div>
        <div>PPFD: ${bloco.receita.ppfd || "-"}</div>
      `;
    } else {
      corpo.innerHTML = `
        <label class="block mb-1">Etapa:
          <input type="text" class="w-full border px-2 py-1 rounded" data-i="${i}" data-k="etapa" value="${bloco.etapa || ""}">
        </label>
        <label class="block mb-1">Fase:
          <input type="text" class="w-full border px-2 py-1 rounded" data-i="${i}" data-k="fase" value="${bloco.fase || ""}">
        </label>
        <label class="block mb-1">Estratégia:
          <input type="text" class="w-full border px-2 py-1 rounded" data-i="${i}" data-k="estrategia" value="${bloco.estrategia || ""}">
        </label>
        <label class="block mb-1">EC Entrada:
          <input type="text" class="w-full border px-2 py-1 rounded" data-i="${i}" data-k="ec_entrada" value="${bloco.receita.ec_entrada || ""}">
        </label>
        <label class="block mb-1">PPFD:
          <input type="text" class="w-full border px-2 py-1 rounded" data-i="${i}" data-k="ppfd" value="${bloco.receita.ppfd || ""}">
        </label>
        <label class="block mb-2">Notas:
          <textarea class="w-full border px-2 py-1 rounded" data-i="${i}" data-k="notas">${bloco.notas || ""}</textarea>
        </label>
      `;
    }

    wrapper.appendChild(header);
    wrapper.appendChild(corpo);
    blocosContainer.appendChild(wrapper);
  });
}

window.salvarCultivo = async function () {
  if (!inputNomeCultivo.value || !inputDataInicio.value || blocos.length === 0) {
    alert("Preencha o nome do cultivo, a data de início e adicione ao menos um bloco.");
    return;
  }

  // Sincroniza os campos dos blocos
  document.querySelectorAll("[data-i]").forEach(input => {
    const i = parseInt(input.dataset.i);
    const k = input.dataset.k;
    const val = input.value;

    if (k === "etapa" || k === "fase" || k === "estrategia") {
      blocos[i][k] = val;
    } else if (k === "notas") {
      blocos[i].notas = val;
    } else if (k === "ec_entrada" || k === "ppfd") {
      blocos[i].receita[k] = val;
    }
  });

  const cultivo = {
    nome: inputNomeCultivo.value.trim(),
    data_inicio: inputDataInicio.value,
    criado_em: Timestamp.now(),
    blocos
  };

  try {
    if (cultivoId) {
      await setDoc(doc(db, "cultivos_blocos", cultivoId), cultivo);
    } else {
      const ref = await addDoc(collection(db, "cultivos_blocos"), cultivo);
      cultivoId = ref.id;
      history.replaceState(null, "", `?id=${cultivoId}`);
    }

    alert("Cultivo salvo com sucesso!");
    renderizarBlocos();
  } catch (e) {
    console.error("Erro ao salvar:", e);
    alert("Erro ao salvar cultivo.");
  }
};
