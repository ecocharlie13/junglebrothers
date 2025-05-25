// js/blueprints.js

import { db, auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
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
  await carregarDropdown();
});

export async function carregarDropdown() {
  const ref = collection(db, "blueprints");
  const q = query(ref, where("usuario", "==", usuario.email));
  const snap = await getDocs(q);
  const select = document.getElementById("blueprint-select");
  select.innerHTML = "";
  snap.forEach((doc) => {
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = doc.data().nome;
    select.appendChild(opt);
  });
}

export async function loadBlueprint() {
  const id = document.getElementById("blueprint-select").value;
  const ref = doc(db, "blueprints", id);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("nome-blueprint").value = data.nome;

    const tbody = document.getElementById("tabela");
    tbody.innerHTML = "";
    data.eventos.forEach((ev) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input class='evento' value="${ev.evento}"/></td>
        <td><input class='dias' value="${ev.dias}"/></td>
        <td><input class='ajuste' value="${ev.ajuste}"/></td>
        <td><input class='notas' value="${ev.notas}"/></td>
      `;
      tbody.appendChild(tr);
    });
  }
}

export async function salvarBlueprint() {
  const nome = document.getElementById("nome-blueprint").value.trim();
  if (!nome) return alert("Dê um nome à sua blueprint.");

  const linhas = document.querySelectorAll("#tabela tr");
  const eventos = [];
  linhas.forEach((row) => {
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
  await carregarDropdown();
}
