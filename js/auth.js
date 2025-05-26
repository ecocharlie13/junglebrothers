// js/auth.js
import { auth } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

/**
 * Verifica se o usuário está autenticado.
 * Se sim, executa o callback. Senão, redireciona para o login.
 * @param {Function} callback - Função a ser executada após verificação
 */
export function verificarLogin(callback) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "/login.html";
    } else {
      callback(user);
    }
  });
}

/**
 * Função para logout global
 */
export async function sair() {
  await signOut(auth);
  window.location.href = "/login.html";
}
