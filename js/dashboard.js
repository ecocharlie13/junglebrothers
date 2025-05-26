import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const status = document.getElementById("status");
const logoutBtn = document.getElementById("logout");
const linkVoltar = document.getElementById("link-voltar");
const painel = document.getElementById("painel");
const menu = document.getElementById("menu");
const linkClassroom = document.getElementById("link-classroom");
const pastaCompartilhada = document.getElementById("pasta-compartilhada");
const tabela = document.getElementById("tabela-usuarios");
const formAdd = document.getElementById("form-add");
const emailNovo = document.getElementById("email-novo");
const papelNovo = document.getElementById("papel-novo");

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/index.html";
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "/login.html";

  const snap = await getDoc(doc(db, "autorizados", user.email));
  const dados = snap.data();

  if (!snap.exists() || dados.ativo !== "sim") {
    await signOut(auth);
    window.location.href = "/login.html";
    return;
  }

  status.textContent = `Logado como ${user.email}`;
  logoutBtn.classList.remove("hidden");
  linkVoltar.classList.remove("hidden");
  menu.classList.remove("hidden");

  const nivel = dados.nivel || "cliente";
  if (nivel === "administrador") {
    painel.classList.remove("hidden");
    linkClassroom.classList.remove("hidden");
    pastaCompartilhada.classList.remove("hidden");
    carregarUsuarios();
  } else if (nivel === "equipe") {
    linkClassroom.classList.remove("hidden");
    pastaCompartilhada.classList.remove("hidden");
  }
});

async function carregarUsuarios() {
  tabela.querySelector("tbody").innerHTML = "";
  const snap = await getDocs(collection(db, "autorizados"));

  snap.forEach(docu => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border px-2 py-1">${docu.id}</td>
      <td class="border px-2 py-1">${docu.data().ativo}</td>
      <td class="border px-2 py-1">${docu.data().nivel}</td>
      <td class="border px-2 py-1 space-x-2">
        <button class="text-sm text-red-600 underline" data-remove="${docu.id}">Remover</button>
        <button class="text-sm text-blue-600 underline" data-toggle="${docu.id}" data-status="${docu.data().ativo}" data-nivel="${docu.data().nivel}">
          ${docu.data().ativo === "sim" ? "Desativar" : "Ativar"}
        </button>
      </td>
    `;
    tabela.querySelector("tbody").appendChild(tr);
  });

  tabela.querySelectorAll("[data-remove]").forEach(btn =>
    btn.addEventListener("click", async () => {
      const email = btn.dataset.remove;
      if (confirm(`Remover ${email}?`)) {
        await deleteDoc(doc(db, "autorizados", email));
        carregarUsuarios();
      }
    })
  );

  tabela.querySelectorAll("[data-toggle]").forEach(btn =>
    btn.addEventListener("click", async () => {
      const { toggle, status, nivel } = btn.dataset;
      const novo = status === "sim" ? "nao" : "sim";
      await setDoc(doc(db, "autorizados", toggle), {
        ativo: novo,
        nivel
      }, { merge: true });
      carregarUsuarios();
    })
  );
}

formAdd.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailNovo.value.trim().toLowerCase();
  const nivel = papelNovo.value;

  if (!email || !nivel) return alert("Preencha todos os campos!");

  await setDoc(doc(db, "autorizados", email), {
    ativo: "sim",
    nivel
  }, { merge: true });

  emailNovo.value = "";
  carregarUsuarios();
});
