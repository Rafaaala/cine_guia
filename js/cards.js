const catalogo = document.getElementById("catalogo");
const modal = document.getElementById("movieModal");
const modalContent = document.getElementById("modalContent");

const API_KEY = "dbbfb3977b2e75c59fe0d2fed7ec0947";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const FALLBACK_IMAGE =
  "https://via.placeholder.com/500x750?text=Imagem+indispon%C3%ADvel";

let loadedContents = [];
let displayedContents = [];
let currentFilter = "todos";
let genreMap = {};
let genreNameToId = {};

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

function normalizeLabel(value) {
  return String(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function buildGenreMap(movieGenres, tvGenres) {
  const map = {};
  const nameToId = {};

  movieGenres.forEach((genre) => {
    map[genre.id] = genre.name;
    nameToId[normalizeLabel(genre.name)] = genre.id;
  });

  tvGenres.forEach((genre) => {
    map[genre.id] = genre.name;
    nameToId[normalizeLabel(genre.name)] = genre.id;
  });

  genreNameToId = nameToId;
  return map;
}

function normalizeContent(item, type) {
  const title = type === "movie" ? item.title : item.name;
  const date = type === "movie" ? item.release_date : item.first_air_date;
  const year = date ? new Date(date).getFullYear() : "2026";
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

function createCardMarkup(content) {
  const normalizedGenres = content.genres
    .map((genre) => normalizeLabel(genre))
    .join(",");

  return `
    <article class="card" tabindex="0" data-id="${content.id}" data-type="${content.type}" data-genres="${normalizedGenres}">
      <div class="card-media">
        <img src="${content.poster}" alt="Capa de ${content.title}" />
      </div>
      <div class="card-info">
        <h3>${content.title}</h3>
        <p class="rating">⭐ ${content.rating.toFixed(1)}</p>
      </div>
    </article>
  `;
}

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

function getColumnsCount() {
  if (!catalogo) return 1;

  const gridStyles = window.getComputedStyle(catalogo);
  const gap =
    parseFloat(gridStyles.columnGap) || parseFloat(gridStyles.gap) || 24;
  const containerWidth = catalogo.clientWidth;
  const minCardWidth = 240;

  return Math.max(1, Math.floor((containerWidth + gap) / (minCardWidth + gap)));
}

function buildDisplayedContents(contents, minItems = 40) {
  const columns = getColumnsCount();
  const rowCount = Math.ceil(minItems / columns);
  const targetCount = Math.max(minItems, rowCount * columns);
  return contents.slice(0, targetCount);
}

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

function showError(message) {
  if (!catalogo) return;
  catalogo.innerHTML = `<p class="message">${message}</p>`;
  catalogo.removeAttribute("aria-busy");
}

function applyGenreFilter() {
  const selected = document.querySelector('input[name="genero"]:checked');
  if (!selected) return;

  currentFilter = selected.id;
  if (currentFilter === "todos") {
    displayedContents = buildDisplayedContents(loadedContents);
    renderCatalog(displayedContents);
    return;
  }

  const normalizedFilter = normalizeLabel(currentFilter);
  displayedContents = loadedContents.filter((item) =>
    item.genres.some((genre) => normalizeLabel(genre) === normalizedFilter),
  );

  renderCatalog(displayedContents);
}

function openModal(content) {
  if (!modal || !modalContent) return;

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
}

function closeModal() {
  if (!modal || !modalContent) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  modalContent.innerHTML = "";
}

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

function handleResize() {
  if (!loadedContents.length) return;

  if (currentFilter === "todos") {
    displayedContents = buildDisplayedContents(loadedContents);
  }

  renderCatalog(displayedContents);
}

function setupListeners() {
  if (catalogo) {
    catalogo.addEventListener("click", handleCardClick);
  }

  document.querySelectorAll('input[name="genero"]').forEach((input) => {
    input.addEventListener("change", applyGenreFilter);
  });

  window.addEventListener("resize", handleResize);

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

window.addEventListener("DOMContentLoaded", carregarConteudos);
