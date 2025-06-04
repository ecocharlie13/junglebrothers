import { db } from "/cultivoapp/js/firebase-init.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const campos = [
  "Evento", "ETD (dias)", "Etapa", "Fase", "Estratégia de manejo", "Nutrientes",
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

  const headerRow = document.getElementById("header-row");
  campos.concat("Salvar", "Excluir").forEach(campo => {
    const th = document.createElement("th");
    th.className = "border px-2 py-1";
    th.textContent = campo;
    headerRow.appendChild(th);
  });

  btnAdd.addEventListener("click", () => adicionarLinha());

  carregarEtapas();

  async function carregarEtapas() {
    const snapshot = await getDocs(collection(db, "etapas"));
    snapshot.forEach(docSnap => {
      adicionarLinha(docSnap.id, docSnap.data());
    });
  }

  function adicionarLinha(id = null, dados = {}) {
    const tr = document.createElement("tr");
    const inputs = {};

    campos.forEach(campo => {
      const td = document.createElement("td");
      td.className = "border px-2 py-1";
      let input;
      const valor = dados[campo] || "";

      if (campo === "Etapa") {
        input = document.createElement("select");
        etapaOptions.forEach(opt => {
          const option = document.createElement("option");
          option.value = opt;
          option.textContent = opt;
          if (valor === opt) option.selected = true;
          input.appendChild(option);
        });
      } else if (campo === "Fase") {
        input = document.createElement("select");
        faseOptions.forEach(opt => {
          const option = document.createElement("option");
          option.value = opt;
          option.textContent = opt;
          if (valor === opt) option.selected = true;
          input.appendChild(option);
        });
      } else if (campo === "Estratégia de manejo") {
        input = document.createElement("select");
        estrategiaOptions.forEach(opt => {
          const option = document.createElement("option");
          option.value = opt;
          option.textContent = opt;
          if (valor === opt) option.selected = true;
          input.appendChild(option);
        });
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

      inputs[campo] = input;
      td.appendChild(input);
      tr.appendChild(td);
    });

    // Botão Salvar
    const tdSalvar = document.createElement("td");
    tdSalvar.className = "border px-2 py-1 text-center";
    const btnSalvar = document.createElement("button");
    btnSalvar.textContent = "💾";
    btnSalvar.className = "px-2 py-1 bg-blue-500 text-white rounded";
    btnSalvar.addEventListener("click", async () => {
      const dadosSalvar = {};
      campos.forEach(campo => {
        dadosSalvar[campo] = inputs[campo].value;
      });
      if (id) {
        await updateDoc(doc(db, "etapas", id), dadosSalvar);
        alert("Etapa atualizada!");
      } else {
        await addDoc(collection(db, "etapas"), dadosSalvar);
        alert("Etapa criada!");
        location.reload();
      }
    });
    tdSalvar.appendChild(btnSalvar);
    tr.appendChild(tdSalvar);

    // Botão Excluir
    const tdExcluir = document.createElement("td");
    tdExcluir.className = "border px-2 py-1 text-center";
    const btnExcluir = document.createElement("button");
    btnExcluir.textContent = "🗑️";
    btnExcluir.className = "px-2 py-1 bg-red-500 text-white rounded";
    btnExcluir.addEventListener("click", async () => {
      if (id && confirm("Deseja mesmo deletar esta etapa?")) {
        await deleteDoc(doc(db, "etapas", id));
        alert("Etapa excluída!");
        location.reload();
      } else if (!id) {
        tr.remove();
      }
    });
    tdExcluir.appendChild(btnExcluir);
    tr.appendChild(tdExcluir);

    document.getElementById("tabela-etapas").appendChild(tr);
  }
});
