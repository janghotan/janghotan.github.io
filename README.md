# janghotan.github.io

Personal portfolio. Static HTML/CSS/JS, no build step, deployed to GitHub Pages
via Actions. Repo data is fetched client-side from the GitHub API — public
repos only, hard-filtered on `private === false`.

## Files

```
index.html               markup
style.css                design system
app.js                   live repo fetch + render, scroll-spy, count-up
assets/favicon.svg       favicon
assets/og.svg|png        social card (1200x630)
.github/workflows/pages.yml
```

## Design system

- **Spacing** — single scale `--s1..--s8` = 4/8/12/16/24/32/48/64px, used everywhere.
- **Color** — one accent `--accent:#6E7BFF` (interactive only: focus, active nav,
  links). Semantic green `#3FB950` (added), red `#F85149` (removed), amber
  `#D29922` (in progress). No decorative gradients.
- **Type** — JetBrains Mono for code/terminal/numbers (tabular figures),
  Inter for prose.
- **Geometry** — one radius (4px) and one border weight (1px) across repo
  cards, chips and nav.
- **Motion** — all transitions/animations gated behind `prefers-reduced-motion`.

## Repo selection rules

- Never render private repos.
- Hide the site repo and the profile readme.
- Forks and generated repos (`apt`, `codex-chatgpt-web`) go to the collapsed
  "other public repos" row, not the main grid.
- Main grid capped at 6; a dashed `+ more on github` card fills the last cell.

## Deploy

Push to `main`. Settings → Pages → Build and deployment → **Source: GitHub Actions**.
