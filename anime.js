document.addEventListener("DOMContentLoaded", async () => {
  const id = parseInt(new URLSearchParams(window.location.search).get("id"));
  if (!id) return;

  const img = document.getElementById("anime-img");
  const titleEl = document.getElementById("anime-title");
  const sinopseEl = document.getElementById("anime-sinopse");
  const listaEps = document.getElementById("lista-episodios");

  // 🎬 AniList: Info básica
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english }
        description(asHtml: false)
        coverImage { large }
      }
    }
  `;
  const variables = { id };

  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  const anime = json.data.Media;

  img.src = anime.coverImage.large;
  titleEl.textContent = anime.title.romaji || anime.title.english;
  sinopseEl.textContent = anime.description?.replace(/<[^>]+>/g, "") || "Sem descrição.";

  // 🔥 Busca e exibe episódios de todas as temporadas via TMDB
  buscarTodasTemporadasTMDB(anime.title.romaji || anime.title.english);

  // 💬 Comentários locais
  const form = document.getElementById("comentario-form");
  const listaCom = document.getElementById("lista-comentarios");

  form.addEventListener("submit", e => {
    e.preventDefault();
    const nome = document.getElementById("nome").value.trim();
    const msg = document.getElementById("mensagem").value.trim();
    if (!nome || !msg) return;
    const bloco = document.createElement("div");
    bloco.innerHTML = `<strong>${nome}</strong>: ${msg}`;
    listaCom.appendChild(bloco);
    form.reset();
  });

  // 🔄 Função para buscar todas as temporadas e episódios via TMDB
  async function buscarTodasTemporadasTMDB(animeNome) {
    try {
      const tmdbKey = "7d779743f4eacd1de7ffc7882da6d63f";
      const searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${tmdbKey}&query=${encodeURIComponent(animeNome)}&language=pt-BR`;
      const res = await fetch(searchUrl);
      const json = await res.json();
      const serie = json.results?.[0];
      if (!serie) return;

      const tmdbId = serie.id;
      const detalhesUrl = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${tmdbKey}&language=pt-BR`;
      const resDetalhes = await fetch(detalhesUrl);
      const detalhes = await resDetalhes.json();

      listaEps.innerHTML = "";
for (const temporada of detalhes.seasons) {
  const seasonNum = temporada.season_number;
  const epUrl = `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNum}?api_key=${tmdbKey}&language=pt-BR`;
  const resEps = await fetch(epUrl);
  const jsonEps = await resEps.json();

  // 🔘 Título da temporada como botão "toggle"
  const tituloTemporada = document.createElement("h4");
  tituloTemporada.textContent = `📅 ${temporada.name}`;
  tituloTemporada.classList.add("temporada-toggle");
  tituloTemporada.style.cursor = "pointer";

  // 🔽 Container dos episódios (inicialmente escondido)
  const listaTemporada = document.createElement("ul");
  listaTemporada.style.display = "none";
  listaTemporada.style.marginBottom = "20px";

  // ▶️ Toggle de exibir/esconder
  tituloTemporada.addEventListener("click", () => {
    listaTemporada.style.display =
      listaTemporada.style.display === "none" ? "block" : "none";
  });

  listaEps.appendChild(tituloTemporada);
  listaEps.appendChild(listaTemporada);

  jsonEps.episodes.forEach(ep => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "10px";
    li.style.marginBottom = "10px";

    if (ep.still_path) {
      const thumb = document.createElement("img");
      thumb.src = `https://image.tmdb.org/t/p/w185${ep.still_path}`;
      thumb.alt = ep.name;
      thumb.style.borderRadius = "4px";
      thumb.style.width = "100px";
      thumb.style.objectFit = "cover";
      li.appendChild(thumb);
    }

    const texto = document.createElement("span");
    texto.textContent = `Ep ${ep.episode_number} — ${ep.name}`;
    texto.style.fontWeight = "bold";
    li.appendChild(texto);

    listaTemporada.appendChild(li);
  });
}

    } catch (err) {
      console.warn("Erro ao buscar todas as temporadas TMDB:", err);
    }
  }
});
