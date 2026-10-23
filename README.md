# Jangho Tan

Personal portfolio for Jangho Tan (@janghotan), an AI agent and LLM developer with a security background. The interface is a compact developer workspace in English, built with static HTML, CSS, and JavaScript.

## Files

```
index.html               page structure and content
style.css                dark workspace design system and responsive layout
app.js                   public GitHub data, search, stats, and navigation
assets/favicon.svg       workspace mark
assets/og.svg|png        social preview (1200 × 630)
.github/workflows/pages.yml
```

## Data and privacy

- Repository data is fetched from the GitHub REST API with an eight-second timeout.
- A repository must have `private === false` and must not report private visibility before it can be rendered.
- The site repository and profile README are omitted from the project list.
- API failures show a visible status and a direct link to GitHub; successful results are cached in session storage for ten minutes.
- The repository search filters live public repo data locally in the browser.

## Design

- Spacing uses the 4, 8, 12, 16, 24, 32, 48, and 64px scale.
- Dark layered surfaces, a blue interaction accent, and semantic green/amber/red diff markers.
- Inter for prose and JetBrains Mono for repository names and aligned data.
- Animations and transitions honor `prefers-reduced-motion`.

## Deploy

Push to `main`. In repository settings, set Pages → Build and deployment → Source to **GitHub Actions**. The workflow at `.github/workflows/pages.yml` publishes the repository root.
