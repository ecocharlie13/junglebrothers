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

  if (!emailSpan || !picImg || !logoutBtn || !dataHoje || !containerPassada || !containerAtual || !containerSeguinte) {
    console.error("❌ Elementos do DOM não encontrados.");
    return;
  }

  const eventosPassada = [];
  const eventosAtual = [];
  const eventosSeguinte = [];
  const eventosParaGantt = [];

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
      if (snap.exists()) {
        const cultivo = snap.data();
        const nomeCultivo = cultivo.titulo || id;
        const eventos = cultivo.eventos || [];

        for (const evt of eventos) {
          const inicio = new Date(evt.data_inicio);
          const fim = new Date(evt.data_fim);
          const obj = {
            cultivo: nomeCultivo,
            nome: evt.nome,
            data_inicio: inicio,
            data_fim: fim
          };

          eventosParaGantt.push(obj);

          if (fim >= inicioSemanaPassada && fim <= fimSemanaPassada) eventosPassada.push(obj);
          else if (fim >= inicioSemana && fim <= fimSemana) eventosAtual.push(obj);
          else if (fim >= inicioSemanaSeguinte && fim <= fimSemanaSeguinte) eventosSeguinte.push(obj);
        }
      }
    }

    preencherSticker(containerPassada, eventosPassada);
    preencherSticker(containerAtual, eventosAtual);
    preencherSticker(containerSeguinte, eventosSeguinte);
    desenharGantt(eventosParaGantt);
  });

  function getInicioDaSemana(date) {
    const dia = new Date(date);
    const diff = dia.getDay();
    dia.setDate(dia.getDate() - diff);
    return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
  }

  function formatarDataBR(data) {
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
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
    const agrupado = {};
    for (const evt of eventos) {
      if (!agrupado[evt.cultivo]) agrupado[evt.cultivo] = [];
      agrupado[evt.cultivo].push(evt);
    }
    for (const cultivo in agrupado) {
      const grupo = criarGrupoSticker(cultivo, agrupado[cultivo]);
      container.appendChild(grupo);
    }
  }

  function desenharGantt(eventos) {
    const ctx = document.getElementById("gantt-canvas").getContext("2d");

    const cultivos = [...new Set(eventos.map(e => e.cultivo))];
    const cores = gerarCores(cultivos.length);

    const datasets = cultivos.map((cultivo, i) => {
      const eventosDoCultivo = eventos.filter(e => e.cultivo === cultivo);
      return {
        label: cultivo,
        data: eventosDoCultivo.map(e => ({
          x: [e.data_inicio, e.data_fim],
          y: e.nome
        })),
        borderColor: cores[i],
        backgroundColor: cores[i],
        borderWidth: 8,
        parsing: false
      };
    });

    new Chart(ctx, {
      type: "bar",
      data: { datasets },
      options: {
        indexAxis: 'y',
        responsive: true,
        scales: {
          x: { type: "time", time: { unit: "day" } },
          y: { stacked: false }
        },
        plugins: {
          legend: { position: "bottom" },
          tooltip: { callbacks: {
            label: ctx => `${ctx.dataset.label} – ${ctx.raw.y}`
          }}
        }
      }
    });
  }

  function gerarCores(n) {
    const base = ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#fb923c", "#10b981"];
    return Array.from({ length: n }, (_, i) => base[i % base.length]);
  }
}
