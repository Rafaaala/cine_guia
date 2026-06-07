/*
  js/main.js
  ----------------
  Responsabilidades:
  - Alternar tema (dark / light) através de `data-theme` no elemento <html>
  - Abrir/fechar sidebar de navegação (menu mobile)
  - Gerenciar backdrop e atributos ARIA relacionados ao menu
  - Capturar tecla `Escape` para fechar menus quando necessário
*/

// Alterna entre os temas 'dark' e 'light' aplicando `data-theme` no <html>
const toggleTheme = () => {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
};

// Abre ou fecha o menu lateral (sidebar). Atualiza atributos ARIA e o backdrop.
const toggleMenu = () => {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  const menuButton = document.querySelector(".menu-toggle");

  const isOpen = sidebar.classList.toggle("open");
  backdrop.classList.toggle("visible", isOpen);

  // Atributos ARIA para indicar estado a leitores de tela
  sidebar.setAttribute("aria-hidden", String(!isOpen));
  backdrop.setAttribute("aria-hidden", String(!isOpen));
  menuButton.setAttribute("aria-expanded", String(isOpen));
};

// Fecha o menu lateral e restaura atributos ARIA
const closeMenu = () => {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  const menuButton = document.querySelector(".menu-toggle");

  sidebar.classList.remove("open");
  backdrop.classList.remove("visible");

  sidebar.setAttribute("aria-hidden", "true");
  backdrop.setAttribute("aria-hidden", "true");
  menuButton.setAttribute("aria-expanded", "false");
};

// Permite fechar o menu com a tecla Escape quando o usuário pressiona
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});
