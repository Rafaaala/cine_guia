/*
  js/api.js
  ----------------
  Arquivo de exemplo que demonstra uma chamada simples à API TMDB.
  Observação: a aplicação principal usa `js/cards.js` com requisições completas.

  Esta versão corrige o uso da constante `API_KEY`, adiciona tratamento de erro
  e documenta o fluxo.
*/

const API_KEY = "dbbfb3977b2e75c59fe0d2fed7ec0947";

// Função de exemplo que busca filmes populares e loga o resultado.
// Em um app real você integraria essa lógica com a renderização de UI.
async function carregarFilmes() {
  try {
    const url = new URL("https://api.themoviedb.org/3/movie/popular");
    url.search = new URLSearchParams({ api_key: API_KEY, language: "pt-BR" });

    const resposta = await fetch(url.toString());

    if (!resposta.ok) {
      throw new Error(`Erro na API TMDB: ${resposta.status}`);
    }

    const dados = await resposta.json();
    // Mostra os resultados no console — útil para depuração.
    console.log("Filmes populares (exemplo):", dados.results);
    return dados.results;
  } catch (err) {
    console.error("Falha ao carregar filmes:", err);
    return [];
  }
}

// Executa a função apenas como demonstração quando este arquivo é incluído.
carregarFilmes();
