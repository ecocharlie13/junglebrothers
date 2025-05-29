import { db } from "/cultivoapp/js/firebase-init.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const cultivosSelecionados = JSON.parse(localStorage.getItem("cultivosSelecionados")) || [];

(async () => {
  const tarefas = [];

  for (const cultivoId of cultivosSelecionados) {
    const snap = await getDoc(doc(db, "cultivos", cultivoId));
    if (!snap.exists()) continue;
    const cultivo = snap.data();

    const nomeCultivo = cultivo.titulo || "Cultivo";  // ✅ Nome legível do cultivo
    let inicio = new Date(cultivo.data);

    cultivo.eventos.forEach((evento, i) => {
      const dias = parseInt(evento.dias) || 0;
      const fim = new Date(inicio);
      fim.setDate(inicio.getDate() + dias);

      tarefas.push({
        id: `${nomeCultivo}-${i}`,              // ✅ ID com nome legível
        name: evento.evento,
        start: inicio.toISOString().split("T")[0],
        end: fim.toISOString().split("T")[0],
        progress: 100,
        custom_class: "gantt-bar"
      });

      inicio = new Date(fim);
    });
  }

  new Gantt("#gantt", tarefas);
})();
