# Jangho Tan

Personal portfolio for Jangho Tan (@janghotan), an AI agent and LLM developer with a security background. Static HTML, CSS, and JavaScript, presented as a compact terminal and developer portfolio.

## Files

```
index.html               terminal hero, navigation, repo grid, skills, and contact
style.css                dark terminal UI and responsive layout
app.js                   public GitHub data, timeout, cache, status, and grid layout
assets/favicon.svg       terminal prompt mark
assets/og.svg|png        social preview (1200 × 630)
.github/workflows/pages.yml
```

## Data and privacy

- Repository data comes from `api.github.com/users/janghotan/repos` with an eight-second timeout.
- A repository must have `private === false` and must not report private visibility before it can render.
- The site repository and profile README are hidden from the project list.
- API failures show an offline status and direct GitHub link; successful results are cached in session storage for ten minutes.
- The repo grid balances its final row at the current viewport width; additional public repos remain in a collapsed list.

## Design

- A single terminal window contains the CLI transcript and profile details side by side.
- Spacing uses the 4, 8, 12, 16, 24, 32, 48, and 64px scale.
- Green marks additions, amber marks active work, and red marks removals or avoided behavior.
- JetBrains Mono is used for terminal and data; Inter is used for prose.
- Motion honors `prefers-reduced-motion`.

## Deploy

Push to `main`. In repository settings, set Pages → Build and deployment → Source to **GitHub Actions**. The workflow at `.github/workflows/pages.yml` publishes the repository root.
