import { auth } from "/cultivoapp/js/firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

export function verificarLogin(callback) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "/login.html";
    } else {
      callback(user);
    }
  });
}

export async function sair() {
  await signOut(auth);
  window.location.href = "/login.html";
}
