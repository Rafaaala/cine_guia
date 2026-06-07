/*
  js/cards.js
  ----------------
  Responsabilidades:
  - Buscar e normalizar dados de filmes/séries (usando a API TMDB via fetch)
  - Construir a marcação (cards) para o catálogo
  - Renderizar o catálogo e aplicar filtros (por gênero e tipo)
  - Gerenciar o modal de detalhes (abrir/fechar, foco e acessibilidade)

  Observações de implementação:
  - As funções estão escritas de forma imperativa e usam o DOM diretamente.
  - Os dados de gênero são mapeados por ID para nome para facilitar exibição.
  - O arquivo procura preservar acessibilidade: `aria-*`, foco no modal
    e suporte a teclado para abrir cards.
*/

// Seleciona elementos do DOM necessários para renderizar o catálogo e o modal
const catalogo = document.getElementById("catalogo");
const modal = document.getElementById("movieModal");
const modalContent = document.getElementById("modalContent");

// Configurações da API e imagens
const API_KEY = "dbbfb3977b2e75c59fe0d2fed7ec0947";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const FALLBACK_IMAGE =
  "https://via.placeholder.com/500x750?text=Imagem+indispon%C3%ADvel";

// Variáveis globais para armazenar o conteúdo carregado e o estado atual
let loadedContents = [];
let displayedContents = [];
let currentFilter = "todos";
let currentTypeFilter = "all";
let genreMap = {};
let lastFocusedCard = null;

// Faz uma requisição à API do TMDB com caminho e parâmetros fornecidos
async function fetchFromTmdb(path, params = {}) {
  const query = new URLSearchParams({
    api_key: API_KEY,
    language: "pt-BR",
    ...params,
  });

  const response = await fetch(`https://api.themoviedb.org/3${path}?${query}`);
  if (!response.ok) {
    throw new Error(`Erro na API TMDB: ${response.status}`);
  }

  return response.json();
}

