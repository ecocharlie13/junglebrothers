<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard - CultivoApp</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen text-gray-800 p-6 font-sans">
  <div class="max-w-5xl mx-auto">
    <header class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">🏠 Área Restrita</h1>
      <div>
        <span id="status" class="text-sm"></span>
        <button id="logout" class="ml-4 px-3 py-1 bg-red-500 text-white rounded hidden">Sair</button>
        <a href="/index.html" id="link-voltar" class="ml-2 text-sm text-blue-600 hidden">← Voltar</a>
      </div>
    </header>

    <nav id="menu" class="space-x-4 mb-6 hidden">
      <a id="link-classroom" href="#" class="text-blue-600 hidden">📖 Google Classroom</a>
      <a id="pasta-compartilhada" href="#" class="text-blue-600 hidden">📁 Pasta Compartilhada</a>
    </nav>

    <section id="painel" class="hidden">
      <h2 class="text-xl font-semibold mb-4">Painel de Administração</h2>
      <form id="form-add" class="flex flex-wrap gap-2 mb-4">
        <input type="email" id="email-novo" placeholder="Email do novo usuário" class="border px-2 py-1 flex-1" />
        <select id="papel-novo" class="border px-2 py-1">
          <option value="cliente">Cliente</option>
          <option value="equipe">Equipe</option>
          <option value="administrador">Administrador</option>
        </select>
        <button type="submit" class="bg-green-600 text-white px-4 py-1 rounded">Adicionar</button>
      </form>

      <table class="w-full border text-sm" id="tabela-usuarios">
        <thead class="bg-gray-200">
          <tr>
            <th class="border px-2 py-1 text-left">Email</th>
            <th class="border px-2 py-1">Ativo</th>
            <th class="border px-2 py-1">Nível</th>
            <th class="border px-2 py-1">Ações</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </section>
  </div>

  <script type="module" src="/js/dashboard.js"></script>
</body>
</html>
