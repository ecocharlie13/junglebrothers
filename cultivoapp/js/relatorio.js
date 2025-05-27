import { auth, db } from "/cultivoapp/js/firebase-init.js";
import { verificarLogin, sair } from "/cultivoapp/js/auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

function formatarData(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function getDomingoESabado(semanaOffset) {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // domingo = 0
  const domingo = new Date(hoje);
  domingo.setDate(hoje.getDate() - diaSemana + (semanaOffset * 7));
  const sabado = new Date(domingo);
  sabado.setDate(domingo.getDate() + 6);
  return { domingo, sabado };
}

function preencherSticker(idPrefixo, dataInicio, dataFim) {
  document.getElementById(`data-${idPrefixo}`).textContent = `(${formatarData(dataInicio)} - ${formatarData(dataFim)})`;
}

function adicionarEvento(listaId, cultivoNome, evento) {
  const ul = document.getElementById(listaId);
  const liCultivo = document.createElement("li");
  liCultivo.className = "font-semibold";
  liCultivo.textContent = `• ${cultivoNome}`;
  ul.appendChild(liCultivo);

  const liEvento = document.createElement("li");
  liEvento.className = "ml-4";
  liEvento.textContent = `- ${evento.nome} / ${formatarData(new Date(evento.data_fim))}`;
  ul.appendChild(liEvento);
}

verificarLogin(async (user) => {
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-pic").src = user.photoURL;
  document.getElementById("logout").addEventListener("click", sair);

  const selecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];
  const eventosAgrupados = {
    passada: [],
    atual: [],
    seguinte: []
  };

  const semanaPassada = getDomingoESabado(-1);
  const semanaAtual = getDomingoESabado(0);
  const semanaSeguinte = getDomingoESabado(1);

  preencherSticker("passada", semanaPassada.domingo, semanaPassada.sabado);
  preencherSticker("atual", semanaAtual.domingo, semanaAtual.sabado);
  preencherSticker("seguinte", semanaSeguinte.domingo, semanaSeguinte.sabado);

  for (const cultivoId of selecionados) {
    const snap = await getDoc(doc(db, "cultivos", cultivoId));
    if (!snap.exists()) continue;

    const cultivo = snap.data();
    const dataInicial = new Date(cultivo.data);
    let diaAcumulado = 0;

    for (const ev of cultivo.eventos || []) {
      const inicio = new Date(dataInicial);
      inicio.setDate(inicio.getDate() + diaAcumulado + (ev.ajuste || 0));

      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + (ev.dias || 0));

      const evento = {
        nome: ev.nome,
        data_fim: fim.toISOString()
      };

      if (fim >= semanaPassada.domingo && fim <= semanaPassada.sabado) {
        eventosAgrupados.passada.push([cultivo.titulo, evento]);
      } else if (fim >= semanaAtual.domingo && fim <= semanaAtual.sabado) {
        eventosAgrupados.atual.push([cultivo.titulo, evento]);
      } else if (fim >= semanaSeguinte.domingo && fim <= semanaSeguinte.sabado) {
        eventosAgrupados.seguinte.push([cultivo.titulo, evento]);
      }

      diaAcumulado += (ev.dias || 0) + (ev.ajuste || 0);
    }
  }

  eventosAgrupados.passada.forEach(([cultivo, evento]) =>
    adicionarEvento("lista-passada", cultivo, evento)
  );
  eventosAgrupados.atual.forEach(([cultivo, evento]) =>
    adicionarEvento("lista-atual", cultivo, evento)
  );
  eventosAgrupados.seguinte.forEach(([cultivo, evento]) =>
    adicionarEvento("lista-seguinte", cultivo, evento)
  );
});
