import { db } from "./firebase-init.js";
import {
  doc, setDoc, collection, addDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let blocos = [];

window.adicionarBloco = function (fase) {
  const dataInicio = document.getElementById("data-inicio").value;
  if (!dataInicio) return alert("Defina a data de início.");

  const ordem = blocos.length;
  const inicio = new Date(dataInicio);
  inicio.setDate(inicio.getDate() + ordem * 7);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);

  const bloco = {
    fase,
    etapa: "",
    estrategia: "",
    inicio: inicio.toISOString().split("T")[0],
    fim: fim.toISOString().split("T")[0],
    ec_entrada: "",
    ph_entrada: "",
    notas: ""
  };

  blocos.push(bloco);
  renderizar();
};

function renderizar() {
  const container = document.getElementById("blocos-container");
  container.innerHTML = "";

  blocos.forEach((b, i) => {
    const div = document.createElement("div");
    div.className = "bg-white shadow p-4 rounded border";

    div.innerHTML = `
      <h2 class="font-bold mb-2">${b.fase} (${b.inicio} → ${b.fim})</h2>
      <label class="block mb-1">Etapa:
        <input data-i="${i}" data-k="etapa" value="${b.etapa}" class="w-full border px-2 py-1 rounded" />
      </label>
      <label class="block mb-1">Estratégia:
        <input data-i="${i}" data-k="estrategia" value="${b.estrategia}" class="w-full border px-2 py-1 rounded" />
      </label>
      <label class="block mb-1">EC Entrada:
        <input data-i="${i}" data-k="ec_entrada" value="${b.ec_entrada}" class="w-full border px-2 py-1 rounded" />
      </label>
      <label class="block mb-1">PH Entrada:
        <input data-i="${i}" data-k="ph_entrada" value="${b.ph_entrada}" class="w-full border px-2 py-1 rounded" />
      </label>
      <label class="block">Notas:
        <textarea data-i="${i}" data-k="notas" class="w-full border px-2 py-1 rounded">${b.notas}</textarea>
      </label>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll("input, textarea").forEach(el => {
    el.addEventListener("input", (e) => {
      const i = e.target.dataset.i;
      const k = e.target.dataset.k;
      blocos[i][k] = e.target.value;
    });
  });
}

document.getElementById("btn-salvar").addEventListener("click", async () => {
  const nome = document.getElementById("nome-cultivo").value;
  const data = document.getElementById("data-inicio").value;
  if (!nome || !data) return alert("Preencha nome e data.");

  // Atualiza os dados dos blocos com os valores atuais da interface
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

  try {
    const docRef = await addDoc(collection(db, "cultivos"), {
      nome,
      data_inicio: data,
      blocos,
      criado_em: new Date().toISOString()
    });

    alert("✅ Cultivo salvo com sucesso.");
  } catch (e) {
    console.error("❌ Erro ao salvar cultivo:", e);
    alert("Erro ao salvar cultivo.");
  }
});
