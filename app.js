(() => {
  "use strict";

  const USER = "janghotan";
  const REPOS_API = `https://api.github.com/users/${USER}/repos?type=owner&sort=updated&per_page=100`;
  const PROFILE_API = `https://api.github.com/users/${USER}`;
  const HIDE = new Set([`${USER}.github.io`, USER]);
  const $ = (selector) => document.querySelector(selector);
  const grid = $("#project-grid");
  const status = $("#catalog-status");
  const search = $("#search");
  const filters = $("#filters");
  let repositories = [];
  let selected = "all";

  const isPublicOwnedRepo = (repo) => repo && repo.owner?.login?.toLowerCase() === USER && repo.private === false && repo.visibility !== "private" && !HIDE.has(repo.name);
  const shortDate = (date) => {
    if (!date) return "Date unavailable";
    return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(date));
  };
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const colors = ["peach", "blue", "mint", "lavender", "pink", "yellow"];
  const icons = {
    Rust: "<path d='m12 3 2 1.2 2.4-.2.8 2.2 2 1.3-.7 2.3.7 2.3-2 1.3-.8 2.2-2.4-.2L12 18l-2-1.2-2.4.2-.8-2.2-2-1.3.7-2.3-.7-2.3 2-1.3.8-2.2 2.4.2L12 3Z'/><circle cx='12' cy='11.5' r='3'/><path d='M10.7 12.5v-2h1.5a.8.8 0 0 1 0 1.6h-1.5m1.5 0 1.1 1.2'/>",
    Python: "<path d='M12 3c-2 0-2.6.8-2.6 2v2h5.2v1H7.5C5.7 8 5 9.1 5 11v2c0 1.9 1 2.8 2.8 2.8h1.7v-2.2c0-1.4 1-2.5 2.4-2.5h4.4c1.5 0 2.7-1.2 2.7-2.7V5c0-1.4-1.2-2-2.7-2H12Z'/><circle cx='13.6' cy='5.4' r='.55' fill='currentColor' stroke='none'/><path d='M12 21c2 0 2.6-.8 2.6-2v-2H9.4v-1h7.1c1.8 0 2.5-1.1 2.5-3v-2c0-1.9-1-2.8-2.8-2.8h-1.7v2.2c0 1.4-1 2.5-2.4 2.5H7.7c-1.5 0-2.7 1.2-2.7 2.7V19c0 1.4 1.2 2 2.7 2H12Z'/><circle cx='10.4' cy='18.6' r='.55' fill='currentColor' stroke='none'/>",
    TypeScript: "<path d='M4 5h16v14H4z'/><path d='M7 9h6m-3 0v7m6-5c0-1 3-1 3 0s-3 1-3 2 3 1 3 0'/>",
    HTML: "<path d='m5 4 1.3 15L12 21l5.7-2L19 4H5Z'/><path d='M8 8h8l-.3 3H8.3l.3 3H15l-.3 3-2.7 1-2.7-1-.2-1.5'/>",
    fallback: "<path d='M4 5h16v14H4z'/><path d='M8 9h8M8 12h5M8 15h8'/>",
  };

  function validRepos(value) {
    return Array.isArray(value) ? value.filter(isPublicOwnedRepo) : [];
  }

  function createCard(repo, index) {
    const language = repo.language || "Unspecified";
    const topics = Array.isArray(repo.topics) ? repo.topics.slice(0, 3) : [];
    const repoName = escape(repo.name);
    const repoUrl = /^https:\/\/github\.com\/janghotan\/[\w.-]+\/?$/.test(repo.html_url || "") ? repo.html_url : `https://github.com/${USER}/${encodeURIComponent(repo.name)}`;
    const homepage = typeof repo.homepage === "string" && /^https?:\/\//.test(repo.homepage) ? repo.homepage : "";
    const color = colors[index % colors.length];
    const icon = icons[language] || icons.fallback;
    const badges = [repo.fork ? "FORK" : "PUBLIC", repo.archived ? "ARCHIVED" : ""].filter(Boolean);
    const card = document.createElement("article");
    card.className = `project-card ${color}`;
    card.innerHTML = `
      <div class="card-art"><span class="card-art-label">${escape(language)}</span><div class="card-glyph" aria-hidden="true"><svg viewBox="0 0 24 24">${icon}</svg></div><span class="card-art-spark" aria-hidden="true">✳</span></div>
      <div class="card-body"><div class="card-title-row"><h3><a href="${escape(repoUrl)}" target="_blank" rel="noreferrer">${repoName}</a></h3><span class="repo-badge">${badges.map(escape).join(" · ")}</span></div>
      <p class="card-description">${escape(repo.description || "No description provided by the repository owner.")}</p>
      <div class="topic-row">${topics.length ? topics.map((topic) => `<span>${escape(topic)}</span>`).join("") : `<span>${escape(language)}</span>`}</div>
      <div class="card-meta"><span class="meta-language"><i aria-hidden="true"></i>${escape(language)}</span><span title="Stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.2 2 4.1 4.5.7-3.25 3.2.77 4.5L8 11.6l-4.02 2.1.77-4.5L1.5 6l4.5-.7z"/></svg>${Number(repo.stargazers_count) || 0}</span><span title="Forks"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3v6c0 2 2 2 4 2h3m0 0-2-2m2 2-2 2M4 3h.1M4 12h.1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>${Number(repo.forks_count) || 0}</span><span class="meta-updated">UPDATED ${escape(shortDate(repo.updated_at))}</span></div>
      <div class="card-actions"><a href="${escape(repoUrl)}" target="_blank" rel="noreferrer">Repository <span aria-hidden="true">↗</span></a>${homepage ? `<a href="${escape(homepage)}" target="_blank" rel="noreferrer">Live demo <span aria-hidden="true">↗</span></a>` : `<span class="no-demo">No demo link</span>`}</div></div>`;
    return card;
  }

  function availableLanguages() {
    return [...new Set(repositories.map((repo) => repo.language).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  function buildFilters() {
    const langs = availableLanguages();
    const topics = [...new Set(repositories.flatMap((repo) => repo.topics || []))]
      .map((topic) => ({ topic, count: repositories.filter((repo) => (repo.topics || []).includes(topic)).length }))
      .filter(({ count }) => count > 1)
      .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic))
      .slice(0, 4);
    filters.innerHTML = `<button class="filter-chip ${selected === "all" ? "active" : ""}" data-filter="all" aria-pressed="${selected === "all"}">Everything <span>${repositories.length}</span></button>${langs.map((language) => `<button class="filter-chip ${selected === language ? "active" : ""}" data-filter="${escape(language)}" aria-pressed="${selected === language}">${escape(language)} <span>${repositories.filter((repo) => repo.language === language).length}</span></button>`).join("")}${topics.map(({ topic, count }) => `<button class="filter-chip topic-chip ${selected === topic ? "active" : ""}" data-filter="${escape(topic)}" aria-pressed="${selected === topic}">${escape(topic)} <span>${count}</span></button>`).join("")}`;
    document.querySelectorAll(".quick-link[data-filter]").forEach((link) => {
      const available = langs.includes(link.dataset.filter) || link.dataset.filter === "all";
      link.hidden = !available;
    });
    $("#all-count").textContent = repositories.length;
    $("#filter-all-count").textContent = repositories.length;
  }

  function selectedRepos() {
    const query = search.value.trim().toLowerCase();
    const sort = $("#sort").value;
    const result = repositories.filter((repo) => {
      const matchesLanguage = selected === "all" || repo.language === selected || (repo.topics || []).includes(selected);
      const haystack = [repo.name, repo.description, repo.language, ...(repo.topics || [])].join(" ").toLowerCase();
      return matchesLanguage && (!query || haystack.includes(query));
    });
    result.sort((a, b) => sort === "stars" ? (b.stargazers_count || 0) - (a.stargazers_count || 0) : sort === "name" ? a.name.localeCompare(b.name) : new Date(b.updated_at) - new Date(a.updated_at));
    return result;
  }

  function render() {
    const result = selectedRepos();
    grid.innerHTML = "";
    result.forEach((repo, index) => grid.appendChild(createCard(repo, index)));
    grid.hidden = result.length === 0;
    $("#empty-state").hidden = result.length !== 0;
    $("#result-count").textContent = result.length;
    status.textContent = `Showing ${result.length} of ${repositories.length} public projects${selected !== "all" ? ` · ${selected}` : ""}${search.value.trim() ? ` · “${search.value.trim()}”` : ""}`;
  }

  function setRepos(items, source) {
    repositories = validRepos(items).filter((repo) => repo.name !== "");
    buildFilters();
    render();
    status.dataset.source = source;
    if (source === "snapshot") status.textContent += " · saved snapshot";
  }

  async function fetchJSON(url, timeout = 6500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { headers: { Accept: "application/vnd.github+json" }, signal: controller.signal });
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  async function loadRepos() {
    try {
      const live = await fetchJSON(REPOS_API);
      setRepos(live, "live");
    } catch (liveError) {
      try {
        const fallback = await fetchJSON("repos.json");
        setRepos(fallback, "snapshot");
      } catch (snapshotError) {
        const describe = (error) => error?.name === "AbortError" ? "request timed out" : error?.message || "request failed";
        console.error("Repository API and snapshot both failed", { liveError, snapshotError });
        status.textContent = `GitHub API: ${describe(liveError)} · local snapshot: ${describe(snapshotError)}`;
        status.classList.add("is-error");
        grid.setAttribute("aria-busy", "false");
        $("#empty-state").hidden = false;
        $("#empty-state h3").textContent = "Shelf’s offline";
        $("#empty-state p").innerHTML = '<a href="https://github.com/janghotan?tab=repositories" target="_blank" rel="noreferrer">Open the public repositories on GitHub ↗</a>';
      }
    } finally { grid.setAttribute("aria-busy", "false"); }
  }

  async function loadProfile() {
    try {
      const profile = await fetchJSON(PROFILE_API, 5000);
      if (profile.login?.toLowerCase() !== USER) return;
      if (profile.avatar_url) {
        $("#header-avatar").src = profile.avatar_url;
        $("#profile-avatar").src = profile.avatar_url;
      }
      if (profile.bio) $("#profile-bio").textContent = profile.bio;
      $("#profile-repos").textContent = Number.isFinite(profile.public_repos) ? profile.public_repos : "—";
      $("#profile-followers").textContent = Number.isFinite(profile.followers) ? profile.followers : "—";
    } catch {
      try {
        const profile = await fetchJSON("profile.json");
        if (profile.login?.toLowerCase() === USER) {
          if (profile.avatar_url) $("#profile-avatar").src = profile.avatar_url;
          if (profile.bio) $("#profile-bio").textContent = profile.bio;
          $("#profile-repos").textContent = Number.isFinite(profile.public_repos) ? profile.public_repos : "—";
          $("#profile-followers").textContent = Number.isFinite(profile.followers) ? profile.followers : "—";
        }
      } catch { /* The profile snapshot is optional; the identity remains usable. */ }
    }
  }

  search.addEventListener("input", render);
  $("#search-form").addEventListener("submit", (event) => { event.preventDefault(); $("#projects").scrollIntoView({ behavior: "smooth" }); });
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    selected = button.dataset.filter;
    buildFilters();
    render();
  });
  document.querySelectorAll(".quick-link[data-filter]").forEach((link) => link.addEventListener("click", () => {
    selected = link.dataset.filter;
    buildFilters();
    render();
  }));
  $("#sort").addEventListener("change", render);
  function clearFilters() { selected = "all"; search.value = ""; buildFilters(); render(); }
  $("#clear-filters").addEventListener("click", clearFilters);
  $("#clear-empty").addEventListener("click", () => { clearFilters(); search.focus(); });
  $("#year").textContent = new Date().getFullYear();

  const languages = new Set();
  fetchJSON("repos.json").then(validRepos).then((repos) => {
    repos.forEach((repo) => { if (repo.language) languages.add(repo.language); });
    $("#profile-languages").textContent = languages.size || "—";
  }).catch(() => {});
  loadRepos();
  loadProfile();
})();
