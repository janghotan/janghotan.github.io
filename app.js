/* Live public GitHub data and lightweight portfolio interactions. */
(() => {
  "use strict";

  const USER = "janghotan";
  const API = `https://api.github.com/users/${USER}/repos?per_page=100&type=owner&sort=updated`;
  const TIMEOUT_MS = 8000;
  const CACHE_KEY = "jt:public-repos:v2";
  const CACHE_TTL = 10 * 60 * 1000;
  const HIDE = new Set([`${USER}.github.io`, USER]);
  const SECONDARY = new Set(["apt", "codex-chatgpt-web"]);
  const FEATURED_MAX = 8;
  const LANG_COLORS = {
    TypeScript:"#3178C6",JavaScript:"#F1E05A",Python:"#3572A5",Rust:"#DEA584",Go:"#00ADD8",HTML:"#E34C26",CSS:"#563D7C",Shell:"#89E051",C:"#555555","C++":"#F34B7D",Java:"#B07219",Ruby:"#701516",Swift:"#F05138",Kotlin:"#A97BFF",Zig:"#EC915C",Lua:"#000080",Vue:"#41B883",Svelte:"#FF3E00",MDX:"#FCB32C"
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };
  const isPublic = (repo) => Boolean(repo && repo.private === false && repo.visibility !== "private");
  const visiblePublicRepos = (repos) => repos.filter(isPublic).filter((repo) => !HIDE.has(repo.name));
  let allRepos = [];
  let displayedRepos = [];
  let lastColumnCount = 0;
  let searchQuery = "";

  function relTime(iso) {
    const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!Number.isFinite(seconds) || seconds < 0) return "just now";
    for (const [size, unit] of [[31536000,"y"],[2592000,"mo"],[604800,"w"],[86400,"d"],[3600,"h"],[60,"m"]]) {
      if (seconds >= size) return `${Math.floor(seconds / size)}${unit} ago`;
    }
    return "just now";
  }

  function countUp(node, target) {
    if (!node) return;
    if (reducedMotion || target === 0) { node.textContent = String(target); return; }
    const start = performance.now(), duration = 650;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      node.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function setStatus(kind, label) {
    const dot = $("dot"), text = $("status-text");
    if (dot) dot.className = `status-dot ${kind}`;
    if (text) text.textContent = label;
  }

  function columnsIn(grid) {
    if (!grid) return 1;
    const template = getComputedStyle(grid).gridTemplateColumns;
    return template ? template.split(/\s+/).length : 1;
  }

  function chooseFeaturedCount(repos, columns) {
    const maximum = Math.min(repos.length, FEATURED_MAX);
    for (let count = maximum; count > 0; count -= 1) {
      const hasMore = repos.length > count;
      if ((count + (hasMore ? 1 : 0)) % Math.max(1, columns) === 0) return { count, hasMore };
    }
    return { count: maximum, hasMore: false };
  }

  function projectCard(repo) {
    const link = el("a", "project-card");
    link.href = `https://github.com/${USER}/${encodeURIComponent(repo.name)}`;
    link.target = "_blank";
    link.rel = "noopener";
    const top = el("div", "project-top");
    top.append(el("span", "project-icon", repo.name.slice(0, 1).toUpperCase()), el("span", "project-name", repo.name));
    if (repo.archived || repo.fork) top.append(el("span", "project-badge", repo.archived ? "archived" : "fork"));
    const description = el("p", "project-description", repo.description || "No description provided.");
    if (!repo.description) description.classList.add("empty");
    const meta = el("div", "project-meta");
    if (repo.language) {
      const language = el("span", "project-language");
      const marker = el("i");
      marker.style.backgroundColor = LANG_COLORS[repo.language] || "#788391";
      language.append(marker, document.createTextNode(repo.language));
      meta.append(language);
    }
    meta.append(el("span", "project-stars", `★ ${repo.stargazers_count || 0}`));
    meta.append(el("span", "project-updated", relTime(repo.pushed_at || repo.updated_at)));
    link.append(top, description, meta);
    return link;
  }

  function moreCard() {
    const link = el("a", "project-card project-more");
    link.href = `https://github.com/${USER}?tab=repositories`;
    link.target = "_blank";
    link.rel = "noopener";
    link.append(el("span", "more-mark", "+"), document.createTextNode("Explore all on GitHub"));
    return link;
  }

  function renderPinned(repos) {
    const list = $("rail-pinned");
    if (!list) return;
    list.replaceChildren();
    repos.slice(0, 5).forEach((repo) => {
      const item = document.createElement("li");
      const link = el("a", "", repo.name);
      link.href = `https://github.com/${USER}/${encodeURIComponent(repo.name)}`;
      link.target = "_blank";
      link.rel = "noopener";
      item.append(link);
      list.append(item);
    });
  }

  function renderOther(repos) {
    const box = $("other"), list = $("other-list");
    if (!box || !list) return;
    const byUpdate = (a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at);
    const featuredCandidates = repos.filter((repo) => !repo.fork && !SECONDARY.has(repo.name)).sort(byUpdate);
    const secondary = repos.filter((repo) => repo.fork || SECONDARY.has(repo.name)).sort(byUpdate);
    const chosen = chooseFeaturedCount(featuredCandidates, columnsIn($("repo-grid")));
    const featured = featuredCandidates.slice(0, chosen.count);
    displayedRepos = featured;

    const grid = $("repo-grid");
    grid.replaceChildren();
    if (!featuredCandidates.length) {
      grid.append(el("p", "grid-msg", "No public repositories found."));
    } else {
      featured.forEach((repo) => grid.append(projectCard(repo)));
      if (chosen.hasMore) grid.append(moreCard());
    }
    grid.removeAttribute("aria-busy");

    const others = secondary.concat(featuredCandidates.slice(chosen.count));
    if (others.length) {
      box.hidden = false;
      $("other-count").textContent = `(${others.length})`;
      list.replaceChildren();
      others.forEach((repo) => {
        const item = document.createElement("li");
        const link = el("a", "", repo.name);
        link.href = `https://github.com/${USER}/${encodeURIComponent(repo.name)}`;
        link.target = "_blank";
        link.rel = "noopener";
        item.append(link);
        list.append(item);
      });
    } else {
      box.hidden = true;
    }
    renderPinned(featured);
    const railCount = $("rail-repo-count");
    if (railCount) railCount.textContent = repos.length;
    lastColumnCount = columnsIn(grid);
  }

  function renderSearchResults(query) {
    const matches = allRepos.filter((repo) => [repo.name, repo.description, repo.language].filter(Boolean).join(" ").toLowerCase().includes(query));
    const grid = $("repo-grid");
    const other = $("other");
    if (other) other.hidden = true;
    grid.replaceChildren();
    if (!matches.length) {
      grid.append(el("p", "grid-msg", `No repositories match “${query}”.`));
    } else {
      const selection = chooseFeaturedCount(matches, columnsIn(grid));
      matches.slice(0, selection.count).forEach((repo) => grid.append(projectCard(repo)));
      if (selection.hasMore) grid.append(moreCard());
    }
    grid.removeAttribute("aria-busy");
    lastColumnCount = columnsIn(grid);
  }

  function renderError(message) {
    const grid = $("repo-grid");
    if (grid) {
      grid.replaceChildren();
      const note = el("p", "grid-msg", `${message} `);
      const link = el("a", "", "Browse public repositories on GitHub");
      link.href = `https://github.com/${USER}?tab=repositories`;
      link.target = "_blank";
      link.rel = "noopener";
      note.append(link);
      grid.append(note);
      grid.removeAttribute("aria-busy");
    }
    const pinned = $("rail-pinned");
    if (pinned) pinned.replaceChildren(el("li", "side-loading", "Projects unavailable"));
    const other = $("other");
    if (other) other.hidden = true;
  }

  function renderStats(repos) {
    const stars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    const languages = new Set(repos.map((repo) => repo.language).filter(Boolean));
    countUp($("m-repos"), repos.length);
    countUp($("m-stars"), stars);
    countUp($("m-langs"), languages.size);
    const count = $("repo-count");
    if (count) count.textContent = `(${repos.length})`;
  }

  function readCache() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (!cached || !Array.isArray(cached.repos) || Date.now() - cached.at > CACHE_TTL) return null;
      return visiblePublicRepos(cached.repos);
    } catch (_) { return null; }
  }

  function writeCache(repos) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos })); }
    catch (_) { /* Storage can be disabled or full. */ }
  }

  async function fetchRepos() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(API, { headers: { Accept: "application/vnd.github+json" }, signal: controller.signal });
      if (response.status === 403 || response.status === 429) throw new Error("GitHub API rate limit reached");
      if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload)) throw new Error("GitHub returned an unexpected response");
      return visiblePublicRepos(payload).filter((repo) => repo.name && repo.html_url);
    } finally { clearTimeout(timeout); }
  }

  async function loadRepos() {
    const cached = readCache();
    if (cached) {
      allRepos = cached;
      renderOther(allRepos);
      renderStats(allRepos);
      setStatus("", "cached");
    } else setStatus("loading", "syncing");

    try {
      const repos = await fetchRepos();
      allRepos = repos;
      writeCache(repos);
      renderOther(allRepos);
      renderStats(allRepos);
      setStatus("", "live");
    } catch (error) {
      console.error("[portfolio] repository fetch failed:", error);
      let message = "Could not load projects.";
      if (error.name === "AbortError") message = "GitHub API request timed out.";
      else if (error instanceof TypeError) message = "GitHub API is unreachable.";
      else if (error.message) message = `${error.message}.`;
      if (cached) setStatus("offline", "cached · offline");
      else { renderError(message); setStatus("offline", "offline"); }
    }
  }

  function bindSearch() {
    const input = $("repo-search");
    if (!input) return;
    input.addEventListener("input", () => {
      searchQuery = input.value.trim().toLowerCase();
      if (searchQuery) renderSearchResults(searchQuery);
      else renderOther(allRepos);
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        event.preventDefault();
        input.focus();
      }
      if (event.key === "Escape" && document.activeElement === input) {
        input.value = "";
        input.dispatchEvent(new Event("input"));
        input.blur();
      }
    });
  }

  function bindNavigation() {
    const links = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
    const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) => link.setAttribute("aria-current", link.hash === `#${visible.target.id}` ? "page" : "false"));
    }, { rootMargin: "-25% 0px -60% 0px", threshold: [0, .2, .5, 1] });
    sections.forEach((section) => observer.observe(section));
  }

  function bindGridResize() {
    const grid = $("repo-grid");
    if (!grid || !("ResizeObserver" in window)) return;
    const observer = new ResizeObserver(() => {
      const columns = columnsIn(grid);
      if (columns === lastColumnCount || !allRepos.length) return;
      lastColumnCount = columns;
      if (searchQuery) renderSearchResults(searchQuery);
      else renderOther(allRepos);
    });
    observer.observe(grid);
  }

  function boot() {
    const year = $("year");
    if (year) year.textContent = String(new Date().getFullYear());
    bindSearch();
    bindNavigation();
    bindGridResize();
    loadRepos();
    setTimeout(() => {
      if (["Connecting", "Syncing"].includes($("status-text")?.textContent)) {
        renderError("GitHub API did not respond.");
        setStatus("offline", "offline");
      }
    }, TIMEOUT_MS + 1500);
  }

  document.addEventListener("DOMContentLoaded", boot, { once: true });
})();
