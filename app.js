(() => {
  "use strict";

  const USER = "janghotan";
  const REPOS_API = `https://api.github.com/users/${USER}/repos?type=owner&sort=updated&per_page=100`;
  const PROFILE_API = `https://api.github.com/users/${USER}`;
  const HIDE = new Set([`${USER}.github.io`, USER]);
  const $ = (selector, root = document) => root.querySelector(selector);
  const grid = $("#project-grid");
  const status = $("#catalog-status");
  const search = $("#search");
  const filters = $("#filters");
  let repositories = [];
  let selected = "all";

  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const isPublicOwnedRepo = (repo) => repo && repo.owner?.login?.toLowerCase() === USER && repo.private === false && repo.visibility !== "private" && !HIDE.has(repo.name);
  const formatDate = (date) => date ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(date)) : "Date unavailable";
  const readable = (n) => new Intl.NumberFormat("en", { notation: n >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(Number(n) || 0);
  const ICONS = {
    Rust: "<path d='m12 3 2 1 2-.2.8 2 2 1-.6 2 .6 2-2 1-.8 2-2-.2-2 1-2-1-2 .2-.8-2-2-1 .6-2-.6-2 2-1 .8-2z'/><circle cx='12' cy='11.5' r='3'/>",
    Python: "<path d='M12 3c-2 0-3 .8-3 2v3h6v1H7c-2 0-3 1-3 3v2c0 2 1 3 3 3h2v-3c0-2 1-3 3-3h4c2 0 3-1 3-3V6c0-2-1-3-3-3z'/><path d='M12 21c2 0 3-.8 3-2v-3H9v-1h8c2 0 3-1 3-3v-2c0-2-1-3-3-3h-2v3c0 2-1 3-3 3H8c-2 0-3 1-3 3v2c0 2 1 3 3 3z'/><circle cx='11' cy='5.5' r='.5'/><circle cx='13' cy='18.5' r='.5'/>",
    TypeScript: "<path d='M4 5h16v14H4zM7 9h7m-3.5 0v7m5-4c0-1 4-1 4 0s-4 1-4 2 4 1 4 0'/>",
    HTML: "<path d='m5 4 1.2 15L12 21l5.8-2L19 4zM8 8h8l-.3 3H8.3l.3 3H15l-.3 3-2.7 1-2.7-1-.2-1.5'/>",
    fallback: "<path d='M4 5h16v14H4zM8 9h8M8 12h5M8 15h8'/>",
  };
  const ART = {
    rewind: { type: "terminal", tag: "UNDO FOR SHELL", accent: "orange" },
    "micro-dump": { type: "packet", tag: "HEADER INSPECTION", accent: "blue" },
    dusk: { type: "disk", tag: "DISK USAGE CLI", accent: "green" },
    "gsearch-cli": { type: "search", tag: "SEARCH LINKS", accent: "pink" },
    apt: { type: "package", tag: "APT REPOSITORY", accent: "yellow" },
    "SDK-Anything": { type: "nodes", tag: "AGENT TOOLING", accent: "purple" },
    "codex-chatgpt-web": { type: "fork", tag: "PUBLIC FORK", accent: "dark" },
  };
  const artMarkup = (repo) => {
    const art = ART[repo.name] || { type: "code", tag: repo.language || "OPEN SOURCE", accent: "orange" };
    const scenes = {
      terminal: `<div class="scene-terminal"><div><i></i><i></i><i></i><b>zsh</b></div><code><em>$</em> rm -rf src/<br><em>$</em> rewind undo<br><strong>✓ restored</strong></code></div><span class="scene-sticker">UNDO<br>READY</span>`,
      packet: `<div class="scene-packet"><b>ETH</b><b>IP</b><b>TCP</b><strong>PAYLOAD<br>HIDDEN</strong></div><div class="scene-wave">${"<i></i>".repeat(13)}</div><span class="scene-sticker">PCAP<br>VIEW</span>`,
      disk: `<div class="scene-disk"><span>PATH</span><b>~/projects</b><i style="--w:76%"></i><span>node_modules</span><i style="--w:48%"></i><span>src</span><i style="--w:24%"></i></div><span class="scene-sticker">SCAN<br>DEPTH</span>`,
      search: `<div class="scene-search"><span>⌕</span><b>site:docs…</b><i>↗</i></div><div class="scene-search-tags"><b>WEB</b><b>IMAGES</b><b>NEWS</b><b>MAPS</b></div><span class="scene-sticker">QUERY<br>BUILDER</span>`,
      package: `<div class="scene-package"><span>APT</span><b>rewind</b><small>signed package</small><strong>✓ VERIFIED</strong></div><span class="scene-sticker">INSTALL<br>SOURCE</span>`,
      nodes: `<div class="scene-nodes"><b>SDK</b><i>→</i><div><span>MCP</span><span>CLI</span><span>SKILLS</span></div></div><span class="scene-sticker">TOOLS<br>IN HAND</span>`,
      fork: `<div class="scene-fork"><span>UPSTREAM</span><b>↘</b><strong>PUBLIC<br>FORK</strong><b>↙</b><span>JANGHOTAN</span></div><span class="scene-sticker">FORK<br>OF</span>`,
      code: `<div class="scene-terminal"><div><i></i><i></i><i></i><b>${escape(repo.language || "CODE")}</b></div><code><em>01</em> const tools = […]<br><em>02</em> build useful things<br><strong>03  ✓ ready</strong></code></div><span class="scene-sticker">PUBLIC<br>REPO</span>`,
    };
    return `<div class="repo-art art-${art.accent}" aria-hidden="true"><span class="art-label">${escape(art.tag)}</span>${scenes[art.type] || scenes.code}<span class="art-number">${String(repo.name || "").slice(0, 2).toUpperCase()}</span></div>`;
  };

  function validRepos(value) { return Array.isArray(value) ? value.filter(isPublicOwnedRepo) : []; }
  function repoUrl(repo) {
    return /^https:\/\/github\.com\/janghotan\/[\w.-]+\/?$/.test(repo.html_url || "") ? repo.html_url : `https://github.com/${USER}/${encodeURIComponent(repo.name)}`;
  }
  function createCard(repo) {
    const language = repo.language || "Unspecified";
    const topics = Array.isArray(repo.topics) ? repo.topics.slice(0, 4) : [];
    const homepage = typeof repo.homepage === "string" && /^https?:\/\//.test(repo.homepage) ? repo.homepage : "";
    const card = document.createElement("article");
    card.className = `project-card ${repo.name === "rewind" ? "project-featured" : ""}`;
    card.dataset.project = repo.name.toLowerCase();
    card.dataset.language = language;
    const description = repo.description || "No description provided by the repository owner.";
    const statusLabel = repo.fork ? "FORK" : repo.archived ? "ARCHIVED" : repo.name === "rewind" ? "FEATURED" : "PUBLIC";
    card.innerHTML = `${artMarkup(repo)}<div class="card-content"><div class="card-overline"><span class="language-label">${escape(language)}</span><span class="repo-state ${repo.fork ? "is-fork" : repo.archived ? "is-archived" : repo.name === "rewind" ? "is-featured" : ""}">${statusLabel}</span></div><h3><a href="${escape(repoUrl(repo))}" target="_blank" rel="noopener noreferrer">${escape(repo.name)} <span aria-hidden="true">↗</span></a></h3><p class="card-description">${escape(description)}</p><div class="topic-row">${topics.length ? topics.map((topic) => `<span>${escape(topic)}</span>`).join("") : `<span>${escape(language)}</span>`}</div><div class="repo-metrics"><span title="Stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.4 1.9 4 4.4.6-3.2 3.1.8 4.4L8 11.4l-3.9 2.1.8-4.4L1.7 6l4.4-.6z"/></svg>${readable(repo.stargazers_count)}</span><span title="Forks"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3v5c0 2 2 2 4 2h3m0 0-2-2m2 2-2 2M4 3h.1M4 12h.1"/></svg>${readable(repo.forks_count)}</span><span class="updated">UPDATED ${escape(formatDate(repo.updated_at))}</span></div><div class="card-links"><a href="${escape(repoUrl(repo))}" target="_blank" rel="noopener noreferrer">View repository <span aria-hidden="true">↗</span></a>${homepage ? `<a href="${escape(homepage)}" target="_blank" rel="noopener noreferrer">Project homepage <span aria-hidden="true">↗</span></a>` : ""}</div></div>`;
    return card;
  }
  function countsByLanguage() {
    return repositories.reduce((counts, repo) => { if (repo.language) counts[repo.language] = (counts[repo.language] || 0) + 1; return counts; }, {});
  }
  function availableTopics() {
    const counts = new Map();
    repositories.forEach((repo) => (repo.topics || []).forEach((topic) => counts.set(topic, (counts.get(topic) || 0) + 1)));
    return [...counts].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 4);
  }
  function buildFilters() {
    const languages = countsByLanguage();
    const sortedLanguages = Object.keys(languages).sort((a, b) => a.localeCompare(b));
    const topics = availableTopics();
    filters.innerHTML = `<button class="filter-chip ${selected === "all" ? "active" : ""}" type="button" data-filter="all" aria-pressed="${selected === "all"}">Everything <span id="filter-all-count">${repositories.length}</span></button>${sortedLanguages.map((lang) => `<button class="filter-chip ${selected === lang ? "active" : ""}" type="button" data-filter="${escape(lang)}" aria-pressed="${selected === lang}">${escape(lang)} <span>${languages[lang]}</span></button>`).join("")}${topics.map(([topic, count]) => `<button class="filter-chip ${selected === topic ? "active" : ""}" type="button" data-filter="${escape(topic)}" aria-pressed="${selected === topic}">${escape(topic)} <span>${count}</span></button>`).join("")}`;
    $("#all-count").textContent = repositories.length;
    const category = $("#hero-categories");
    category.innerHTML = `<button class="category-link ${selected === "all" ? "selected" : ""}" type="button" data-filter="all"><span class="category-symbol orange">✳</span><span>All projects</span><b>${repositories.length}</b></button>${sortedLanguages.map((lang, i) => `<button class="category-link ${selected === lang ? "selected" : ""}" type="button" data-filter="${escape(lang)}"><span class="category-symbol ${["red", "blue", "pink", "green"][i % 4]}">${escape(lang.slice(0, 2))}</span><span>${escape(lang)} projects</span><b>${languages[lang]}</b></button>`).join("")}${topics.slice(0, 2).map(([topic, count]) => `<button class="category-link ${selected === topic ? "selected" : ""}" type="button" data-filter="${escape(topic)}"><span class="category-symbol yellow">#</span><span>${escape(topic)}</span><b>${count}</b></button>`).join("")}`;
    const tileClass = ["stack-rust", "stack-python", "stack-ts", "stack-topics", "stack-more"];
    const tileIcon = { Rust: "R", Python: "Py", TypeScript: "TS", HTML: "<>" };
    $("#language-tiles").innerHTML = sortedLanguages.slice(0, 4).map((lang, index) => `<button class="stack-tile ${tileClass[index % tileClass.length]} ${selected === lang ? "selected" : ""}" type="button" data-filter="${escape(lang)}"><span>${escape(tileIcon[lang] || lang.slice(0, 2).toUpperCase())}</span><b>${escape(lang)} projects</b><small>${languages[lang]} ${languages[lang] === 1 ? "repository" : "repositories"} <i aria-hidden="true">↗</i></small></button>`).join("") + topics.slice(0, 1).map(([topic, count]) => `<button class="stack-tile stack-topics ${selected === topic ? "selected" : ""}" type="button" data-filter="${escape(topic)}"><span>#</span><b>${escape(topic)}</b><small>${count} tagged repositories <i aria-hidden="true">↗</i></small></button>`).join("");
    document.querySelectorAll("[data-filter]").forEach((item) => {
      if (item.dataset.filter === selected) item.setAttribute("aria-pressed", "true");
      else if (item.matches("button")) item.setAttribute("aria-pressed", "false");
      item.classList.toggle("active", item.dataset.filter === selected && item.classList.contains("nav-link"));
      item.classList.toggle("selected", item.dataset.filter === selected && item.matches(".category-link, .stack-tile"));
    });
  }
  function selectedRepos() {
    const query = search.value.trim().toLowerCase();
    const sort = $("#sort").value;
    return repositories.filter((repo) => {
      const matchesCategory = selected === "all" || repo.language === selected || (repo.topics || []).includes(selected);
      const haystack = [repo.name, repo.description, repo.language, ...(repo.topics || [])].join(" ").toLowerCase();
      return matchesCategory && (!query || haystack.includes(query));
    }).sort((a, b) => sort === "stars" ? (b.stargazers_count || 0) - (a.stargazers_count || 0) : sort === "name" ? a.name.localeCompare(b.name) : new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
  }
  function render() {
    const results = selectedRepos();
    grid.innerHTML = "";
    results.forEach((repo) => grid.appendChild(createCard(repo)));
    grid.hidden = !results.length;
    $("#empty-state").hidden = Boolean(results.length);
    $("#result-count").textContent = results.length;
    status.textContent = `Showing ${results.length} of ${repositories.length} public projects${selected !== "all" ? ` · ${selected}` : ""}${search.value.trim() ? ` · “${search.value.trim()}”` : ""}`;
  }
  function updateHighlights() {
    const latest = repositories.slice().sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))[0];
    const standout = repositories.find((repo) => repo.name === "rewind") || latest;
    if (latest) {
      $("#latest-name").textContent = latest.name;
      $("#latest-description").textContent = latest.description || "No description provided by the repository owner.";
      $("#latest-language").textContent = latest.language || "Unspecified";
      $("#latest-updated").textContent = formatDate(latest.updated_at).toUpperCase();
      $("#latest-link").href = repoUrl(latest);
    }
    if (standout) {
      const link = $(".campaign-button");
      link.href = repoUrl(standout);
      if (standout.name !== "rewind") link.textContent = `Explore ${standout.name} ↗`;
    }
    const languages = Object.keys(countsByLanguage()).length;
    const stars = repositories.reduce((total, repo) => total + (Number(repo.stargazers_count) || 0), 0);
    $("#profile-languages").textContent = languages;
    $("#profile-stars").textContent = readable(stars);
    $("#profile-repos").textContent = repositories.length;
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
    try { setRepos(await fetchJSON(REPOS_API), "live"); }
    catch (liveError) {
      try { setRepos(await fetchJSON("repos.json"), "snapshot"); }
      catch (snapshotError) {
        const describe = (error) => error?.name === "AbortError" ? "request timed out" : error?.message || "request failed";
        console.error("Repository API and snapshot both failed", { liveError, snapshotError });
        status.textContent = `GitHub API: ${describe(liveError)} · local snapshot: ${describe(snapshotError)}`;
        status.classList.add("is-error");
        grid.setAttribute("aria-busy", "false");
        $("#empty-state").hidden = false;
        $("#empty-state h3").textContent = "Project list unavailable";
        $("#empty-state p").innerHTML = '<a href="https://github.com/janghotan?tab=repositories" target="_blank" rel="noopener noreferrer">Open Jangho’s public repositories on GitHub ↗</a>';
      }
    } finally { grid.setAttribute("aria-busy", "false"); }
  }
  function setRepos(items, source) {
    repositories = validRepos(items).filter((repo) => repo.name);
    buildFilters();
    updateHighlights();
    render();
    status.dataset.source = source;
  }
  async function loadProfile() {
    try {
      let profile;
      try { profile = await fetchJSON(PROFILE_API, 5000); }
      catch { profile = await fetchJSON("profile.json", 5000); }
      if (profile.login?.toLowerCase() !== USER) return;
      if (profile.avatar_url) { $("#header-avatar").src = profile.avatar_url; $("#profile-avatar").src = profile.avatar_url; }
      if (profile.bio) $("#profile-bio").textContent = profile.bio;
      // Repo/star counts come only from the repository list so THE MAKER matches the catalog grid.
    } catch { /* The profile snapshot is optional; the linked identity remains usable. */ }
  }
  function chooseFilter(value) {
    selected = value || "all";
    buildFilters();
    render();
  }
  search.addEventListener("input", render);
  $("#search-form").addEventListener("submit", (event) => { event.preventDefault(); $("#projects").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); });
  document.addEventListener("click", (event) => {
    const filter = event.target.closest("[data-filter]");
    if (filter) { event.preventDefault(); chooseFilter(filter.dataset.filter); $("#projects").scrollIntoView({ behavior: "smooth" }); return; }
    const suggestion = event.target.closest("[data-search]");
    if (suggestion) { search.value = suggestion.dataset.search; render(); search.focus(); }
  });
  $("#sort").addEventListener("change", render);
  $("#clear-filters").addEventListener("click", () => { search.value = ""; chooseFilter("all"); });
  $("#clear-empty").addEventListener("click", () => { search.value = ""; chooseFilter("all"); });
  $("#year").textContent = new Date().getFullYear();
  loadRepos();
  loadProfile();
})();
