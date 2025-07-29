document.addEventListener("DOMContentLoaded", () => {

  const estaNaIndex =
    location.pathname.endsWith("index.html") ||
    location.pathname === "/" ||
    location.pathname === "/index.html";

  const searchInput = document.getElementById("search");
  const tituloGenero = document.getElementById("titulo-genero");
  const submenuGeneros = document.querySelector(".dropdown .submenu-generos");
  const menuDireito = document.querySelector(".menu-direito");


  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const currentUser = localStorage.getItem("currentUser");

  // 👤 Menu de usuário
  const loginBtn = document.querySelector(".login-btn");
  const registerBtn = document.querySelector(".register-btn");

  if (currentUser && users[currentUser]) {
    if (loginBtn) loginBtn.style.display = "none";
    if (registerBtn) registerBtn.style.display = "none";

    const userDisplay = document.createElement("a");
    userDisplay.href = "watchlist.html";
    userDisplay.textContent = `👤 ${currentUser}`;
    userDisplay.classList.add("login-btn");
    userDisplay.title = "Minha Watchlist";

    const logoutBtn = document.createElement("a");
    logoutBtn.href = "#";
    logoutBtn.textContent = "Sair";
    logoutBtn.classList.add("register-btn");
    logoutBtn.addEventListener("click", e => {
      e.preventDefault();
      localStorage.removeItem("currentUser");
      location.reload();
    });
    const searchResults = document.getElementById("search-results");
    if (searchResults) {
      searchResults.style.display = "none";
    }

    if (menuDireito) {
      menuDireito.append(userDisplay, logoutBtn);
    }
  }

  // 🎭 Dropdown de gêneros
  const generos = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mecha",
    "Music", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Suspense"];
  if (submenuGeneros && submenuGeneros.parentElement.classList.contains("dropdown")) {

    generos.forEach(gen => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = gen;
      link.addEventListener("click", e => {
        e.preventDefault();
        buscarPorGenero(gen);
      });
      li.append(link);
      submenuGeneros.append(li);
    });
  }

  // 🔎 Busca
  // 🔎 Busca com imagem e nota
  if (searchInput) {
    const searchResults = document.getElementById("search-results");

    searchInput.addEventListener("input", async () => {
      const q = searchInput.value.trim();
      if (q.length < 2) {
        searchResults.style.display = "none";
        return;
      }

      const query = `
      query ($search: String) {
        Page(perPage: 5) {
          media(search: $search, type: ANIME) {
            id
            title { romaji }
            coverImage { medium }
            averageScore
            description(asHtml: false)
          }
        }
      }
    `;
      const json = await consultarAniList(query, { search: q });

      searchResults.innerHTML = "";
      if (json?.data?.Page?.media?.length > 0) {
        json.data.Page.media.forEach(anime => {
          const a = document.createElement("a");
          a.className = "search-item";
          a.href = `anime.html?id=${anime.id}`;

          const sinopseLimpa = anime.description?.replace(/<[^>]+>/g, "") || "Sinopse não disponível";
          const sinopseCurta = sinopseLimpa.length > 140 ? sinopseLimpa.substring(0, 137) + "..." : sinopseLimpa;

          a.innerHTML = `
    <img src="${anime.coverImage.medium}" alt="${anime.title.romaji}" />
    <div>
      <strong>${anime.title.romaji}</strong>
      <span class="rating">Nota: ${anime.averageScore || "N/A"}</span>
      <p class="sinopse">${sinopseCurta}</p>
    </div>
  `;
          searchResults.appendChild(a);
        });

        const verMais = document.createElement("a");
        verMais.className = "search-item ver-mais";
        verMais.href = `resultado.html?busca=${encodeURIComponent(q)}`;
        verMais.textContent = `🔍 Ver todos os resultados para "${q}"`;
        searchResults.appendChild(verMais);

        searchResults.style.display = "block";
      } else {
        searchResults.style.display = "none";
      }
    });

    // ENTER para ir pra página de resultados
    searchInput.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        const q = searchInput.value.trim();
        if (q) {
          window.location.href = `resultado.html?busca=${encodeURIComponent(q)}`;
        }
      }
    });

    // Ocultar ao clicar fora
    document.addEventListener("click", e => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = "none";
      }
    });
  }


  if (estaNaIndex) {
    console.log("📦 Iniciando página inicial...");
    buscarMaisVistos();
    buscarTopAvaliados();
    buscarTemporadaAtual();
  }

  // 🌐 API AniList
  async function consultarAniList(query, variables = {}) {
    try {
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      const json = await res.json();
      return json;
    } catch (err) {
      console.error("🚨 Erro na consulta à AniList:", err);
      return null;
    }
  }

  // 🔍 Navegação por gênero e nome
  function buscarPorGenero(genero) {
    const url = `resultado.html?genero=${encodeURIComponent(genero)}`;
    window.location.href = url;
  }

  function buscarPorNome(nome) {
    const url = `resultado.html?busca=${encodeURIComponent(nome)}`;
    window.location.href = url;
  }

  // ⭐ Top Avaliados
  async function buscarTopAvaliados() {
    const query = `
      query {
        Page(perPage: 10) {
          media(sort: SCORE_DESC, type: ANIME) {
            id
            title { romaji english }
            coverImage { large medium }
            averageScore
          }
        }
      }
    `;
    const json = await consultarAniList(query);
    console.log("🟣 Top avaliados:", json?.data?.Page?.media);
    if (json?.data?.Page?.media) {
      preencherLista("top-avaliados-list", json.data.Page.media, true);
    }
  }

  // 🔥 Mais Vistos
  async function buscarMaisVistos() {
    const query = `
      query {
        Page(perPage: 10) {
          media(sort: POPULARITY_DESC, type: ANIME) {
            id
            title { romaji english }
            coverImage { large medium }
            averageScore
            description(asHtml: false)
          }
        }
      }
    `;
    const json = await consultarAniList(query);
    console.log("🟠 Mais vistos:", json?.data?.Page?.media);
    if (json?.data?.Page?.media) {
      preencherLista("mais-vistos-list", json.data.Page.media);
    }
  }

  // 🕓 Temporada Atual
  async function buscarTemporadaAtual() {
    const query = `
      query {
        Page(perPage: 10) {
          media(season: SUMMER, seasonYear: 2025, type: ANIME) {
            id
            title { romaji english }
            coverImage { large medium }
            averageScore
            episodes 
          }
        }
      }
    `;
    const json = await consultarAniList(query);
    console.log("🟢 Temporada atual:", json?.data?.Page?.media);
    if (json?.data?.Page?.media) {
      preencherLista("temporada-atual-list", json.data.Page.media);
    }
  }

  function preencherLista(id, animes, mostrarNota = false) {
    const container = document.getElementById(id);
    if (!container) {
      console.warn(`⚠️ Container não encontrado: ${id}`);
      return;
    }
    container.innerHTML = "";

    animes.forEach(anime => {
      const slide = document.createElement("li");
      slide.classList.add("splide__slide");

      const card = criarCard(anime, mostrarNota);
      slide.appendChild(card);

      container.appendChild(slide);
    });

    // 🚀 Aplica carrossel com base no ID do container
    const seletorSplide = `#${id.replace("-list", "")}`;

    if (seletorSplide) {
      new Splide(seletorSplide, {
        type: 'loop',
        perPage: 5,
        gap: '0.5rem',
        perMove: 1,
        autoplay: window.innerWidth > 768,
        autoplay: true,
        drag: false,
        trimSpace: false,
        breakpoints: {
          1200: { perPage: 4 },
          1024: { perPage: 3 },
          768: { perPage: 2.4, gap: '0.3rem', autoplay: false },
          480: { perPage: 2.1, gap: '0.2rem', autoplay: false },
          360: { perPage: 1.5, gap: '0.2rem', autoplay: false }
        }
      }).mount();
    }

  }

  function criarCard(anime, mostrarNota = false) {
    const card = document.createElement("div");
    card.classList.add("card-anime");

    const imageSrc = anime.coverImage.large || anime.coverImage.medium || "default.jpg";
    const animeTitle = anime.title.romaji || anime.title.english || "Sem título";
    const descricaoLimpa = anime.description ? anime.description.replace(/<[^>]+>/g, "") : "";
    const descricaoCurta = descricaoLimpa.length > 120 ? descricaoLimpa.substring(0, 117) + "..." : descricaoLimpa;

    const a = document.createElement("a");
    a.href = `anime.html?id=${anime.id}`;
    a.target = "_self";
    a.innerHTML = `
    <img src="${imageSrc}" alt="${animeTitle}">
    <h3>${animeTitle}</h3>
    ${mostrarNota && anime.averageScore ? `<p class="rating">Nota: ${anime.averageScore}/100</p>` : ""}
    ${descricaoCurta ? `<p class="descricao">${descricaoCurta}</p>` : ""}
  `;
    card.appendChild(a);

    if (currentUser && users[currentUser]) {
      if (!users[currentUser].watchlist) {
        users[currentUser].watchlist = [];
      }

      const btn = document.createElement("button");
      btn.classList.add("btn-watchlist-icon");
      btn.innerHTML = "+";
      btn.addEventListener("click", () => {
        const lista = users[currentUser].watchlist;
        if (!lista.includes(anime.id)) {
          lista.push(anime.id);
          localStorage.setItem("users", JSON.stringify(users));
          btn.textContent = "✅ Adicionado";
          btn.disabled = true;
        } else {
          alert("Este anime já está na sua Watchlist.");
        }
      });
      card.appendChild(btn);
    }

    return card;
  }
});