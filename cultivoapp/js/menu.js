// menu.js
import { sair } from "/cultivoapp/js/auth.js";

export function ativarMenu() {
  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("mobile-menu");
  const logoutMobile = document.getElementById("logout-mobile");
  const logout = document.getElementById("logout");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("hidden");
    });
  }

  if (logoutMobile && logout) {
    logoutMobile.addEventListener("click", () => {
      logout.click();
    });
  } else if (logoutMobile && !logout) {
    // fallback direto se botão desktop não existir
    logoutMobile.addEventListener("click", () => sair());
  }
}
