document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("watchlist-list");
  const currentUser = localStorage.getItem("currentUser");
  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (!currentUser || !users[currentUser]) {
    container.innerHTML = "<p>Você precisa estar logado para ver sua watchlist.</p>";
    return;
  }

  const watchlist = users[currentUser].watchlist || [];
  if (watchlist.length === 0) {
    container.innerHTML = "<p>Sua watchlist está vazia.</p>";
    return;
  }

  watchlist.forEach(async (id) => {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title { romaji english }
          coverImage { large }
        }
      }
    `;
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { id } }),
    });
    const json = await res.json();
    const anime = json.data.Media;

    const card = document.createElement("div");
    card.classList.add("anime-card");
    card.innerHTML = `
      <a href="anime.html?id=${anime.id}">
        <img src="${anime.coverImage.large}" alt="${anime.title.romaji || anime.title.english}">
        <h3>${anime.title.romaji || anime.title.english}</h3>
      </a>
      <button class="remove-btn">Remover</button>
    `;

    // 👇 Lógica de remoção
    const removeBtn = card.querySelector(".remove-btn");
    removeBtn.addEventListener("click", () => {
      // Remove visualmente
      card.remove();

      // Remove do localStorage
      const updatedWatchlist = users[currentUser].watchlist.filter(itemId => itemId !== anime.id);
      users[currentUser].watchlist = updatedWatchlist;
      localStorage.setItem("users", JSON.stringify(users));
    });

    container.appendChild(card);
  });
});
