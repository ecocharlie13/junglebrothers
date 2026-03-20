// header.js
function createHeader() {
    const header = document.createElement('header');
    header.className = 'bg-blue-600 text-white p-4 flex items-center justify-between shadow-md';

    const logoTitle = document.createElement('div');
    logoTitle.className = 'flex items-center';
    const logo = document.createElement('img');
    logo.src = './logo-jungle.png'; // Caminho relativo ao header.js na subpasta header/
    logo.alt = 'Logo Jungle Brothers';
    logo.className = 'h-12 mr-3';
    const title = document.createElement('h1');
    title.textContent = 'CultivoApp';
    title.className = 'text-2xl font-bold';
    logoTitle.appendChild(logo);
    logoTitle.appendChild(title);

    const menuToggle = document.createElement('button');
    menuToggle.id = 'menuToggle';
    menuToggle.className = 'md:hidden focus:outline-none';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-6 h-6');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', 'M4 6h16M4 12h16m-7 6h7');
    svg.appendChild(path);
    menuToggle.appendChild(svg);

    const menu = document.createElement('div');
    menu.id = 'menu';
    menu.className = 'hidden md:flex md:space-x-4';
    const menuItems = ['Início', 'Novo Cultivo', 'Abrir Cultivo'];
    menuItems.forEach(item => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = item;
        link.className = 'hover:text-gray-200';
        menu.appendChild(link);
    });
    const profileImg = document.createElement('img');
    profileImg.src = 'https://via.placeholder.com/30';
    profileImg.alt = 'Foto do Perfil';
    profileImg.className = 'h-6 rounded-full';
    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.id = 'logoutLink';
    logoutLink.textContent = 'Sair';
    logoutLink.className = 'hover:text-gray-200';

    menu.appendChild(profileImg);
    menu.appendChild(logoutLink);

    header.appendChild(logoTitle);
    header.appendChild(menuToggle);
    header.appendChild(menu);

    // Adicionar funcionalidade do menu hamburguer
    menuToggle.addEventListener('click', () => {
        menu.classList.toggle('hidden');
    });

    return header;
}

export { createHeader };
