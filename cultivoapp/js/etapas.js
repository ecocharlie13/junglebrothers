// /cultivoapp/js/etapas.js
import { db } from "/cultivoapp/js/firebase-init.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const tabela = document.getElementById("tabela-etapas");
  const btnAdd = document.getElementById("add-row");

  const campos = [
    "Evento", "Semana", "Data Inicial", "Data Final", "Fase", "Estratégia",
    "Nutrientes", "Receita", "EC Entrada", "EC Saída",
    "Runoff", "Dryback", "Temperatura", "UR", "VPD", "PPFD", "Observações"
  ];

  async function carregarEtapas() {
    const snapshot = await getDocs(collection(db, "etapas"));
    snapshot.forEach(docSnap => {
      adicionarLinha(docSnap.id, docSnap.data());
    });
  }

  function adicionarLinha(id = null, dados = {}) {
    const tr = document.createElement("tr");

    campos.forEach(campo => {
      const td = document.createElement("td");
      const input = document.createElement("input");

      input.type = (campo.includes("Data")) ? "date" : "text";
      input.className = "border px-2 py-1 w-full";
      input.value = dados[campo] || "";
      input.dataset.campo = campo;
      td.appendChild(input);
      tr.appendChild(td);
    });

    const tdAcoes = document.createElement("td");
    tdAcoes.className = "text-center";

    const btnSalvar = document.createElement("button");
    btnSalvar.textContent = "Salvar";
    btnSalvar.className = "bg-green-500 text-white px-2 py-1 rounded mr-2";
    btnSalvar.addEventListener("click", async () => {
      const dados = {};
      tr.querySelectorAll("input").forEach(input => {
        dados[input.dataset.campo] = input.value;
      });

      if (id) {
        await updateDoc(doc(db, "etapas", id), dados);
      } else {
        const docRef = await addDoc(collection(db, "etapas"), dados);
        id = docRef.id;
      }
    });

    const btnDeletar = document.createElement("button");
    btnDeletar.textContent = "Deletar";
    btnDeletar.className = "bg-red-500 text-white px-2 py-1 rounded";
    btnDeletar.addEventListener("click", async () => {
      if (id) await deleteDoc(doc(db, "etapas", id));
      tr.remove();
    });

    tdAcoes.appendChild(btnSalvar);
    tdAcoes.appendChild(btnDeletar);
    tr.appendChild(tdAcoes);
    tabela.appendChild(tr);
  }

  btnAdd.addEventListener("click", () => adicionarLinha());
  carregarEtapas();
});
