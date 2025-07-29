// 🔄 Aguarda o carregamento do DOM
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const genero = params.get("genero");
  const busca = params.get("busca");

  const titulo = document.getElementById("titulo-resultado");
  const lista = document.getElementById("resultado-list");

  if (genero) {
    titulo.textContent = `🎭 Gênero: ${genero}`;
    buscarPorGenero(genero);
  } else if (busca) {
    titulo.textContent = `🔍 Busca: ${busca}`;
    buscarPorNome(busca);
  }

  // 🔎 Busca por gênero
  async function buscarPorGenero(gen) {
    const query = `
      query ($genre: String) {
        Page(perPage: 20) {
          media(genre_in: [$genre], type: ANIME, sort: POPULARITY_DESC) {
            id
            title { romaji english }
            coverImage { large }
            averageScore
            genres
          }
        }
      }
    `;
    const json = await consultarAniList(query, { genre: gen });
    mostrarResultados(json?.data?.Page?.media);
  }

  // 🔎 Busca por nome
  async function buscarPorNome(nome) {
    const query = `
      query ($search: String) {
        Page(perPage: 20) {
          media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
            id
            title { romaji english }
            coverImage { large }
            averageScore
            genres
          }
        }
      }
    `;
    const json = await consultarAniList(query, { search: nome });
    mostrarResultados(json?.data?.Page?.media);
  }

  // 🎴 Exibe os resultados como cards
  function mostrarResultados(listaResultados) {
    lista.innerHTML = "";

    if (!listaResultados || listaResultados.length === 0) {
      lista.innerHTML = "<p>Nenhum resultado encontrado.</p>";
      return;
    }

    listaResultados.forEach(anime => {
      const tituloAnime = anime.title.romaji || anime.title.english || "Sem título";
      const generos = anime.genres.join(", ");
      const imagem = anime.coverImage?.large || "";
      const id = anime.id;

      const card = document.createElement("div");
      card.classList.add("anime-card");

      card.innerHTML = `
        <a href="anime.html?id=${id}" class="anime-link">
          <img src="${imagem}" alt="${tituloAnime}">
          <h3>${tituloAnime}</h3>
          <p>${generos}</p>
          <p>⭐ Nota: ${anime.averageScore ?? "N/A"}</p>
        </a>
        <button class="btn-watchlist-icon" data-id="..." data-title="...">
            +
        </button>
      `;

      lista.appendChild(card);
    });

    // 📌 Evento dos botões de Watchlist
    document.querySelectorAll(".btn-watchlist").forEach(botao => {
      botao.addEventListener("click", () => {
        const id = botao.dataset.id;
        const titulo = botao.dataset.title;
        alert(`📌 "${titulo}" foi adicionado à sua Watchlist!`);
      });
    });
  }
});

// 🌐 Consulta ao AniList API
async function consultarAniList(query, variables) {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  return await response.json();
}
