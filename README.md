# janghotan.github.io

Personal portfolio — dense dev-dashboard UI, English copy, dark mode only.
Plain HTML/CSS/JS, no build step. Repo data is fetched live, client-side, from
the GitHub API (`users/janghotan/repos`), public repos only — filtered on
`private === false` before anything renders.

## Files

- `index.html` — markup / sections
- `style.css` — design system (dark navy, git-diff green/red, purple→cyan accent)
- `app.js` — live repo fetch + render, status-bar stats, scroll-spy nav
- `.github/workflows/pages.yml` — GitHub Actions → Pages deploy

## Deploy

Push to `main`; the workflow publishes the repo root to Pages.
GitHub → repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Site: https://janghotan.github.io

## Privacy rule

The fetch requests `type=owner`, then discards anything where
`private !== false`. Private repos are never rendered.
