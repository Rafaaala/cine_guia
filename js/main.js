// Função para alternar entre o tema escuro e claro
const toggleTheme = () => {
  const html = document.documentElement;

  // Verifica o tema atual e troca para o oposto
  html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
};

// Função para abrir e fechar o menu lateral
const toggleMenu = () => {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  const menuButton = document.querySelector(".menu-toggle");

  // Adiciona ou remove a classe "open" e retorna se o menu está aberto
  const isOpen = sidebar.classList.toggle("open");

  // Mostra ou esconde o fundo escurecido
  backdrop.classList.toggle("visible", isOpen);

  // Atualiza atributos de acessibilidade
  sidebar.setAttribute("aria-hidden", String(!isOpen));
  backdrop.setAttribute("aria-hidden", String(!isOpen));
  menuButton.setAttribute("aria-expanded", String(isOpen));
};

// Função para fechar o menu lateral
const closeMenu = () => {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  const menuButton = document.querySelector(".menu-toggle");

  // Remove as classes responsáveis por exibir o menu
  sidebar.classList.remove("open");
  backdrop.classList.remove("visible");

  // Atualiza os atributos de acessibilidade
  sidebar.setAttribute("aria-hidden", "true");
  backdrop.setAttribute("aria-hidden", "true");
  menuButton.setAttribute("aria-expanded", "false");
};

// Escuta quando alguma tecla é pressionada
window.addEventListener("keydown", (event) => {

  // Se a tecla pressionada for ESC, fecha o menu
  if (event.key === "Escape") {
    closeMenu();
  }
});

// Seleciona todos os cards da página
document.querySelectorAll('.card').forEach(card => {

  // Procura um vídeo com a classe "preview" dentro do card
  const vid = card.querySelector('video.preview');

  // Se não houver vídeo, interrompe a execução para este card
  if (!vid) return;

  // Quando o mouse entra no card
  card.addEventListener('mouseenter', () => {

    // Reinicia o vídeo do começo
    vid.currentTime = 0;

    // Tenta reproduzir o vídeo
    vid.play().catch(() => {});
  });

  // Quando o card recebe foco pelo teclado
  card.addEventListener('focusin', () => {

    // Reinicia o vídeo do começo
    vid.currentTime = 0;

    // Tenta reproduzir o vídeo
    vid.play().catch(() => {});
  });

  // Quando o mouse sai do card
  card.addEventListener('mouseleave', () => {

    // Pausa o vídeo
    vid.pause();

    // Volta para o início
    vid.currentTime = 0;
  });

  // Quando o card perde o foco
  card.addEventListener('focusout', () => {

    // Pausa o vídeo
    vid.pause();

    // Volta para o início
    vid.currentTime = 0;
  });
});