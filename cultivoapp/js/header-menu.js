export function ativarMenuHamburguer() {
  document.addEventListener("click", (e) => {
    const toggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("mobile-menu");

    if (toggle && menu && toggle.contains(e.target)) {
      menu.classList.toggle("hidden");
    }
  });
}
