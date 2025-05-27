document.addEventListener("DOMContentLoaded", () => {
  iniciarPainel();
});

async function iniciarPainel() {
  import("/cultivoapp/js/firebase-init.js").then(async ({ auth, db }) => {
    const { verificarLogin, sair } = await import("./auth.js");
    const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js");

    // Referências aos elementos
    const emailSpan = document.getElementById("user-email");
    const picImg = document.getElementById("user-pic");
    const logoutBtn = document.getElementById("logout");
    const dataHoje = document.getElementById("data-hoje");
    const containerPassada = document.getElementById("semana-passada");
    const containerAtual = document.getElementById("semana-atual");
    const containerSeguinte = document.getElementById("semana-seguinte");

    if (!emailSpan || !picImg || !logoutBtn || !dataHoje || !containerPassada || !containerAtual || !containerSeguinte) {
      console.error("❌ Elementos do DOM não encontrados.");
      return;
    }

    // Utilitários
    function getInicioDaSemana(date) {
      const dia = new Date(date);
      const diff = dia.getDay(); // domingo = 0
      dia.setDate(dia.getDate() - diff);
      return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
    }

    function formatarData(date) {
      return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function criarGrupoSticker(cultivo, eventos) {
      const grupo = document.createElement("div");
      const titulo = document.createElement("strong");
      titulo.classList.add("block", "text-sm", "mb-1", "text-gray-800");
      titulo.textContent = cultivo;
      grupo.appendChild(titulo);

      eventos.forEach(evt => {
        const linha = document.createElement("div");
        linha.classList.add("text-sm", "text-gray-700", "ml-2");
        linha.textContent = `• ${evt.nome} – ${formatarData(evt.data_fim)}`;
        grupo.appendChild(linha);
      });

      return grupo;
    }

    function agruparPorCultivo(eventos) {
      const grupos = {};
      for (const evt of eventos) {
        if (!grupos[evt.cultivo]) grupos[evt.cultivo] = [];
        grupos[evt.cultivo].push(evt);
      }
      return grupos;
    }

    function preencherSticker(container, eventos) {
      container.innerHTML = ""; // limpa
      const grupos = agruparPorCultivo(eventos);
      for (const cultivo in grupos) {
        const grupo = criarGrupoSticker(cultivo, grupos[cultivo]);
        container.appendChild(grupo);
      }
    }

    // Autenticação e carregamento dos dados
    verificarLogin(async (user) => {
      if (emailSpan) emailSpan.textContent = user.email;
      if (picImg) picImg.src = user.photoURL;
      if (logoutBtn) logoutBtn.addEventListener("click", sair);

      const hoje = new Date();
      dataHoje.textContent = formatarData(hoje);

      const inicioSemana = getInicioDaSemana(hoje);
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);

      const inicioSemanaPassada = new Date(inicioSemana);
      inicioSemanaPassada.setDate(inicioSemana.getDate() - 7);

      const fimSemanaPassada = new Date(inicioSemana);
      fimSemanaPassada.setDate(inicioSemana.getDate() - 1);

      const inicioSemanaSeguinte = new Date(inicioSemana);
      inicioSemanaSeguinte.setDate(inicioSemana.getDate() + 7);

      const fimSemanaSeguinte = new Date(inicioSemana);
      fimSemanaSeguinte.setDate(inicioSemana.getDate() + 13);

      const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];

      const eventosPassada = [];
      const eventosAtual = [];
      const eventosSeguinte = [];

      for (const id of selecionados) {
        const docRef = doc(db, "cultivos", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const cultivo = snap.data();
          const eventos = cultivo.eventos || [];
          for (const evt of eventos) {
            const dataFim = new Date(evt.data_fim);
            const obj = {
              cultivo: cultivo.nome || id,
              nome: evt.nome,
              data_fim: dataFim
            };

            if (dataFim >= inicioSemanaPassada && dataFim <= fimSemanaPassada) {
              eventosPassada.push(obj);
            } else if (dataFim >= inicioSemana && dataFim <= fimSemana) {
              eventosAtual.push(obj);
            } else if (dataFim >= inicioSemanaSeguinte && dataFim <= fimSemanaSeguinte) {
              eventosSeguinte.push(obj);
            }
          }
        }
      }

      preencherSticker(containerPassada, eventosPassada);
      preencherSticker(containerAtual, eventosAtual);
      preencherSticker(containerSeguinte, eventosSeguinte);

      console.log("✅ Stickers atualizados com agrupamento por cultivo.");
    });
  });
}
