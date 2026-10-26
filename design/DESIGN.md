# DESIGN.md — Simone Daniotti, academic site (approved v2)

Derived from the shipped mockup in `design/v2/` (`style.css`, `theme.js`, `abstracts.js`, `topics.js`,
`visuals/`). When this file and the code disagree, the code in `design/v2/` is the reference.

## 1. Character
Calm, plain, typographic academic site in the spirit of mathijsdv.com. Light ground, one centred column,
a serif voice for names and titles, a grotesk for everything else, one deep-red accent. No photographs
(the owner chose none). The paper figures are the only "live" element: small canvas animations
that explain each paper's idea and respond to the cursor.

## 2. Colour tokens
All colours live on `:root`. Dark values apply under `@media (prefers-color-scheme: dark)` on
`:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`. Nothing downstream uses a raw colour.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#f6f5f5` | `#151213` | page ground (neutral, very slightly rosy; not cream) |
| `--surface` | `#ece9e9` | `#1e1a1b` | one tone step: footer band, chip/button rest, hover fills |
| `--ink` | `#1b1617` | `#eee8e6` | all running text, headings, active chip fill |
| `--ink-soft` | `#5a5052` | `#b3a8a9` | secondary: co-authors, captions, terms, year labels on phone, tags |
| `--accent` | `#7d0c14` | `#b8222d` | deep red: timeline dot on hover/focus; reserved for a single primary action if one returns |
| `--accent-hover` | `#5e0910` | `#cf3540` | hover state of accent fills |
| `--accent-ink` | `#fbf8f7` | `#fff8f7` | text on accent |
| `--link` | `#7d0c14` | `#f08a90` | text links (DOI, profiles, footer) |
| `--focus` | `#7d0c14` | `#f08a90` | focus ring |
| `--selection` | `#e9cdd0` | `#5a1a20` | `::selection` background (text stays `--ink`) |
| `--viz-field` | `#ebe7e7` | `#221d1e` | figure background |
| `--viz-ink` | `#2a2224` | `#e6dfdd` | figure marks; mid = 55 %, dim = 26 % alpha of it |
| `--viz-hot` | `#7d0c14` | `#d9404b` | figure highlight (the thing the paper is about) |
| `--viz-hot-ink` | `#fbf8f7` | `#fff8f7` | marks drawn on top of `--viz-hot` |

`--viz-node / --viz-edge / --viz-on / --viz-edge-on` belong to the retired home-page network
(`visuals/diffusion.js`, no longer loaded); keep them only if that visual returns.

Rules: one accent; running text always full `--ink`; surfaces separated by a tone step, never a border
or shadow; the red appears on links, the active highlight in figures and the timeline dot, nowhere decorative.

## 3. Type
- Families (Google Fonts): **Newsreader** (opsz 6–72; 400, 500, italic 400) for display/serif roles;
  **Schibsted Grotesk** (400, 500, 600) for text and UI. Two families, no others.
- Steps:

| Token | Value | Used for |
|---|---|---|
| `--step-small` | 0.875rem (14px) | footer, chips, city buttons, paper tags |
| `--step-body` | clamp(1.0625rem, 1rem + 0.2vw, 1.1875rem) (17→19px) | body, nav, authors, venue |
| `--step-lead` | clamp(1.1875rem, 1.05rem + 0.5vw, 1.4375rem) (19→23px) | home position lines, course names |
| `--step-title` | clamp(1.375rem, 1.2rem + 0.5vw, 1.625rem) (22→26px) | paper titles, teaching institution |
| `--step-head` | clamp(1.875rem, 1.4rem + 1.6vw, 2.75rem) (30→44px) | "About" heading |
| `--step-display` | clamp(2rem, 1.1rem + 4vw, 5rem) (32→80px) | page h1 (name, Publications, Teaching) |

- Serif (Newsreader 400): h1s, "About", paper titles, institution names, wordmark (500, 21px / 19px phone).
  Display leading 1.04, tracking −0.022em; titles leading 1.3.
- Grotesk: body 400 at leading 1.55; emphasis 500; author self-name `<b>` 600; course name 600.
- Abstract text 16px (1rem), leading 1.6, max 62ch. Figure captions 16px `--ink-soft`.
- Numbers that align (years) use `font-variant-numeric: tabular-nums`.
- Paper titles keep the journal's capitalisation; long titles may wrap past two lines (real content).

## 4. Layout
- Column: `.wrap` = max-width `--max` 1030px + side padding `--m` clamp(16px, 4vw, 40px). Same margins everywhere.
- Gutter `--gap` clamp(24px, 4vw, 64px). Section spacing `--section` clamp(96px, 11vw, 160px).
- Page head: top padding clamp(56px, 9vw, 128px); h1 only (no intro sentence on Publications/Teaching).
- Home: h1 name → two position lines (lead) → "Fields: …" (body, `--ink-soft`) → Scholar · LinkedIn · CV links →
  About as a 1fr : 2fr grid (heading left, bio right, bio max 62ch) → footer.
