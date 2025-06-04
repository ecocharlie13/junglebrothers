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

const container = document.getElementById("blocos-container");
const inputData = document.getElementById("data-inicio");
const inputNome = document.getElementById("nome-cultivo");

window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  cultivoId = params.get("id");
  if (cultivoId) {
    try {
      const docRef = doc(db, "cultivos_blocos", cultivoId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cultivo = snap.data();
        inputNome.value = cultivo.nome || "";
        inputData.value = cultivo.data_inicio || "";
        blocos = cultivo.blocos || [];
        renderizar();
      } else {
        alert("Cultivo não encontrado.");
      }
    } catch (e) {
      console.error("Erro ao carregar cultivo:", e);
      alert("Erro ao carregar cultivo salvo.");
    }
  }
});

window.adicionarBloco = function(tipo) {
  if (!inputData.value) return alert("Preencha a data de início.");

  blocos.push({
    nome: tipo,
    etapa: "",
    fase: "",
    estrategia: "",
    ordem: blocos.length,
    inicio: "",
    fim: "",
    receita: { ec_entrada: "", ppfd: "" },
    notas: "",
    tarefas: [],
    cor: cores[tipo],
    expandido: true
  });

  atualizarDatas();
  renderizar();
};

function atualizarDatas() {
  const dataBase = new Date(inputData.value);
  let contadores = {};

  blocos.forEach((bloco, i) => {
    const tipo = bloco.nome;
    contadores[tipo] = (contadores[tipo] || 0) + 1;

    const inicio = new Date(dataBase);
    inicio.setDate(inicio.getDate() + i * 7);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);

    bloco.inicio = inicio.toISOString().split("T")[0];
    bloco.fim = fim.toISOString().split("T")[0];
    bloco.ordem = contadores[tipo];
  });
}

function renderizar() {
  container.innerHTML = "";
  blocos.forEach((bloco, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "w-60 bg-white shadow border rounded overflow-hidden";

    const header = document.createElement("div");
    header.className = `${bloco.cor} text-white px-4 py-2 flex justify-between items-center`;
    header.innerHTML = `<div><strong>Semana ${bloco.ordem} - ${bloco.nome}</strong><br><span class="text-sm">${bloco.inicio} → ${bloco.fim}</span></div>`;

    if (bloco.expandido) {
      const btn = document.createElement("button");
      btn.innerText = "✕";
      btn.className = "ml-2 text-white hover:text-red-200";
      btn.onclick = () => {
        if (confirm("Deseja remover este bloco?")) {
          blocos.splice(i, 1);
          atualizarDatas();
          renderizar();
        }
      };
      header.appendChild(btn);
    }

    header.addEventListener("click", () => {
      bloco.expandido = !bloco.expandido;
      renderizar();
    });

    const corpo = document.createElement("div");
    corpo.className = "p-3 text-sm";

    if (!bloco.expandido) {
      corpo.innerHTML = `
        <div><strong>${bloco.nome}</strong></div>
        <div>Etapa: ${bloco.etapa || "-"}</div>
        <div>EC In: ${bloco.receita.ec_entrada || "-"}</div>
        <div>PPFD: ${bloco.receita.ppfd || "-"}</div>
      `;
    } else {
      corpo.innerHTML = `
        <label class="block mb-1">Etapa: <input value="${bloco.etapa}" class="w-full border rounded px-2 py-1" oninput="blocos[${i}].etapa=this.value"></label>
        <label class="block mb-1">Fase: <input value="${bloco.fase}" class="w-full border rounded px-2 py-1" oninput="blocos[${i}].fase=this.value"></label>
        <label class="block mb-1">Estratégia: <input value="${bloco.estrategia}" class="w-full border rounded px-2 py-1" oninput="blocos[${i}].estrategia=this.value"></label>
        <label class="block mb-1">EC Entrada: <input value="${bloco.receita.ec_entrada}" class="w-full border rounded px-2 py-1" oninput="blocos[${i}].receita.ec_entrada=this.value"></label>
        <label class="block mb-1">PPFD: <input value="${bloco.receita.ppfd}" class="w-full border rounded px-2 py-1" oninput="blocos[${i}].receita.ppfd=this.value"></label>
        <label class="block mb-2">Notas: <textarea class="w-full border rounded px-2 py-1" oninput="blocos[${i}].notas=this.value">${bloco.notas}</textarea></label>
      `;
    }

    wrapper.appendChild(header);
    wrapper.appendChild(corpo);
    container.appendChild(wrapper);
  });
}

inputData.addEventListener("change", () => {
  atualizarDatas();
  renderizar();
});

window.salvarCultivo = async function () {
  if (!inputNome.value || !inputData.value || blocos.length === 0) {
    alert("Preencha o nome, a data de início e adicione ao menos um bloco.");
    return;
  }

  try {
    const cultivo = {
      nome: inputNome.value,
      data_inicio: inputData.value,
      criado_em: Timestamp.now(),
      blocos
    };

    if (cultivoId) {
      await setDoc(doc(db, "cultivos_blocos", cultivoId), cultivo);
    } else {
      const ref = await addDoc(collection(db, "cultivos_blocos"), cultivo);
      cultivoId = ref.id;
      history.replaceState(null, "", `?id=${cultivoId}`);
    }

    alert("Cultivo salvo!");
    renderizar();
  } catch (e) {
    console.error(e);
    alert("Erro ao salvar cultivo.");
  }
};
