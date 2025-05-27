// /cultivoapp/js/relatorio.js
import { auth } from "/cultivoapp/js/firebase-init.js";
import { verificarLogin, sair } from "/cultivoapp/js/auth.js";

verificarLogin((user) => {
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;
  document.getElementById("logout").addEventListener("click", sair);

  atualizarDatasSemana();
});

function atualizarDatasSemana() {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0 = Domingo

  // Começo do domingo da semana atual
  const domingo = new Date(hoje);
  domingo.setDate(domingo.getDate() - diaSemana);

  const getIntervalo = (offsetSemanas) => {
    const inicio = new Date(domingo);
    inicio.setDate(inicio.getDate() + offsetSemanas * 7);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    return [inicio, fim];
  };

  const formatar = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  const [p_ini, p_fim] = getIntervalo(-1);
  const [a_ini, a_fim] = getIntervalo(0);
  const [s_ini, s_fim] = getIntervalo(1);

  document.getElementById("data-passada").textContent = `(${formatar(p_ini)} - ${formatar(p_fim)})`;
  document.getElementById("data-atual").textContent = `(${formatar(a_ini)} - ${formatar(a_fim)})`;
  document.getElementById("data-seguinte").textContent = `(${formatar(s_ini)} - ${formatar(s_fim)})`;
}
