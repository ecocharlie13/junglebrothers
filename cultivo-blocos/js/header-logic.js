// /cultivo-blocos/js/header-logic.js
import { verificarLogin, sair } from "/cultivo-blocos/js/auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menu-button");
  const menuDropdown = document.getElementById("menu-dropdown");

  if (menuBtn && menuDropdown) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!menuDropdown.contains(e.target)) {
        menuDropdown.classList.add("hidden");
      }
    });
  }

  verificarLogin(user => {
    const userPic = document.getElementById("user-pic");
    const userName = document.getElementById("user-name");
    const logoutBtn = document.getElementById("logout");

    if (userPic) userPic.src = user.photoURL;
    if (userName) userName.textContent = user.displayName || user.email;
    if (logoutBtn) logoutBtn.addEventListener("click", sair);
  });
});
