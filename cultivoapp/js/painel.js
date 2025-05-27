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

  function getInicioDaSemana(date) {
    const dia = new Date(date);
    const diff = dia.getDay(); // domingo = 0
    dia.setDate(dia.getDate() - diff);
    return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
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

  function agruparPorCultivo(eventos) {
    const grupos = {};
    for (const evt of eventos) {
      if (!grupos[evt.cultivo]) grupos[evt.cultivo] = [];
      grupos[evt.cultivo].push(evt);
    }
    return grupos;
  }

  function preencherSticker(container, eventos) {
    container.innerHTML = "";
    const grupos = agruparPorCultivo(eventos);
    for (const cultivo in grupos) {
      const grupo = criarGrupoSticker(cultivo, grupos[cultivo]);
      container.appendChild(grupo);
    }
  }

  function gerarTarefasParaGantt(eventosMap) {
    const tarefas = [];

    Object.entries(eventosMap).forEach(([cultivoId, cultivoData]) => {
      const nomeCultivo = cultivoData.titulo || cultivoId;
      const eventos = cultivoData.eventos || [];

      eventos.forEach((evt, index) => {
        if (!evt.data_inicio || !evt.data_fim) return;

        tarefas.push({
          id: `${cultivoId}-${index}`,
          name: evt.nome,
          start: evt.data_inicio,
          end: evt.data_fim
        });
      });
    });

    return tarefas;
  }

  // ---------- INÍCIO DO FLUXO ----------
  const eventosMap = {};
  const eventosPassada = [];
  const eventosAtual = [];
  const eventosSeguinte = [];

  verificarLogin(async (user) => {
    emailSpan.textContent = user.email;
    picImg.src = user.photoURL;
    logoutBtn.addEventListener("click", sair);

    const hoje = new Date();
    dataHoje.textContent = hoje.toLocaleDateString("pt-BR");

    const inicioSemana = getInicioDaSemana(hoje);
    const fimSemana = new Date(inicioSemana); fimSemana.setDate(inicioSemana.getDate() + 6);
    const inicioSemanaPassada = new Date(inicioSemana); inicioSemanaPassada.setDate(inicioSemana.getDate() - 7);
    const fimSemanaPassada = new Date(inicioSemana); fimSemanaPassada.setDate(inicioSemana.getDate() - 1);
    const inicioSemanaSeguinte = new Date(inicioSemana); inicioSemanaSeguinte.setDate(inicioSemana.getDate() + 7);
    const fimSemanaSeguinte = new Date(inicioSemana); fimSemanaSeguinte.setDate(inicioSemana.getDate() + 13);

    const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];

    for (const id of selecionados) {
      const snap = await getDoc(doc(db, "cultivos", id));
      if (!snap.exists()) continue;

      const cultivo = snap.data();
      eventosMap[id] = cultivo;

      const nomeCultivo = cultivo.titulo || id;
      const eventos = cultivo.eventos || [];

      eventos.forEach(evt => {
        if (!evt.data_inicio || !evt.data_fim) return;

        const fim = new Date(evt.data_fim);
        const obj = {
          cultivo: nomeCultivo,
          nome: evt.nome,
          data_fim: fim
        };

        if (fim >= inicioSemanaPassada && fim <= fimSemanaPassada) eventosPassada.push(obj);
        else if (fim >= inicioSemana && fim <= fimSemana) eventosAtual.push(obj);
        else if (fim >= inicioSemanaSeguinte && fim <= fimSemanaSeguinte) eventosSeguinte.push(obj);
      });
    }

    preencherSticker(containerPassada, eventosPassada);
    preencherSticker(containerAtual, eventosAtual);
    preencherSticker(containerSeguinte, eventosSeguinte);

    const tarefas = gerarTarefasParaGantt(eventosMap);
    new Gantt("#gantt", tarefas);

    console.log("✅ Stickers e Gantt renderizados com sucesso.");
  });
}
