/* Portfolio — live public-repo data from the GitHub API.
   HARD RULE: private repos never render. We request type=owner, then
   require repo.private === false && visibility !== "private" before use. */
(() => {
  "use strict";

  const USER = "janghotan";
  const API = `https://api.github.com/users/${USER}/repos?per_page=100&type=owner&sort=updated`;

  const LANG_COLORS = {
    TypeScript:"#3178C6", JavaScript:"#F1E05A", Python:"#3572A5", Rust:"#DEA584",
    Go:"#00ADD8", HTML:"#E34C26", CSS:"#563D7C", Shell:"#89E051", C:"#555555",
    "C++":"#F34B7D", Java:"#B07219", Ruby:"#701516", Swift:"#F05138", Kotlin:"#A97BFF",
    Zig:"#EC915C", Lua:"#000080", Vue:"#41B883", Svelte:"#FF3E00", MDX:"#FCB32C"
  };

  // never shown as projects: the site repo itself and the profile readme
  const HIDE = new Set([`${USER}.github.io`, USER]);
  // generated / not real portfolio pieces -> collapsed "other" row
  const SECONDARY = new Set(["apt", "codex-chatgpt-web"]);

  const FEATURED_MAX = 6;      // keeps the grid on a clean 3x2 / 2x3
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  function relTime(iso) {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!isFinite(s) || s < 0) return "now";
    const u = [[31536000,"y"],[2592000,"mo"],[604800,"w"],[86400,"d"],[3600,"h"],[60,"m"]];
    for (const [sec, label] of u) if (s >= sec) return Math.floor(s / sec) + label;
    return "now";
  }

  function countUp(node, target) {
    if (reduced || target === 0) { node.textContent = String(target); return; }
    const dur = 650, start = performance.now();
    node.textContent = "0";
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      node.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function setStatus(kind, text) {
    $("dot").className = "dot " + kind;
    $("status-text").textContent = text;
  }

  /* ---------- card ---------- */
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
      const dot = el("i");
      dot.style.background = LANG_COLORS[repo.language] || "#6C7385";
      lang.append(dot, document.createTextNode(repo.language));
      meta.append(lang);
    }
    meta.append(el("span", "meta-stars", "+" + repo.stargazers_count));
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
  function render(primary, secondary, all) {
    const grid = $("repo-grid");
    grid.textContent = "";
    grid.removeAttribute("aria-busy");

    if (!all.length) {
      grid.append(el("p", "grid-msg", "no public repos found"));
    } else {
      const frag = document.createDocumentFragment();
      primary.forEach((r) => frag.append(card(r)));
      frag.append(moreCard());
      grid.append(frag);
    }

    // collapsed "other"
    const otherCount = secondary.length + Math.max(0, all.length - primary.length - secondary.length);
    if (otherCount > 0) {
      $("other").hidden = false;
      $("other-count").textContent = `(${otherCount})`;
      const list = $("other-list");
      list.textContent = "";
      secondary
        .concat(all.filter((r) => !primary.includes(r) && !secondary.includes(r)))
        .forEach((r) => {
          const li = document.createElement("li");
          const a = el("a", null, r.name);
          a.href = r.html_url; a.target = "_blank"; a.rel = "noopener";
          li.append(a);
          list.append(li);
        });
    } else {
      $("other").hidden = true;
    }

    const langs = new Set(all.map((r) => r.language).filter(Boolean));
    const stars = all.reduce((n, r) => n + (r.stargazers_count || 0), 0);

    countUp($("m-repos"), all.length);
    countUp($("m-stars"), stars);
    countUp($("m-langs"), langs.size);
    $("repo-count").textContent = `(${all.length})`;
    $("rail-repo-count").textContent = all.length;

    // pinned rail = 4 most recently pushed primary repos
    const pinned = $("rail-pinned");
    pinned.textContent = "";
    primary.slice(0, 4).forEach((r) => {
      const li = document.createElement("li");
      const a = el("a", "rail-item", r.name);
      a.href = r.html_url; a.target = "_blank"; a.rel = "noopener";
      li.append(a);
      pinned.append(li);
    });
  }

  function renderError(err) {
    console.error("[portfolio] repo fetch failed:", err);
    const grid = $("repo-grid");
    grid.textContent = "";
    grid.removeAttribute("aria-busy");
    const p = el("p", "grid-msg");
    p.append(document.createTextNode("could not reach the GitHub API — "));
    const a = el("a", null, "browse repos directly");
    a.href = `https://github.com/${USER}?tab=repositories`;
    a.rel = "noopener";
    p.append(a);
    grid.append(p);
    $("other").hidden = true;
    $("rail-pinned").textContent = "";
    setStatus("offline", "offline");
  }

  async function load() {
    setStatus("loading", "syncing");
    try {
      const res = await fetch(API, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const raw = await res.json();
      if (!Array.isArray(raw)) throw new Error("unexpected payload");

      // privacy gate
      const pub = raw.filter((r) => r && r.private === false && r.visibility !== "private" && !HIDE.has(r.name));

      const byPush = (a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at);
      const isReal = (r) => !r.fork && !SECONDARY.has(r.name);

      const primary = pub.filter(isReal).sort(byPush).slice(0, FEATURED_MAX);
      const secondary = pub.filter((r) => SECONDARY.has(r.name)).sort(byPush);

      render(primary, secondary, pub);
      setStatus("online", "online");
    } catch (err) {
      renderError(err);
    }
  }

  /* ---------- nav scroll-spy ---------- */
  function navSpy() {
    const links = [...document.querySelectorAll(".rail-item[href^='#']")];
    const targets = links.map((l) => document.querySelector(l.getAttribute("href"))).filter(Boolean);
    if (!("IntersectionObserver" in window) || !targets.length) return;

    const setActive = (id) => links.forEach((l) =>
      l.setAttribute("aria-current", l.getAttribute("href") === "#" + id ? "page" : "false"));

    const io = new IntersectionObserver((entries) => {
      const best = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (best) setActive(best.target.id);
    }, { rootMargin: "-40% 0px -50% 0px", threshold: [0, .2, .5, 1] });

    targets.forEach((t) => io.observe(t));
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("year").textContent = new Date().getFullYear();
    navSpy();
    load();
    setInterval(load, 10 * 60 * 1000);
  });
})();
