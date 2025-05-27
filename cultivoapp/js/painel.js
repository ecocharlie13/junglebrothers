document.addEventListener("DOMContentLoaded", () => {
  iniciarPainel();
});

async function iniciarPainel() {
  const { auth, db } = await import("/cultivoapp/js/firebase-init.js");
  const { verificarLogin, sair } = await import("./auth.js");
  const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js");

  const emailSpan = document.getElementById("user-email");
  const picImg = document.getElementById("user-pic");
  const logoutBtn = document.getElementById("logout");
  const dataHoje = document.getElementById("data-hoje");
  const containerPassada = document.getElementById("semana-passada");
  const containerAtual = document.getElementById("semana-atual");
  const containerSeguinte = document.getElementById("semana-seguinte");

  const hoje = new Date();
  dataHoje.textContent = hoje.toLocaleDateString("pt-BR");

  const inicioSemana = getInicioDaSemana(hoje);
  const fimSemana = addDias(inicioSemana, 6);
  const inicioSemanaPassada = addDias(inicioSemana, -7);
  const fimSemanaPassada = addDias(inicioSemana, -1);
  const inicioSemanaSeguinte = addDias(inicioSemana, 7);
  const fimSemanaSeguinte = addDias(inicioSemana, 13);

  const eventosPassada = [];
  const eventosAtual = [];
  const eventosSeguinte = [];

  verificarLogin(async (user) => {
    emailSpan.textContent = user.email;
    picImg.src = user.photoURL;
    logoutBtn.addEventListener("click", sair);

    const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];

    for (const id of selecionados) {
      const snap = await getDoc(doc(db, "cultivos", id));
      if (!snap.exists()) continue;

      const cultivo = snap.data();
      const nomeCultivo = cultivo.titulo || id;
      const eventos = cultivo.eventos || [];

      eventos.forEach((evt) => {
        if (!evt.data_fim) return;

        const fim = new Date(evt.data_fim);
        if (isNaN(fim)) return;

        const eventoSticker = {
          cultivo: nomeCultivo,
          nome: evt.nome,
          data_fim: fim
        };

        if (fim >= inicioSemanaPassada && fim <= fimSemanaPassada) {
          eventosPassada.push(eventoSticker);
        } else if (fim >= inicioSemana && fim <= fimSemana) {
          eventosAtual.push(eventoSticker);
        } else if (fim >= inicioSemanaSeguinte && fim <= fimSemanaSeguinte) {
          eventosSeguinte.push(eventoSticker);
        }
      });
    }

    preencherSticker(containerPassada, eventosPassada);
    preencherSticker(containerAtual, eventosAtual);
    preencherSticker(containerSeguinte, eventosSeguinte);

    console.log("✅ Stickers renderizados com sucesso.");
  });

  function getInicioDaSemana(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function addDias(date, dias) {
    const novo = new Date(date);
    novo.setDate(novo.getDate() + dias);
    return novo;
  }

  function formatarDataBR(data) {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short"
    });
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
      linha.textContent = `• ${evt.nome} – ${formatarDataBR(evt.data_fim)}`;
      grupo.appendChild(linha);
    });

    return grupo;
  }

  function preencherSticker(container, eventos) {
    container.innerHTML = "";
    const grupos = {};

    for (const evt of eventos) {
      if (!grupos[evt.cultivo]) grupos[evt.cultivo] = [];
      grupos[evt.cultivo].push(evt);
    }

    for (const cultivo in grupos) {
      const grupo = criarGrupoSticker(cultivo, grupos[cultivo]);
      container.appendChild(grupo);
    }
  }
}