- Publications row (`.pub`): grid `minmax(0,560px) | 1fr`, column gap clamp(28px, 4vw, 48px);
  ≤860px: `1.2fr | 1fr`; ≤640px: one column, figure above text. Rows 64–104px apart.
- Breakpoints in use: 1240px (timeline on/off), 860px (two-column → stacked About/Teaching, narrower rows),
  640px (paper rows stack), 520px (phone nav on two rows).
- Footer: full-width `--surface` band; Berkeley Haas link left, "Last updated <Month Year>" right. No email anywhere.

## 5. Components
**Nav.** Wordmark (serif, links home) left; Publications · Teaching · CV · theme toggle right. Current page
has `aria-current="page"` and a 1px underline; others underline on hover. ≤520px: wordmark on row 1, links
+ toggle on row 2 (toggle pushed right).

**Theme toggle.** 44×44 round icon button (moon in light, sun in dark; authored SVG, 1.6 stroke), `aria-label`
"Switch to dark/light mode". Follows `prefers-color-scheme` until clicked. The choice is stored in
`localStorage` (`sd-theme`, try/catch) **and** carried as `?theme=light|dark` on the current URL and on every
internal `.html` link, because `file://` pages do not share storage. An inline `<head>` snippet reads `?theme`
then storage before first paint (no flash) and sets `html.js`. `theme.js` dispatches `themechange`.

**Text links.** `--link` colour, underline 0.06em at 35 % opacity, full on hover.

**Chips / segmented buttons** (topic filters, city picker). Real `<button>`s, `aria-pressed`, pill radius,
min-height 40px (topics) / 36px (cities), 14px 500 text, rest `--surface`, active `--ink` fill with `--bg` text,
press scale 0.96. Rows wrap on narrow screens.

**Topic filter (Publications).** Under the h1. All · Generative AI · Software · Skills · Cities & economic geography ·
Mobility & networks · Physics. Multi-select OR: chips toggle; All is on when none selected and clears; deselecting
the last chip returns to All. State in the hash `#topic=a,b`. Paper tags under the venue line are `#topic=` links
that toggle the same topic and scroll the chips back into view. Filtered rows fade (180ms out, 320ms in, 50ms
stagger); empty years hide. `aria-live` line: "3 papers: Software or Skills". Without JS: chips `hidden`, all papers shown.

**Paper row.** Figure (+ caption) left; right: serif title (link to DOI/arXiv), authors (`--ink-soft`, S. Daniotti
bold `--ink`), "year · venue" (journal italic), topic tags, DOI/arXiv link, Abstract fold-out. Sorted newest first;
same-year order fixed. Papers without a public link show "Manuscript under review; no public link yet".

**Figure frame.** `<figure class="pfig">`: optional control row (`.pfig__ctl`) → stage (`.pfig__stage`, 16:10,
`--viz-field` ground, square corners, `tabindex="0"`, `role="img"`, descriptive `aria-label` ending in how to use it)
→ `<figcaption>` (16px `--ink-soft`, says what the figure shows and how to use it; flags schematics as such).
Readouts are drawn inside the canvas in 13–15px 500 grotesk `--viz-ink`, on a `--viz-field` patch where they
could overlap marks.

**Abstract fold-out.** Native `<details class="pub__abs"><summary>Abstract ⌄</summary>`, closed by default,
text verbatim from `design/ABSTRACTS.md`. `abstracts.js` animates height+opacity (220–520ms); the chevron rotates.
No toggle when no public abstract exists.

**Timeline (≥1240px).** One 1px line (`--ink` at 22 %) in the left margin, 48px left of the column, running the
full list; a 10px ring dot per paper (inset 2px `--ink-soft`; fills `--accent` on row hover/focus-within);
a sticky year label (`top: 28px`, right-aligned, 76px wide, 144px left of the column) per year group (`<h2>`).
Below 1240px the year is a small `--ink-soft` heading above its papers and there is no line.

**Teaching list.** One block per course, newest first. **Rule (owner): each course is its own block with its
institution shown on the course, not grouped under a shared institution heading.** Block = course name
(lead, 600) → institution / programme (`--ink-soft`) → role · terms (terms `--ink-soft`, tabular) → optional note.
Content only from the CV.

## 6. Motion
- Tokens: `--ease-out` cubic-bezier(0.22,1,0.36,1); press 140ms, hover 180ms, UI 260ms.
- Entrances: `[data-rise]` elements rise 20px + fade, 700/900ms, staggered with `--d` (60–90ms steps), once,
  via IntersectionObserver. Content is visible by default; only `html.js` hides it before the observer fires.
- Feedback: buttons scale 0.92–0.97 on press; link underlines fade in; toggle icon rotates −18° on hover.
- Transform and opacity only, plus height for the abstract.
- `prefers-reduced-motion: reduce`: no entrances (everything shown), no smooth scroll, abstract opens at once,
  filters swap without fades, figures show a still frame and redraw once per input (no drift, no easing).

