import { auth, db } from "/cultivoapp/js/firebase-init.js";
import {
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  collection,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { verificarLogin, sair } from "/cultivoapp/js/auth.js";

let usuario = null;

verificarLogin(async (user) => {
  usuario = user;
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;

  carregarDropdown();

  document.getElementById("salvar").addEventListener("click", salvarBlueprint);
  document.getElementById("carregar").addEventListener("click", loadBlueprint);
  document.getElementById("adicionar").addEventListener("click", adicionarLinha);
  document.getElementById("deletar").addEventListener("click", deletarBlueprint);
  document.getElementById("logout").addEventListener("click", sair);
});

export async function carregarDropdown() {
  const ref = collection(db, "blueprints");
  const q = query(ref, where("usuario", "==", usuario.email));
  const snap = await getDocs(q);
  const select = document.getElementById("blueprint-select");
  select.innerHTML = "<option disabled selected hidden>Escolha uma blueprint</option>";
  snap.forEach((docSnap) => {
    const opt = document.createElement("option");
    opt.value = docSnap.id;
    opt.textContent = docSnap.data().nome;
    select.appendChild(opt);
  });
}

export async function loadBlueprint() {
  const id = document.getElementById("blueprint-select").value;
  const ref = doc(db, "blueprints", id);
  const docSnap = await getDoc(ref);
  if (!docSnap.exists()) return;

  const data = docSnap.data();
  document.getElementById("nome-blueprint").value = data.nome;
  const tbody = document.getElementById("tabela");
  tbody.innerHTML = "";
  data.eventos.forEach(ev => {
    const tr = criarLinha(ev.evento, ev.dias, ev.ajuste, ev.notas);
    tbody.appendChild(tr);
  });
}

export async function salvarBlueprint() {
  const nome = document.getElementById("nome-blueprint").value.trim();
  if (!nome) return alert("Dê um nome à sua blueprint.");

  const linhas = document.querySelectorAll("#tabela tr");
  const eventos = [];
  linhas.forEach(row => {
    eventos.push({
      evento: row.querySelector(".evento")?.value || "",
      dias: parseInt(row.querySelector(".dias")?.value || "0"),
      ajuste: parseInt(row.querySelector(".ajuste")?.value || "0"),
      notas: row.querySelector(".notas")?.value || ""
    });
  });

  const docRef = doc(db, "blueprints", nome + "_" + usuario.uid);
  await setDoc(docRef, {
    usuario: usuario.email,
    nome,
    eventos,
    criado: new Date().toISOString()
  });

  document.getElementById("status").textContent = "✅ Blueprint salva com sucesso!";
  setTimeout(() => (document.getElementById("status").textContent = ""), 4000);
  carregarDropdown();
}

export async function deletarBlueprint() {
  const id = document.getElementById("blueprint-select").value;
  if (!id) return alert("Selecione uma blueprint.");
  if (!confirm("Tem certeza que deseja deletar esta blueprint?")) return;

  await deleteDoc(doc(db, "blueprints", id));
  document.getElementById("nome-blueprint").value = "";
  document.getElementById("tabela").innerHTML = "";
  carregarDropdown();
}

export function adicionarLinha() {
  const tbody = document.getElementById("tabela");
  tbody.appendChild(criarLinha("", 0, 0, ""));
}

function criarLinha(evento = "", dias = 0, ajuste = 0, notas = "") {
  const tr = document.createElement("tr");
  tr.className = "linha";

  const tdEvento = document.createElement("td");
  const inputEvento = document.createElement("input");
  inputEvento.className = "evento px-2 py-1 border rounded w-full";
  inputEvento.value = evento;
  tdEvento.appendChild(inputEvento);

  const tdDias = document.createElement("td");
  const inputDias = document.createElement("input");
  inputDias.className = "dias px-2 py-1 border rounded w-full";
  inputDias.type = "number";
  inputDias.value = dias;
  tdDias.appendChild(inputDias);

  const tdAjuste = document.createElement("td");
  const inputAjuste = document.createElement("input");
  inputAjuste.className = "ajuste px-2 py-1 border rounded w-full";
  inputAjuste.type = "number";
  inputAjuste.value = ajuste;
  tdAjuste.appendChild(inputAjuste);

  const tdNotas = document.createElement("td");
  const inputNotas = document.createElement("input");
  inputNotas.className = "notas px-2 py-1 border rounded w-full";
  inputNotas.value = notas;
  tdNotas.appendChild(inputNotas);

  const tdRemover = document.createElement("td");
  const btnRemover = document.createElement("button");
  btnRemover.className = "text-red-500 font-bold px-2";
  btnRemover.textContent = "🗑️";
  btnRemover.addEventListener("click", () => {
    if (confirm("Deseja remover esta etapa?")) {
      tr.remove();
    }
  });
  tdRemover.appendChild(btnRemover);

  tr.append(tdEvento, tdDias, tdAjuste, tdNotas, tdRemover);
  return tr;
}
