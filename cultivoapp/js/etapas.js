import { db } from "/cultivoapp/js/firebase-init.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const campos = [
  "Selecionar", "Evento", "ETD (dias)", "Etapa", "Fase", "Estratégia de manejo", "Nutrientes",
  "Receita", "EC Entrada", "EC Saída", "Runoff (%)", "Dryback (%)", "Temp. (°C)",
  "UR (%)", "VPD (kPa)", "PPFD", "Observações", "Ações"
];

const etapaOptions = [
  "Clonar", "Germinar", "Vegetar",
  "Florar > Transição", "Florar > Início de Flora", "Florar > Meio de Flora",
  "Florar > Fim de Flora", "Florar > Flush"
];

const faseOptions = ["Vegetação", "Estiramento", "Engorda", "Finalização"];
const estrategiaOptions = ["Vegetativo", "Generativo", "Misto (Veg/Gen)"];

document.addEventListener("DOMContentLoaded", () => {
  const tabela = document.getElementById("tabela-etapas");
  const btnAdd = document.getElementById("add-row");
  const btnSalvarTudo = document.getElementById("salvar-tudo");
  const btnExcluirSelecionados = document.getElementById("excluir-selecionados");

  const headerRow = document.getElementById("header-row");
  campos.forEach(campo => {
    const th = document.createElement("th");
    th.className = "border px-2 py-1";
    th.textContent = campo;
    headerRow.appendChild(th);
  });

  btnAdd.addEventListener("click", () => adicionarLinha());

  btnSalvarTudo.addEventListener("click", salvarTudo);
  btnExcluirSelecionados.addEventListener("click", excluirSelecionados);

  carregarEtapas();
});

async function carregarEtapas() {
  const q = query(collection(db, "etapas"), orderBy("ordem"));
  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap => {
    adicionarLinha(docSnap.id, docSnap.data());
  });

  setTimeout(() => tornarColunasRedimensionaveis(), 500);
}

function adicionarLinha(id = null, dados = {}) {
  const tr = document.createElement("tr");
  const inputs = {};
  if (id) tr.dataset.id = id;

  campos.forEach(campo => {
    const td = document.createElement("td");
    td.className = "border px-2 py-1";
    let input;

    if (campo === "Selecionar") {
      input = document.createElement("input");
      input.type = "checkbox";
      input.className = "checkbox-selecionar";
    } else {
      const valor = dados[campo] || "";

      if (campo === "Etapa") {
        input = criarSelect(etapaOptions, valor);
      } else if (campo === "Fase") {
        input = criarSelect(faseOptions, valor);
      } else if (campo === "Estratégia de manejo") {
        input = criarSelect(estrategiaOptions, valor);
      } else if (["Observações", "Ações", "Receita"].includes(campo)) {
        input = document.createElement("textarea");
        input.className = "w-full";
        input.value = valor;
      } else if (["ETD (dias)", "EC Entrada", "EC Saída", "Runoff (%)", "Dryback (%)", "VPD (kPa)", "PPFD"].includes(campo)) {
        input = document.createElement("input");
        input.type = "number";
        input.className = "w-20";
        input.value = valor;
      } else if (["Temp. (°C)", "UR (%)"].includes(campo)) {
        input = document.createElement("input");
        input.type = "number";
        input.step = "0.1";
        input.className = "w-20";
        input.value = valor;
      } else {
        input = document.createElement("input");
        input.type = "text";
        input.className = "w-full";
        input.value = valor;
      }

      // Marcar linha como modificada ao editar
      input.addEventListener("input", () => {
        tr.classList.add("bg-yellow-50");
        tr.dataset.modified = "true";
      });
    }

    td.appendChild(input);
    tr.appendChild(td);

    if (campo !== "Selecionar") {
      inputs[campo] = input;
    }
  });

  tr.dataset.inputs = JSON.stringify(inputs);
  tr.setAttribute("draggable", true);
  configurarDrag(tr);
  document.getElementById("tabela-etapas").appendChild(tr);
}

function criarSelect(opcoes, valorSelecionado) {
  const select = document.createElement("select");
  opcoes.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    if (valorSelecionado === opt) option.selected = true;
    select.appendChild(option);
  });
  return select;
}

async function salvarTudo() {
  const linhas = document.querySelectorAll("#tabela-etapas tr");
  let ordem = 0;

  for (const linha of linhas) {
    const id = linha.dataset.id;
    const tds = linha.querySelectorAll("td");
    const dados = {};
    let i = 1; // começa após coluna Selecionar

    for (const campo of campos.slice(1)) {
      const input = tds[i]?.querySelector("input, select, textarea");
      if (input) dados[campo] = input.value;
      i++;
    }

    dados.ordem = ordem;
    ordem++;

    if (id) {
      await updateDoc(doc(db, "etapas", id), dados);
    } else {
      await addDoc(collection(db, "etapas"), dados);
    }

    linha.classList.remove("bg-yellow-50");
    linha.dataset.modified = "false";
  }

  alert("Todas as etapas foram salvas com sucesso!");
}

async function excluirSelecionados() {
  const selecionadas = document.querySelectorAll("input.checkbox-selecionar:checked");
  if (selecionadas.length === 0) return;

  if (!confirm(`Deseja excluir ${selecionadas.length} etapa(s)?`)) return;

  for (const checkbox of selecionadas) {
    const linha = checkbox.closest("tr");
    const id = linha.dataset.id;
    if (id) await deleteDoc(doc(db, "etapas", id));
    linha.remove();
  }

  alert("Etapas excluídas com sucesso!");
}

// Redimensionamento de colunas
function tornarColunasRedimensionaveis() {
  const ths = document.querySelectorAll("#header-row th");
  ths.forEach(th => {
    th.classList.add("resizable");
    const resizer = document.createElement("div");
    resizer.className = "resizer";
    th.appendChild(resizer);

    let x = 0;
    let w = 0;

    const onMouseMove = e => {
      const dx = e.clientX - x;
      th.style.width = `${w + dx}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    resizer.addEventListener("mousedown", e => {
      x = e.clientX;
      w = th.offsetWidth;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  });
}

// Drag & Drop por linha
function configurarDrag(row) {
  row.addEventListener("dragstart", () => {
    row.style.opacity = "0.5";
    row.classList.add("dragging");
  });

  row.addEventListener("dragend", () => {
    row.style.opacity = "1";
    row.classList.remove("dragging");
  });

  row.addEventListener("dragover", e => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    const bounding = row.getBoundingClientRect();
    const offset = e.clientY - (bounding.top + bounding.height / 2);
    if (offset > 0) {
      row.after(dragging);
    } else {
      row.before(dragging);
    }
  });
}
