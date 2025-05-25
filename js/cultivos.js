// js/cultivos.js

import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let usuario = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  usuario = user;
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;

  await carregarBlueprints();
  await carregarCultivos();

  document.getElementById("criar-cultivo").addEventListener("click", criarCultivo);
  document.getElementById("abrir-cultivo").addEventListener("click", abrirCultivos);
  document.getElementById("deletar-cultivo").addEventListener("click", deletarCultivos);
});

async function carregarBlueprints() {
  const ref = collection(db, "blueprints");
  const q = query(ref, where("usuario", "==", usuario.email));
  const snap = await getDocs(q);
  const select = document.getElementById("blueprint-select");
  select.innerHTML = "<option disabled selected hidden>Escolha</option>";
  snap.forEach((doc) => {
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = doc.data().nome;
    select.appendChild(opt);
  });
}

async function carregarCultivos() {
  const ref = collection(db, "cultivos");
  const q = query(ref, where("usuario", "==", usuario.email));
  const snap = await getDocs(q);
  const lista = document.getElementById("lista-cultivos");
  lista.innerHTML = "";
  snap.forEach((doc) => {
    const div = document.createElement("div");
    div.innerHTML = `<label class="flex items-center gap-2"><input type="checkbox" value="${doc.id}" /> ${doc.data().titulo}</label>`;
    lista.appendChild(div);
  });
}

async function criarCultivo() {
  const blueprintId = document.getElementById("blueprint-select").value;
  const titulo = document.getElementById("titulo").value.trim();
  const dataInput = document.getElementById("data-inicial").value;

  if (!blueprintId || !titulo || !dataInput) return alert("Preencha todos os campos");

  const blueprintSnap = await doc(db, "blueprints", blueprintId).get();
  const blueprint = (await getDoc(doc(db, "blueprints", blueprintId))).data();

  const dataISO = new Date(
    dataInput.split("/").reverse().join("-")
  ).toISOString();

  const novo = {
    blueprint: blueprintId,
    titulo,
    data: dataISO,
    eventos: blueprint.eventos,
    usuario: usuario.email
  };

  await setDoc(doc(db, "cultivos", `${titulo}_${usuario.uid}`), novo);
  await carregarCultivos();
}

async function abrirCultivos() {
  const ids = [...document.querySelectorAll("#lista-cultivos input:checked")].map(el => el.value);
  if (ids.length === 0) return alert("Selecione pelo menos um cultivo.");
  localStorage.setItem("cultivosSelecionados", JSON.stringify(ids));
  window.location.href = "/cultivoapp/eventos.html";
}

async function deletarCultivos() {
  const ids = [...document.querySelectorAll("#lista-cultivos input:checked")].map(el => el.value);
  if (ids.length === 0) return alert("Selecione pelo menos um cultivo.");
  if (!confirm("Tem certeza que deseja excluir permanentemente?")) return;
  for (const id of ids) await deleteDoc(doc(db, "cultivos", id));
  await carregarCultivos();
}
