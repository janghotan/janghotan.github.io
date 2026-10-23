/* Portfolio — live public-repo data from the GitHub API.
   PRIVACY: private repos are never rendered. We request type=owner, then
   require repo.private === false && visibility !== "private" before use. */
(() => {
  "use strict";

  const USER = "janghotan";
  const API = `https://api.github.com/users/${USER}/repos?per_page=100&type=owner&sort=updated`;
  const TIMEOUT_MS = 8000;
  const CACHE_KEY = "jt:repos:v1";
  const CACHE_TTL = 10 * 60 * 1000;

  const LANG_COLORS = {
    TypeScript:"#3178C6", JavaScript:"#F1E05A", Python:"#3572A5", Rust:"#DEA584",
    Go:"#00ADD8", HTML:"#E34C26", CSS:"#563D7C", Shell:"#89E051", C:"#555555",
    "C++":"#F34B7D", Java:"#B07219", Ruby:"#701516", Swift:"#F05138", Kotlin:"#A97BFF",
    Zig:"#EC915C", Lua:"#000080", Vue:"#41B883", Svelte:"#FF3E00", MDX:"#FCB32C"
  };

  // never shown as projects: the site repo itself + profile readme
  const HIDE = new Set([`${USER}.github.io`, USER]);
  // generated / not real portfolio pieces -> collapsed "other" row
  const SECONDARY = new Set(["apt", "codex-chatgpt-web"]);
  const FEATURED_MAX = 6;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const isPublic = (r) => !!r && r.private === false && r.visibility !== "private";

  function relTime(iso) {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!isFinite(s) || s < 0) return "now";
    const u = [[31536000,"y"],[2592000,"mo"],[604800,"w"],[86400,"d"],[3600,"h"],[60,"m"]];
    for (const pair of u) if (s >= pair[0]) return Math.floor(s / pair[0]) + pair[1];
    return "now";
  }

  function countUp(node, target) {
    if (reduced || target === 0) { node.textContent = String(target); return; }
    const dur = 650, start = performance.now();
    node.textContent = "0";
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      node.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function setStatus(kind, text) {
    const dot = $("dot"), label = $("status-text");
    if (dot) dot.className = "dot " + kind;
    if (label) label.textContent = text;
  }

  /* ---------- cards ---------- */
  function card(repo) {
    const a = el("a", "card");
    a.href = repo.html_url;
    a.target = "_blank";
    a.rel = "noopener";

    const top = el("div", "card-top");
    top.append(el("span", "card-name", repo.name));
    if (repo.archived) top.append(el("span", "card-flag", "archived"));
    else if (repo.fork) top.append(el("span", "card-flag", "fork"));

    const desc = el("p", "card-desc", repo.description || "no description");
    if (!repo.description) desc.classList.add("empty");

    const meta = el("div", "card-meta");
    if (repo.language) {
      const lang = el("span", "lang");
      const d = el("i");
      d.style.background = LANG_COLORS[repo.language] || "#6C7385";
      lang.append(d, document.createTextNode(repo.language));
      meta.append(lang);
    }
    meta.append(el("span", "meta-stars", "+" + (repo.stargazers_count || 0)));
    const upd = el("span", "meta-upd", relTime(repo.updated_at));
    upd.title = "updated " + new Date(repo.updated_at).toLocaleString();
    meta.append(upd);

    a.append(top, desc, meta);
    return a;
  }

  function moreCard() {
    const a = el("a", "card card-more");
    a.href = `https://github.com/${USER}?tab=repositories`;
    a.target = "_blank";
    a.rel = "noopener";
    a.append(el("span", "plus", "+"), document.createTextNode("more on github"));
    return a;
  }

  /* ---------- render ---------- */
  function render(all) {
    const grid = $("repo-grid");
    if (!grid) return;
    grid.textContent = "";
    grid.removeAttribute("aria-busy");

    const byPush = (a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at);
    const isReal = (r) => !r.fork && !SECONDARY.has(r.name);

    const primary = all.filter(isReal).sort(byPush).slice(0, FEATURED_MAX);
    const secondary = all.filter((r) => SECONDARY.has(r.name)).sort(byPush);
    const rest = all.filter((r) => !primary.includes(r) && !secondary.includes(r));
    const others = secondary.concat(rest);

    if (!all.length) {
      grid.append(el("p", "grid-msg", "no public repos found"));
    } else {
      const frag = document.createDocumentFragment();
      primary.forEach((r) => frag.append(card(r)));
      frag.append(moreCard());
      grid.append(frag);
    }

    const otherBox = $("other");
    if (otherBox) {
      if (others.length) {
        otherBox.hidden = false;
        $("other-count").textContent = `(${others.length})`;
        const list = $("other-list");
        list.textContent = "";
        others.forEach((r) => {
          const li = document.createElement("li");
          const a = el("a", null, r.name);
          a.href = r.html_url; a.target = "_blank"; a.rel = "noopener";
          li.append(a);
          list.append(li);
        });
      } else {
        otherBox.hidden = true;
      }
    }

    const langs = new Set(all.map((r) => r.language).filter(Boolean));
    const stars = all.reduce((n, r) => n + (r.stargazers_count || 0), 0);

    countUp($("m-repos"), all.length);
    countUp($("m-stars"), stars);
    countUp($("m-langs"), langs.size);
    const rc = $("repo-count"); if (rc) rc.textContent = `(${all.length})`;
    const rrc = $("rail-repo-count"); if (rrc) rrc.textContent = all.length;

    const pinned = $("rail-pinned");
    if (pinned) {
      pinned.textContent = "";
      primary.slice(0, 4).forEach((r) => {
        const li = document.createElement("li");
        const a = el("a", "rail-item", r.name);
        a.href = r.html_url; a.target = "_blank"; a.rel = "noopener";
        li.append(a);
        pinned.append(li);
      });
    }
  }

  function renderError(message) {
    const grid = $("repo-grid");
    if (grid) {
      grid.textContent = "";
      grid.removeAttribute("aria-busy");
      const p = el("p", "grid-msg", message + " — ");
      const a = el("a", null, "browse repos on GitHub");
      a.href = `https://github.com/${USER}?tab=repositories`;
      a.target = "_blank";
      a.rel = "noopener";
      p.append(a);
      grid.append(p);
    }
    const otherBox = $("other"); if (otherBox) otherBox.hidden = true;
    const pinned = $("rail-pinned");
    if (pinned) {
      pinned.textContent = "";
      const li = document.createElement("li");
      li.className = "rail-skeleton";
      li.textContent = "unavailable";
      pinned.append(li);
    }
  }

  /* ---------- data ---------- */
  function readCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.repos)) return null;
      if (Date.now() - (parsed.at || 0) > CACHE_TTL) return null;
      return parsed.repos.filter(isPublic);
    } catch (_) { return null; }
  }

  function writeCache(repos) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos }));
    } catch (_) { /* quota / disabled — ignore */ }
  }

  async function fetchRepos() {
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = setTimeout(() => ctrl && ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(API, {
        headers: { Accept: "application/vnd.github+json" },
        signal: ctrl ? ctrl.signal : undefined
      });
      if (res.status === 403 || res.status === 429) {
        throw new Error("GitHub API rate limit reached");
      }
      if (!res.ok) throw new Error("GitHub API returned HTTP " + res.status);
      const raw = await res.json();
      if (!Array.isArray(raw)) throw new Error("unexpected API payload");
      return raw.filter(isPublic).filter((r) => !HIDE.has(r.name));
    } finally {
      clearTimeout(timer);
    }
  }

  async function load() {
    const cached = readCache();
    if (cached) { render(cached); setStatus("online", "online"); }
    else setStatus("loading", "syncing");

    try {
      const repos = await fetchRepos();
      writeCache(repos);
      render(repos);
      setStatus("online", "online");
    } catch (err) {
      console.error("[portfolio] repo fetch failed:", err);
      let msg = "Could not load repos";
      if (err && err.name === "AbortError") msg = "GitHub API timed out";
      else if (err && err instanceof TypeError) msg = "GitHub API unreachable";
      else if (err && err.message) msg = err.message;
      if (cached) {
        setStatus("offline", "cached");
      } else {
        renderError(msg);
        setStatus("offline", "offline");
      }
    }
  }

  /* ---------- scroll-spy ---------- */
  function navSpy() {
    const links = Array.prototype.slice.call(document.querySelectorAll('.rail-item[href^="#"]'));
    const targets = links
      .map((l) => document.querySelector(l.getAttribute("href")))
      .filter(Boolean);
    if (!("IntersectionObserver" in window) || !targets.length) return;

    const setActive = (id) => links.forEach((l) =>
      l.setAttribute("aria-current", l.getAttribute("href") === "#" + id ? "page" : "false"));

    const io = new IntersectionObserver((entries) => {
      const best = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (best) setActive(best.target.id);
    }, { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.2, 0.5, 1] });

    targets.forEach((t) => io.observe(t));
  }

  function boot() {
    const year = $("year");
    if (year) year.textContent = new Date().getFullYear();
    navSpy();
    load();
    setInterval(load, CACHE_TTL);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  // safety net: never leave the UI stuck on "connecting"
  setTimeout(() => {
    const label = $("status-text");
    if (label && /connecting|syncing/i.test(label.textContent)) {
      renderError("GitHub API did not respond");
      setStatus("offline", "offline");
    }
  }, TIMEOUT_MS + 4000);
})();
