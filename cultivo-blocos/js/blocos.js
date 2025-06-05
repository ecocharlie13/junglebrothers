// blocos.js funcional: salva todos os campos ao clicar no botão "Salvar"
import { db } from "./firebase-init.js";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let blocos = [];
let cultivoId = null;

const blocosContainer = document.getElementById("blocos-container");
const inputDataInicio = document.getElementById("data-inicio");
const inputNome = document.getElementById("nome-cultivo");
const btnSalvar = document.getElementById("btn-salvar");

btnSalvar.addEventListener("click", salvarCultivo);

function salvarCultivo() {
  const nome = inputNome.value;
  const dataInicio = inputDataInicio.value;
  if (!nome || !dataInicio) return alert("Preencha o nome e a data inicial.");

  const blocosDOM = document.querySelectorAll(".bloco");
  const novosBlocos = [];

  blocosDOM.forEach((el, i) => {
    const id = el.dataset.index;
    const get = (sel) => el.querySelector(`#${sel}-${id}`)?.value || "";

    const bloco = {
      nome: el.dataset.tipo,
      etapa: get("etapa"),
      fase: get("fase"),
      estrategia: get("estrategia"),
      ordem: i,
      inicio: el.dataset.inicio,
      fim: el.dataset.fim,
      receita: {
        ec_entrada: get("ec"),
        ph_entrada: get("ph"),
        nutrientes: get("nutrientes"),
        receita: get("receita"),
        ec_saida: get("ec_saida"),
        runoff: get("runoff"),
        dryback: get("dryback"),
        temperatura: get("temp"),
        ur: get("ur"),
        vpd: get("vpd"),
        ppfd: get("ppfd"),
      },
      notas: get("notas"),
      tarefas: [],
      cor: el.dataset.cor || "",
      expandido: false,
    };

    novosBlocos.push(bloco);
  });

  const dados = {
    nome,
    data_inicio: dataInicio,
    blocos: novosBlocos,
    atualizado_em: new Date().toISOString(),
  };

  if (cultivoId) {
    const ref = doc(db, "cultivos", cultivoId);
    updateDoc(ref, dados).then(() => alert("Cultivo atualizado com sucesso."));
  } else {
    addDoc(collection(db, "cultivos"), dados).then((ref) => {
      cultivoId = ref.id;
      alert("Cultivo salvo com sucesso.");
      history.replaceState({}, "", `?id=${cultivoId}`);
    });
  }
}
