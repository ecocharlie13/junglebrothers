import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { verificarLogin, sair } from "./auth.js";

let usuario = null;

verificarLogin(async (user) => {
  usuario = user;
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;

  await carregarBlueprints();
  await carregarCultivos();

  document.getElementById("criar-cultivo").addEventListener("click", criarCultivo);
  document.getElementById("abrir-cultivo").addEventListener("click", abrirCultivos);
  document.getElementById("deletar-cultivo").addEventListener("click", deletarCultivos);
  document.getElementById("logout").addEventListener("click", sair);
});

async function carregarBlueprints() {
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

async function carregarCultivos() {
  const ref = collection(db, "cultivos");
  const q = query(ref, where("usuario", "==", usuario.email));
  const snap = await getDocs(q);
  const lista = document.getElementById("lista-cultivos");
  lista.innerHTML = "";
  snap.forEach((docSnap) => {
    const cultivo = docSnap.data();
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = docSnap.id;

    const label = document.createElement("label");
    label.className = "flex items-center gap-2";
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(cultivo.titulo));

    lista.appendChild(label);
  });
}

async function criarCultivo() {
  const blueprintId = document.getElementById("blueprint-select").value;
  const titulo = document.getElementById("titulo").value.trim();
  const dataInput = document.getElementById("data-inicial").value;

  if (!blueprintId || !titulo || !dataInput) return alert("Preencha todos os campos");

  const blueprintSnap = await getDoc(doc(db, "blueprints", blueprintId));
  if (!blueprintSnap.exists()) return alert("Blueprint não encontrada.");

  const blueprint = blueprintSnap.data();
  const dataISO = new Date(dataInput).toISOString();

  const novoCultivo = {
    blueprint: blueprintId,
    titulo,
    data: dataISO,
    eventos: blueprint.eventos,
    usuario: usuario.email
  };

  await setDoc(doc(db, "cultivos", `${titulo}_${usuario.uid}`), novoCultivo);
  await carregarCultivos();
}

async function abrirCultivos() {
  const selecionados = [...document.querySelectorAll("#lista-cultivos input:checked")].map(el => el.value);
  if (selecionados.length === 0) return alert("Selecione pelo menos um cultivo.");
  localStorage.setItem("cultivosSelecionados", JSON.stringify(selecionados));
  window.location.href = "/cultivoapp/eventos.html";
}

async function deletarCultivos() {
  const selecionados = [...document.querySelectorAll("#lista-cultivos input:checked")].map(el => el.value);
  if (selecionados.length === 0) return alert("Selecione pelo menos um cultivo.");
  if (!confirm("Tem certeza que deseja excluir permanentemente?")) return;

  for (const id of selecionados) {
    await deleteDoc(doc(db, "cultivos", id));
  }

  await carregarCultivos();
}