## 7. Visuals contract
- Files: `visuals/core.js` (exposes `window.SDViz`), one file per paper in `visuals/papers/`
  (`code`, `hubs`, `coherence`, `blocks`, `rail`, `parking`, `qubit`), runner `visuals/pubs.js`.
  Classic scripts in that order (no ES modules; `file://` must work). In Astro, keep one module per visual.
- Register: `SDViz.register(kind, (W, H, rand, P, stage) => ({ draw(ctx, t, p) {} }))`.
  `W,H` CSS px; `rand` seeded RNG (same picture each visit); `P` live palette; `stage` the element
  (for figure-specific state via `data-*`, e.g. `data-city`, `data-draws`); `p = {x, y, on}` pointer in CSS px.
- Palette `P`: `field, ink, hot, hotInk, mid, dim, font` and `P.a(name, alpha)`; read from `--viz-*` tokens,
  refreshed on `themechange` and on `prefers-color-scheme` change. Never hard-code colours in a visual.
- Runner: canvas at devicePixelRatio ≤2; pre-warms 60 frames (140 with reduced motion) so the first paint
  already shows the idea; at rest runs at ⅓ speed / every 3rd frame; full speed while hovered, touched or focused;
  pauses off-screen (IntersectionObserver, 80px margin) and in hidden tabs; rebuilds on width change, theme change,
  `vizlayout` (filtering) and `vizredraw` (a control changed).
- Input: pointer and touch move `p`; arrow keys move a virtual pointer by 5 % steps; figure-specific keys
  (coherence: Enter/Space draws a pair) are handled by the visual's module. Controls live outside the
  `role="img"` stage as real buttons.
- Content honesty: figures illustrate the idea; schematic numbers are labelled ("illustrative coherence",
  "a schematic of the measure, not the paper's data"); quantitative claims only from the paper (e.g. 29 %).
- **Click action (owner rule, Oct 2026).** Every paper figure has ONE primary action on click / tap /
  Enter or Space, on top of hover. Hover explores; click *does* something that expresses a key mechanism or
  finding of that paper (its intervention, measure or comparison), never a decorative effect. The result
  persists until the next click or a reset (double-click or a small "Reset" button outside the stage), and the
  in-canvas readout reports it. Discoverable: `cursor: pointer` on the stage, and the caption ends with a short
  "Click to …" sentence. Honest: anything not from the paper is labelled illustrative; a click never navigates
  away. On touch, tap = the action and drag = explore (do not fire on a drag). Each new or changed click action
  is proposed to the orchestrator for owner confirmation before it is built.
  API: a maker may return `click(pt, t)` and `reset(t)` next to `draw`. `pubs.js` calls `click` on a tap/click
  that moved <10px within 700ms, or on Enter/Space (pt = virtual pointer, else centre with `pt.kb = true`);
  `reset` on double-click, Escape, or the Reset button it adds top-right of the figure after a click. With reduced
  motion the runner advances 160 silent frames so only the end state shows. A theme change only repaints, so
  click results survive it; a width change rebuilds the figure and clears them.
- Coherence figure: 21 occupations with line pictograms in one stroke style, organic layout in five soft clusters,
  link weight = relatedness, cities Detroit / Hartford / San Jose / Fresno / New York with illustrative mixes;
  pairs are always two different jobs.

## 8. Accessibility
- One `h1` per page; a heading for every section (year groups are `<h2>`); skip link (clip-hidden until focus).
- Visible focus everywhere: 2px `--focus` outline, 4px offset (3px on figures).
- All controls are real `<a>`/`<button>`/`<summary>` with accessible names; state via `aria-pressed`,
  `aria-current`, native `open`.
- Touch targets ≥36px (chips 40px, toggle 44px).
- Contrast: body and secondary text pass AA in both modes; link red is lightened in dark mode for that reason.
- Every figure has a full-sentence `aria-label`; filter results are announced via `aria-live="polite"`.
- `[hidden] { display: none !important }` so hiding always wins over component display rules.

## 9. Deliberate exceptions to the Taste house rules
| Rule | Where | Reason |
|---|---|---|
| few-pictures / no-footage | all pages | Owner chose no photographs; figures are drawn, not photographed. |
| still-page | home, teaching | Owner asked for a plain, calm home and a quiet typographic teaching list. |
| hairline | timeline line | Owner explicitly asked for a vertical timeline line. |
| off-centre | publications ≥1240px | Year labels and line sit in the left margin by request. |
| name-only-title (warn) | Publications, Teaching | Owner removed the intro sentence; nav context names the page. |
| shadow | `.pub::before` ring | Inset box-shadow draws the dot's ring, not a shadow (marked `taste-skill-ignore`). |
| headline length | paper titles | Real titles; not shortened. |
| small label above heading | none | No eyebrows anywhere; kept. |
