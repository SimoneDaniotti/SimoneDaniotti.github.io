# simonedaniotti.github.io

Personal academic website of Simone Daniotti. Built with [Astro](https://astro.build), hosted on GitHub Pages.

## Update the content

| What | Where |
|---|---|
| Name, positions, Fields line, Scholar/LinkedIn/Haas links | `src/data/site.ts` |
| About text | `src/pages/index.astro` |
| Papers (title, authors, venue, links, topics, abstract, figure) | `src/data/publications.json` |
| Topic filter names | `src/data/topics.json` |
| Teaching | `src/data/teaching.json` |
| CV | edit it in **Overleaf**: the site rebuilds daily and fetches the latest version |

To add a paper, copy an entry in `publications.json`. `year` sets its place (newest first), `self: true` marks
your name in bold, `topics` uses the keys of `topics.json`, `viz` names the figure script in `public/js/visuals/papers/`.

## Design

`design/DESIGN.md` describes the design system (colours, type, components, figure contract).
Styles: `src/styles/global.css`. Figures and interactions: `public/js/`.

## Run locally

```sh
npm install
npm run dev        # http://localhost:4321
npm run build && npm run preview
```

## Deploy

Pushing to `main` builds and deploys via `.github/workflows/deploy.yml`, which also compiles the CV from Overleaf.
It needs two repository secrets: `OVERLEAF_TOKEN` (a dedicated Overleaf Git token: Overleaf > Account settings > Git integration) and `OVERLEAF_PROJECT_ID` (the id in the Overleaf project URL). If the compiled CV contains personal data (birth date, phone, private email), the build keeps the committed copy.
Without it the committed `public/cv.pdf` is used.
