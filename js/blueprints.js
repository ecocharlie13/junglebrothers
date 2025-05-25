<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blueprints - CultivoApp</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen p-6">
  <div class="flex justify-between items-center mb-6">
    <span id="user-email" class="text-sm text-gray-600">Verificando login...</span>
    <img id="user-pic" class="w-8 h-8 rounded-full" />
  </div>

  <h1 class="text-2xl font-bold text-center mb-2">Blueprint do Cultivo</h1>
  <p class="text-center mb-4">Preencha abaixo sua blueprint e salve para começar.</p>

  <div class="mb-6 text-center">
    <label class="block font-semibold mb-1">Nome da Blueprint:</label>
    <input id="nome-blueprint" type="text" placeholder="Ex: BP Teste" class="px-3 py-1 border rounded" />
    <div class="flex justify-center mt-2 gap-2">
      <select id="blueprint-select" class="px-2 py-1 border rounded"></select>
      <button id="carregar" class="bg-blue-600 text-white px-4 py-1 rounded">Carregar</button>
    </div>
  </div>

  <table class="w-full max-w-4xl mx-auto bg-white border border-gray-300">
    <thead class="bg-orange-400 text-white">
      <tr><th>Evento</th><th>Dias</th><th>Ajuste</th><th>Notas</th><th></th></tr>
    </thead>
    <tbody id="tabela">
      <tr class="linha">
        <td><input class="evento" value="Clonar" /></td>
        <td><input class="dias" value="1" type="number" /></td>
        <td><input class="ajuste" value="0" type="number" /></td>
        <td><input class="notas" /></td>
        <td><button onclick="removerLinha(this)" class="text-red-500">🗑️</button></td>
      </tr>
      <tr class="linha">
        <td><input class="evento" value="Enraizar Clones" /></td>
        <td><input class="dias" value="14" type="number" /></td>
        <td><input class="ajuste" value="0" type="number" /></td>
        <td><input class="notas" /></td>
        <td><button onclick="removerLinha(this)" class="text-red-500">🗑️</button></td>
      </tr>
    </tbody>
  </table>

  <div class="text-center mt-4">
    <button id="adicionar" class="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700">
      + Adicionar etapa
    </button>
  </div>

  <div class="text-center mt-6">
    <button id="salvar" class="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Salvar</button>
    <p id="status" class="mt-3 text-green-700 font-semibold"></p>
  </div>

  <script type="module">
    import { carregarDropdown, loadBlueprint, salvarBlueprint } from "../js/blueprints.js";

    window.addEventListener("DOMContentLoaded", () => {
      document.getElementById("salvar").addEventListener("click", salvarBlueprint);
      document.getElementById("carregar").addEventListener("click", loadBlueprint);
      document.getElementById("adicionar").addEventListener("click", adicionarLinha);
      carregarDropdown();
    });

    // Adiciona nova linha à tabela
    window.adicionarLinha = () => {
      const tbody = document.getElementById("tabela");
      const tr = document.createElement("tr");
      tr.className = "linha";
      tr.innerHTML = `
        <td><input class='evento' /></td>
        <td><input class='dias' type="number" value="0" /></td>
        <td><input class='ajuste' type="number" value="0" /></td>
        <td><input class='notas' /></td>
        <td><button onclick="removerLinha(this)" class="text-red-500">🗑️</button></td>
      `;
      tbody.appendChild(tr);
    };

    // Remove a linha atual da tabela
    window.removerLinha = (btn) => {
      const tr = btn.closest("tr");
      if (tr) tr.remove();
    };
  </script>
</body>
</html>
