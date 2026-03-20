import { verificarLogin, sair } from "/cultivoapp/js/auth.js";

export default function initHeader() {
  const menuBtn = document.getElementById("menu-button");
  const menuDropdown = document.getElementById("menu-dropdown");

  if (menuBtn && menuDropdown) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!menuDropdown.contains(e.target) && e.target !== menuBtn) {
        menuDropdown.classList.add("hidden");
      }
    });
  }

  verificarLogin(user => {
    document.getElementById("user-pic").src = user.photoURL;
    document.getElementById("user-name").textContent = user.displayName || user.email;
    document.getElementById("logout").addEventListener("click", sair);
  });
}
