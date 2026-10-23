/* Portfolio — live public-repo data from the GitHub API.
   HARD RULE: private repos are never rendered. We request type=owner,
   then filter `repo.private === false` before anything touches the DOM. */
(() => {
  "use strict";

  const USER = "janghotan";
  const API = "https://api.github.com/users/" + USER + "/repos?per_page=100&type=owner&sort=updated";
  const LANG_COLORS = {
    TypeScript: "#3178C6", JavaScript: "#F1E05A", Python: "#3572A5", Rust: "#DEA584",
    Go: "#00ADD8", HTML: "#E34C26", CSS: "#563D7C", Shell: "#89E051", C: "#555555",
    "C++": "#F34B7D", Java: "#B07219", Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF",
    Zig: "#EC915C", Lua: "#000080", Vue: "#41B883", Svelte: "#FF3E00", "Jupyter Notebook": "#DA5B0B"
  };
  // the site repo and the profile-readme repo are public, but not "projects"
  const SKIP = new Set([USER + ".github.io", USER]);

  const $ = (id) => document.getElementById(id);
  const byDateDesc = (a, b) => new Date(b.updated_at) - new Date(a.updated_at);

  function relTime(iso) {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!isFinite(s) || s < 0) return "just now";
    const units = [[31536000, "y"], [2592000, "mo"], [604800, "w"], [86400, "d"], [3600, "h"], [60, "m"]];
    for (let i = 0; i < units.length; i++) {
      const sec = units[i][0], label = units[i][1];
      if (s >= sec) return Math.floor(s / sec) + label + " ago";
    }
    return "just now";
  }

  function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function setStatus(kind, text) {
    $("status-dot").className = "dot " + kind;
    $("status-text").textContent = text;
  }

  function renderCard(repo) {
    const a = el("a", "card");
    a.href = repo.html_url;
    a.target = "_blank";
    a.rel = "noopener";

    const top = el("div", "card-top");
    top.append(el("span", "card-emoji", repo.fork ? "\u{1F374}" : "\u{1F4C1}"));
    const name = el("span", "card-name", repo.name);
    name.title = repo.name;
    top.append(name);

    const desc = el("p", "card-desc", repo.description || "no description yet");
    if (!repo.description) desc.classList.add("muted");

    const meta = el("div", "card-meta");
    if (repo.language) {
      const lang = el("span", "lang");
      const swatch = el("i");
      swatch.style.background = LANG_COLORS[repo.language] || "#8B8BA7";
      lang.append(swatch, document.createTextNode(repo.language));
      meta.append(lang);
    }
    meta.append(el("span", "stars", "\u2B50 " + repo.stargazers_count));
    const upd = el("span", "upd", "\u{1F504} " + relTime(repo.updated_at));
    upd.title = new Date(repo.updated_at).toLocaleString();
    meta.append(upd);

    a.append(top, desc, meta);
    return a;
  }

  function renderAll(repos) {
    const grid = $("repo-grid");
    grid.textContent = "";
    grid.removeAttribute("aria-busy");

    if (!repos.length) {
      grid.append(el("p", "loading", "no public repos found"));
    } else {
      const frag = document.createDocumentFragment();
      repos.forEach((r) => frag.append(renderCard(r)));
      grid.append(frag);
    }

    const langs = new Set(repos.map((r) => r.language).filter(Boolean));
    const stars = repos.reduce((n, r) => n + (r.stargazers_count || 0), 0);

    $("stat-repos").textContent = repos.length;
    $("stat-stars").textContent = stars;
    $("stat-langs").textContent = langs.size;
    $("repo-count").textContent = "(" + repos.length + ")";
    $("nav-repo-count").textContent = repos.length;
    $("stat-sync").textContent = "synced " + relTime(new Date().toISOString());
  }

  function renderError(err) {
    console.error("[portfolio] repo fetch failed:", err);
    const grid = $("repo-grid");
    grid.textContent = "";
    grid.removeAttribute("aria-busy");
    const p = el("p", "card-err", "\u26A0\uFE0F couldn't load repos \u2014 ");
    const link = el("a", null, "view on GitHub");
    link.href = "https://github.com/" + USER + "?tab=repositories";
    link.rel = "noopener";
    p.append(link);
    grid.append(p);
    setStatus("offline", "github api unreachable");
  }

  async function load() {
    setStatus("", "fetching\u2026");
    try {
      const res = await fetch(API, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const raw = await res.json();
      if (!Array.isArray(raw)) throw new Error("unexpected payload");

      // privacy gate: public repos only
      const publicOnly = raw.filter((r) => r && r.private === false && r.visibility !== "private");
      const repos = publicOnly.filter((r) => !SKIP.has(r.name)).sort(byDateDesc);

      renderAll(repos);
      setStatus("online", "online");
    } catch (err) {
      renderError(err);
    }
  }

  // sidebar "chat list" active state
  function navSpy() {
    const links = Array.prototype.slice.call(document.querySelectorAll(".nav-item"));
    const targets = links
      .map((l) => document.querySelector(l.getAttribute("href")))
      .filter(Boolean);
    if (!("IntersectionObserver" in window) || !targets.length) return;

    const setActive = (id) => links.forEach((l) =>
      l.setAttribute("aria-current", l.getAttribute("href") === "#" + id ? "true" : "false"));

    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.6, 1] });

    targets.forEach((t) => io.observe(t));
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("year").textContent = new Date().getFullYear();
    navSpy();
    load();
    setInterval(load, 10 * 60 * 1000); // refresh every 10 min
  });
})();