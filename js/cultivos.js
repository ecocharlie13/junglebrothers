import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  collection, doc, setDoc, getDocs, getDoc, deleteDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let usuario = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "/login.html");
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
  const q = query(collection(db, "blueprints"), where("usuario", "==", usuario.email));
  const snap = await getDocs(q);
  const select = document.getElementById("blueprint-select");

  select.innerHTML = "<option disabled selected hidden>Escolha uma blueprint</option>";
  snap.forEach(doc => {
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = doc.data().nome;
    select.appendChild(opt);
  });
}

async function carregarCultivos() {
  const q = query(collection(db, "cultivos"), where("usuario", "==", usuario.email));
  const snap = await getDocs(q);
  const lista = document.getElementById("lista-cultivos");
  lista.innerHTML = "";

  snap.forEach(docSnap => {
    const cultivo = docSnap.data();
    const div = document.createElement("div");
    div.className = "flex items-center gap-2";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = docSnap.id;

    const label = document.createElement("label");
    label.textContent = cultivo.titulo;

    div.appendChild(checkbox);
    div.appendChild(label);
    lista.appendChild(div);
  });
}

async function criarCultivo() {
  const blueprintId = document.getElementById("blueprint-select").value;
  const titulo = document.getElementById("titulo").value.trim();
  const dataInput = document.getElementById("data-inicial").value;

  if (!blueprintId || !titulo || !dataInput) return alert("Preencha todos os campos.");

  const blueprintSnap = await getDoc(doc(db, "blueprints", blueprintId));
  if (!blueprintSnap.exists()) return alert("Blueprint não encontrada.");

  const blueprint = blueprintSnap.data();
  const dataISO = new Date(dataInput).toISOString();

  const cultivo = {
    blueprint: blueprintId,
    titulo,
    data: dataISO,
    eventos: blueprint.eventos,
    usuario: usuario.email
  };

  await setDoc(doc(db, "cultivos", `${titulo}_${usuario.uid}`), cultivo);
  await carregarCultivos();
}

async function abrirCultivos() {
  const selecionados = [...document.querySelectorAll("#lista-cultivos input:checked")].map(cb => cb.value);
  if (selecionados.length === 0) return alert("Selecione pelo menos um cultivo.");

  localStorage.setItem("cultivosSelecionados", JSON.stringify(selecionados));
  window.location.href = "/cultivoapp/eventos.html";
}

async function deletarCultivos() {
  const selecionados = [...document.querySelectorAll("#lista-cultivos input:checked")].map(cb => cb.value);
  if (selecionados.length === 0) return alert("Selecione pelo menos um cultivo.");
  if (!confirm("Tem certeza que deseja excluir permanentemente?")) return;

  for (const id of selecionados) {
    try {
      await deleteDoc(doc(db, "cultivos", id));
    } catch (err) {
      console.error("Erro ao deletar cultivo:", id, err);
    }
  }

  await carregarCultivos();
}
