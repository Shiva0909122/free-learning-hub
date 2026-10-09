let activeFilter = "All";
let searchTerm = "";
let currentVideoId = null;

const readSet = key => new Set(JSON.parse(localStorage.getItem(key) || "[]"));
let favorites = readSet("learningHubFavorites");
let watched = readSet("learningHubWatched");
let history = JSON.parse(localStorage.getItem("learningHubHistory") || "[]");

const grid = document.getElementById("videoGrid");
const emptyState = document.getElementById("emptyState");
const modal = new bootstrap.Modal(document.getElementById("playerModal"));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[ch]));
}
function persist() {
  localStorage.setItem("learningHubFavorites", JSON.stringify([...favorites]));
  localStorage.setItem("learningHubWatched", JSON.stringify([...watched]));
  localStorage.setItem("learningHubHistory", JSON.stringify(history));
}
function categoryClass(category) {
  if (category === "Live Recordings") return "text-bg-primary";
  if (category === "Beauty Session") return "text-bg-warning";
  return "text-bg-success";
}
function videoCard(video, compact = false) {
  const isFav = favorites.has(video.id);
  const isWatched = watched.has(video.id);
  return `
    <div class="${compact ? "col-12 col-sm-6 col-lg-4" : "col-12 col-sm-6 col-lg-4 col-xl-3"}">
      <article class="card video-card">
        <button class="thumb-wrap border-0 p-0 w-100" type="button" data-play="${video.id}" aria-label="Play ${escapeHtml(video.title)}">
          <img class="thumb" src="https://img.youtube.com/vi/${video.id}/hqdefault.jpg"
            alt="Thumbnail for ${escapeHtml(video.title)}" loading="lazy"
            onerror="this.onerror=null;this.src='https://img.youtube.com/vi/${video.id}/mqdefault.jpg'">
          <span class="play-badge">▶</span>
        </button>
        <div class="card-body d-flex flex-column">
          <div class="d-flex align-items-center justify-content-between mb-2 gap-2">
            <span class="badge rounded-pill category-pill ${categoryClass(video.category)}">${escapeHtml(video.category)}</span>
            <div class="d-flex align-items-center gap-2">
              ${isWatched ? '<span class="text-success small" title="Watched">✓ Watched</span>' : ""}
              <button class="favorite-btn ${isFav ? "saved" : ""}" data-favorite="${video.id}" aria-label="Toggle favorite" title="Save favorite">${isFav ? "♥" : "♡"}</button>
            </div>
          </div>
          <h3 class="h6 video-title">${escapeHtml(video.title)}</h3>
          <div class="mt-auto d-flex gap-2">
            <button class="btn btn-danger btn-sm flex-grow-1" data-play="${video.id}">▶ Watch now</button>
            <a class="btn btn-outline-secondary btn-sm" href="${video.url}" target="_blank" rel="noopener" aria-label="Open on YouTube">↗</a>
          </div>
        </div>
      </article>
    </div>`;
}
function getFilteredVideos() {
  return videos.filter(video => {
    const filterMatch =
      activeFilter === "All" ||
      (activeFilter === "Favorites" && favorites.has(video.id)) ||
      (activeFilter === "Watched" && watched.has(video.id)) ||
      video.category === activeFilter;
    const searchMatch = `${video.title} ${video.category} ${video.id}`.toLowerCase().includes(searchTerm);
    return filterMatch && searchMatch;
  });
}
function render() {
  const filtered = getFilteredVideos();
  grid.innerHTML = filtered.map(video => videoCard(video)).join("");
  emptyState.classList.toggle("d-none", filtered.length > 0);
  document.getElementById("shownCount").textContent = filtered.length;
  document.getElementById("totalCount").textContent = videos.length;
  document.getElementById("watchedCount").textContent = watched.size;
  document.getElementById("favoriteCount").textContent = favorites.size;

  const recentVideos = history.map(id => videos.find(v => v.id === id)).filter(Boolean).slice(0, 3);
  const continueSection = document.getElementById("continueSection");
  continueSection.classList.toggle("d-none", recentVideos.length === 0);
  document.getElementById("continueGrid").innerHTML = recentVideos.map(v => videoCard(v, true)).join("");
}
function playVideo(id) {
  const video = videos.find(item => item.id === id);
  if (!video) return;
  currentVideoId = id;
  history = [id, ...history.filter(existingId => existingId !== id)].slice(0, 12);
  persist();
  document.getElementById("playerTitle").textContent = video.title;
  document.getElementById("playerCategory").textContent = video.category;
  document.getElementById("playerFrame").src =
    "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(video.id) + "?autoplay=1&rel=0";
  document.getElementById("openYoutube").href = video.url;
  document.getElementById("markWatchedBtn").textContent = watched.has(id) ? "✓ Watched" : "✓ Mark as watched";
  render();
  modal.show();
}
function handleGridClick(event) {
  const playButton = event.target.closest("[data-play]");
  if (playButton) { playVideo(playButton.dataset.play); return; }
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    const id = favoriteButton.dataset.favorite;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    persist(); render();
  }
}
document.getElementById("searchInput").addEventListener("input", event => {
  searchTerm = event.target.value.trim().toLowerCase();
  render();
});
document.getElementById("filters").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.toggle("active", btn === button));
  render();
});
grid.addEventListener("click", handleGridClick);
document.getElementById("continueGrid").addEventListener("click", handleGridClick);
document.getElementById("markWatchedBtn").addEventListener("click", () => {
  if (!currentVideoId) return;
  watched.add(currentVideoId);
  persist(); render();
  document.getElementById("markWatchedBtn").textContent = "✓ Watched";
});
document.getElementById("clearHistory").addEventListener("click", () => {
  history = [];
  persist(); render();
});
document.getElementById("playerModal").addEventListener("hidden.bs.modal", () => {
  document.getElementById("playerFrame").src = "";
  currentVideoId = null;
});
render();
