// js/auth.js
import { auth } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Protege páginas da pasta /cultivoapp (ou outras privadas)
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/login.html";
  } else {
    console.log("✅ Usuário autenticado:", user.email);
  }
});
