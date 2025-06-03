export function ativarMenuHamburguer() {
  document.addEventListener("click", (e) => {
    const toggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("mobile-menu");

    if (toggle && menu && toggle.contains(e.target)) {
      menu.classList.toggle("hidden");
    }
  });

  // Garante que o botão "logout-mobile" funcione igual ao logout padrão
  document.addEventListener("DOMContentLoaded", () => {
    const logoutMobile = document.getElementById("logout-mobile");
    const logout = document.getElementById("logout");

    if (logoutMobile && logout) {
      logoutMobile.addEventListener("click", () => {
        logout.click();
      });
    }
  });
}
