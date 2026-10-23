# Jangho Tan — project shelf

A colorful static portfolio for [@janghotan](https://github.com/janghotan), published from the root of this repository with GitHub Pages Actions.

## Files

- `index.html` — semantic page structure and featured projects.
- `style.css` — responsive design system and layouts.
- `app.js` — public GitHub data loading, safe public-owner filtering, search, filters, sort, and cards.
- `repos.json` and `profile.json` — generated public-only fallback snapshot for API downtime.
- `assets/` — original SVG favicon and social share artwork.
- `.github/workflows/pages.yml` — existing root-artifact Pages deployment workflow.

## Project data

The browser requests `https://api.github.com/users/janghotan/repos?type=owner&sort=updated&per_page=100` and the public profile endpoint. Repository cards require the matching owner login, `private: false`, and non-private visibility. The portfolio and profile README repositories are omitted from the project list. If the API is unreachable or rate-limited, the page uses `repos.json` and the profile details already in the HTML. No token or server is required.

The fallback files can be refreshed from the public GitHub API. Keep only public repositories owned by `janghotan`; do not add credentials.

## Deploy

The workflow publishes the repository root when changes reach `main`. In repository settings, Pages must use **GitHub Actions** as its build source. This implementation does not require Node.js or a build step.
