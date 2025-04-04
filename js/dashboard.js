import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCo7MOVfaalrDg0o0GpYJ4-YNL4OCrjfXE",
  authDomain: "jungle-brothers-93e80.firebaseapp.com",
  projectId: "jungle-brothers-93e80",
  storageBucket: "jungle-brothers-93e80.appspot.com",
  messagingSenderId: "221354970870",
  appId: "1:221354970870:web:a7f68c75480dc094bb6ad7"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos DOM
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

// Logout
logoutBtn.onclick = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};

// Login e permissões
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const docRef = doc(db, "autorizados", user.email);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists() || docSnap.data().ativo !== "sim") {
    await signOut(auth);
    window.location.href = "login.html";
    return;
  }

  const nivel = docSnap.data().nivel || "cliente";

  status.textContent = `Logado como ${user.email}`;
  logoutBtn.style.display = "inline-block";
  linkVoltar.style.display = "inline-block";
  menu.style.display = "block";

  if (nivel === "administrador") {
    painel.style.display = "block";
    linkClassroom.style.display = "block";
    pastaCompartilhada.style.display = "block";
    carregarUsuarios();
  } else if (nivel === "equipe") {
    linkClassroom.style.display = "block";
    pastaCompartilhada.style.display = "block";
  }
});

// Carregar lista de usuários
async function carregarUsuarios() {
  tabela.innerHTML = "";
  const snapshot = await getDocs(collection(db, "autorizados"));

  snapshot.forEach((docu) => {
    const email = docu.id;
    const dados = docu.data();
    const ativo = dados.ativo || "nao";
    const nivel = dados.nivel || "cliente";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${email}</td>
      <td>${ativo}</td>
      <td>${nivel}</td>
      <td>
        <button onclick="removerUsuario('${email}')">Remover</button>
        <button onclick="toggleAtivo('${email}', '${ativo}', '${nivel}')">
          ${ativo === "sim" ? "Desativar" : "Ativar"}
        </button>
      </td>
    `;
    tabela.appendChild(tr);
  });
}

// Adicionar novo usuário
formAdd.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailNovo.value.trim().toLowerCase();
  const nivel = papelNovo.value;

  if (!email || !nivel) {
    alert("Preencha todos os campos!");
    return;
  }

  try {
    await setDoc(doc(db, "autorizados", email), {
      ativo: "sim",
      nivel: nivel
    }, { merge: true });

    emailNovo.value = "";
    carregarUsuarios();
  } catch (err) {
    console.error("Erro ao adicionar usuário:", err.message);
    alert("Erro ao adicionar usuário.");
  }
});

// Remover usuário
window.removerUsuario = async (email) => {
  if (confirm(`Remover ${email}?`)) {
    await deleteDoc(doc(db, "autorizados", email));
    carregarUsuarios();
  }
};

// Ativar/desativar usuário
window.toggleAtivo = async (email, statusAtual, nivelAtual) => {
  const novoStatus = statusAtual === "sim" ? "nao" : "sim";
  await setDoc(doc(db, "autorizados", email), {
    ativo: novoStatus,
    nivel: nivelAtual
  }, { merge: true });
  carregarUsuarios();
};
