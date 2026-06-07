const API_KEY = "dbbfb3977b2e75c59fe0d2fed7ec0947";

async function carregarFilmes() {
  const resposta = await fetch(
    `https://api.themoviedb.org/3/movie/popular?api_key=${dbbfb3977b2e75c59fe0d2fed7ec0947}&language=pt-BR`,
  );

  const dados = await resposta.json();

  console.log(dados.results);
}

carregarFilmes();