// Normaliza texto removendo acentos e convertendo para minúsculas
function normalizeLabel(value) {
  return String(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// Constrói um mapa de gêneros para converter IDs em nomes e também nomes normalizados em IDs
function buildGenreMap(movieGenres, tvGenres) {
  const map = {};

  movieGenres.forEach((genre) => {
    map[genre.id] = genre.name;
  });

  tvGenres.forEach((genre) => {
    map[genre.id] = genre.name;
  });

  return map;
}

// Normaliza um item de filme ou série para o formato usado pela interface
function normalizeContent(item, type) {
  const title = type === "movie" ? item.title : item.name;
  const date = type === "movie" ? item.release_date : item.first_air_date;
  const year = date ? new Date(date).getFullYear() : "2026";

  // Converte a lista de IDs de gênero em nomes legíveis
  const genres = Array.isArray(item.genre_ids)
    ? item.genre_ids.map((id) => genreMap[id]).filter(Boolean)
    : [];

  return {
    id: item.id,
    type,
    title,
    year,
    overview: item.overview || "Descrição não disponível.",
    poster: item.poster_path
      ? `${IMAGE_BASE_URL}${item.poster_path}`
      : FALLBACK_IMAGE,
    rating: item.vote_average || 0,
    genres,
    releaseDate: date || "",
  };
}

// Gera o HTML de um card a partir do objeto de conteúdo
function createCardMarkup(content) {
  const normalizedGenres = content.genres
    .map((genre) => normalizeLabel(genre))
    .join(",");

  const limitedGenres = content.genres.slice(0, 2);
  const genreLabel = limitedGenres.length
    ? limitedGenres.join(" • ")
    : "Sem gêneros definidos";

  return `
    <article class="card" tabindex="0" data-id="${content.id}" data-type="${content.type}" data-genres="${normalizedGenres}">
      <div class="card-media">
        <img src="${content.poster}" alt="Capa de ${content.title}" />
      </div>
      <div class="card-info">
        <h3>${content.title}</h3>
        <p class="card-genres">${genreLabel}</p>
        <div class="card-meta">
          <p class="rating">⭐ ${content.rating.toFixed(1)}</p>
          <span class="card-type">${content.type === "movie" ? "Filme" : "Série"}</span>
        </div>
      </div>
    </article>
  `;
}

// Intercala filmes e séries em uma única lista para exibição equilibrada
function interleaveContent(movies, series, limit = 20) {
  const result = [];
  const maxLength = Math.max(movies.length, series.length);

  for (let index = 0; index < maxLength && result.length < limit; index += 1) {
    if (index < movies.length) {
      result.push(normalizeContent(movies[index], "movie"));
    }
    if (index < series.length && result.length < limit) {
      result.push(normalizeContent(series[index], "tv"));
    }
  }

  return result.slice(0, limit);
}

// Calcula quantas colunas de cards cabem no layout atual do catálogo
function getColumnsCount() {
  if (!catalogo) return 1;

  const gridStyles = window.getComputedStyle(catalogo);
  const gap =
    parseFloat(gridStyles.columnGap) || parseFloat(gridStyles.gap) || 24;
  const containerWidth = catalogo.clientWidth;
  const minCardWidth = 240;

  return Math.max(1, Math.floor((containerWidth + gap) / (minCardWidth + gap)));
}

// Garante que o número de itens exibidos mantém grides completos sem deixar lacunas
function buildDisplayedContents(contents, minItems = 40) {
  const columns = getColumnsCount();
  const rowCount = Math.ceil(minItems / columns);
  const targetCount = Math.max(minItems, rowCount * columns);
  return contents.slice(0, targetCount);
}

// Renderiza o catálogo no DOM usando o HTML gerado pelos cards
function renderCatalog(contents) {
  if (!catalogo) return;

  if (!contents.length) {
    catalogo.innerHTML = `<p class="message">Nenhum conteúdo encontrado para esse filtro.</p>`;
    catalogo.removeAttribute("aria-busy");
    return;
  }

  catalogo.innerHTML = contents.map(createCardMarkup).join("");
  catalogo.removeAttribute("aria-busy");
}

// Exibe uma mensagem de erro quando a API falha ou não há catálogo disponível
function showError(message) {
  if (!catalogo) return;
  catalogo.innerHTML = `<p class="message">${message}</p>`;
  catalogo.removeAttribute("aria-busy");
}

// Filtra o catálogo de acordo com o gênero selecionado pelo usuário
function applyGenreFilter() {
  const selected = document.querySelector('input[name="genero"]:checked');
  if (!selected) return;

  currentFilter = selected.id;
  renderFilteredContents();
}

function applyTypeFilter(type) {
  currentTypeFilter = type;
  currentFilter = "todos";

  const allRadio = document.getElementById("todos");
  if (allRadio) {
    allRadio.checked = true;
  }

  updateHeaderActiveLink();
  renderFilteredContents();
}

function applySidebarGenreFilter(genre) {
  currentFilter = genre;
  currentTypeFilter = "all";

  const radio = document.getElementById(genre);
  if (radio) {
    radio.checked = true;
  }

  updateHeaderActiveLink();
  renderFilteredContents();
}

function getFilteredContents() {
  const normalizedFilter = normalizeLabel(currentFilter);

  const genreFiltered =
    currentFilter === "todos"
      ? loadedContents
      : loadedContents.filter((item) =>
          item.genres.some(
            (genre) => normalizeLabel(genre) === normalizedFilter,
          ),
        );

  return genreFiltered.filter((item) =>
    currentTypeFilter === "all" ? true : item.type === currentTypeFilter,
  );
}

function renderFilteredContents() {
  const filtered = getFilteredContents();

  if (currentFilter === "todos") {
    displayedContents = buildDisplayedContents(filtered);
  } else {
    displayedContents = filtered;
  }

  renderCatalog(displayedContents);
}

function updateHeaderActiveLink() {
  document.querySelectorAll(".header-nav a").forEach((link) => {
    const isActive = link.dataset.type === currentTypeFilter;
    if (link.dataset.type) {
      link.classList.toggle("active", isActive);
      link.setAttribute("aria-current", isActive ? "page" : "false");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

// Abre o modal e preenche os detalhes do conteúdo selecionado
function openModal(content) {
  if (!modal || !modalContent) return;

  lastFocusedCard = document.activeElement;

  modalContent.innerHTML = `
    <button type="button" class="modal-close" aria-label="Fechar detalhes">×</button>
    <div class="modal-card">
      <img src="${content.poster}" alt="Capa de ${content.title}" />
      <div class="modal-details">
        <h2 id="modalTitle">${content.title} (${content.year})</h2>
        <p class="modal-rating">⭐ ${content.rating.toFixed(1)} • ${
          content.type === "movie" ? "Filme" : "Série"
        }</p>
        <p class="modal-genres">${
          content.genres.length
            ? content.genres.join(" • ")
            : "Sem gêneros definidos"
        }</p>
        <p class="modal-overview">${content.overview}</p>
        <p class="modal-release">Lançamento: ${
          content.releaseDate || "Não informado"
        }</p>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  const closeButton = modal.querySelector(".modal-close");
  if (closeButton) {
    closeButton.focus();
  }
}

// Fecha o modal e limpa seu conteúdo
function closeModal() {
  if (!modal || !modalContent) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  modalContent.innerHTML = "";

  if (lastFocusedCard instanceof HTMLElement) {
    lastFocusedCard.focus();
  }
}

// Trata clique em um card do catálogo para abrir o modal correspondente
function handleCardClick(event) {
  const card = event.target.closest(".card");
  if (!card) return;

  const id = Number(card.dataset.id);
  const type = card.dataset.type;
  const content = displayedContents.find(
    (item) => item.id === id && item.type === type,
  );
  if (content) {
    openModal(content);
  }
}

function handleCardKeyboard(event) {
  const card = event.target.closest(".card");
  if (!card) return;

  const isEnter = event.key === "Enter";
  const isSpace = event.key === " ";

  if (isEnter || isSpace) {
    event.preventDefault();
    handleCardClick(event);
  }
}

// Re-renderiza o catálogo quando o tamanho da janela muda
function handleResize() {
  if (!loadedContents.length) return;

  renderFilteredContents();
}

// Configura eventos de clique, mudança de filtro e resize
function setupListeners() {
  if (catalogo) {
    catalogo.addEventListener("click", handleCardClick);
    catalogo.addEventListener("keydown", handleCardKeyboard);
  }

  document.querySelectorAll('input[name="genero"]').forEach((input) => {
    input.addEventListener("change", applyGenreFilter);
  });

  document
    .querySelectorAll(".sidebar-list button[data-genre]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        applySidebarGenreFilter(button.dataset.genre);
        closeMenu();
      });
    });

  document.querySelectorAll(".header-nav a[data-type]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const filterType = link.dataset.type;
      applyTypeFilter(filterType);
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  window.addEventListener("resize", handleResize);
  updateHeaderActiveLink();

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest(".modal-close")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
      }
    });
  }
}

// Carrega as informações de filmes e séries da API e inicializa o catálogo
async function carregarConteudos() {
  if (!catalogo) return;

  try {
    const [
      { genres: movieGenres },
      { genres: tvGenres },
      moviePage1,
      moviePage2,
      tvPage1,
      tvPage2,
    ] = await Promise.all([
      fetchFromTmdb("/genre/movie/list"),
      fetchFromTmdb("/genre/tv/list"),
      fetchFromTmdb("/movie/popular", { page: 1 }),
      fetchFromTmdb("/movie/popular", { page: 2 }),
      fetchFromTmdb("/tv/popular", { page: 1 }),
      fetchFromTmdb("/tv/popular", { page: 2 }),
    ]);

    genreMap = buildGenreMap(movieGenres, tvGenres);

    const movieItems = moviePage1.results.concat(moviePage2.results);
    const tvItems = tvPage1.results.concat(tvPage2.results);
    loadedContents = interleaveContent(movieItems, tvItems, 80);
    displayedContents = buildDisplayedContents(loadedContents);

    renderCatalog(displayedContents);
    setupListeners();
  } catch (error) {
    console.error(error);
    showError(
      "Não foi possível carregar os conteúdos. Tente novamente mais tarde.",
    );
  }
}

// Inicia o carregamento quando o conteúdo da página estiver pronto
window.addEventListener("DOMContentLoaded", carregarConteudos);
