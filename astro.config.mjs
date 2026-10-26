import { defineConfig } from 'astro/config';

// GitHub Pages user site: https://simonedaniotti.github.io (custom domain later via public/CNAME)
export default defineConfig({
  site: 'https://simonedaniotti.github.io',
  // emit publications.html / teaching.html so the page links (and the ?theme carry-over in theme.js) stay as in the approved design
  build: { format: 'file' },
  trailingSlash: 'ignore',
});
