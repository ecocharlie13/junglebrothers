// js/auth-guard.js

import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

export function verificarLogin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/login.html";
      return;
    }

    const docRef = doc(db, "autorizados", user.email);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data().ativo !== "sim") {
      await signOut(auth);
      window.location.href = "/login.html";
      return;
    }

    // Mostra email e foto (opcional)
    const emailEl = document.getElementById("user-email");
    const fotoEl = document.getElementById("user-pic");
    if (emailEl) emailEl.textContent = user.email;
    if (fotoEl) fotoEl.src = user.photoURL;

    // Executa a função de callback após validação
    callback(user);
  });
}
