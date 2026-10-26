/* Shared helpers for the paper figures. Classic script (works from file://); exposes window.SDViz.
   Each paper registers a maker: SDViz.register(kind, (W, H, rand, P) => ({ draw(ctx, t, p) {} })).
   P is the live palette read from CSS tokens; it is updated in place when the theme changes. */
window.SDViz = (() => {
  'use strict';
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = (r) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const makers = {};
  const register = (kind, maker) => { makers[kind] = maker; };

  const probe = document.createElement('canvas').getContext('2d');
  const toRGB = (c) => {
    probe.fillStyle = '#000'; probe.fillStyle = (c || '').trim() || '#000';
    const s = probe.fillStyle;
    if (s[0] === '#') return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
    return s.match(/[\d.]+/g).slice(0, 3).map(Number);
  };
  const P = {};
  const rgb = {};
  const cache = new Map();
  /* P.a('ink', 0.3) → rgba string of a token at an alpha */
  P.a = (name, alpha) => {
    const k = name + (Math.round(alpha * 100));
    let v = cache.get(k);
    if (!v) { const c = rgb[name]; v = `rgba(${c[0]},${c[1]},${c[2]},${(Math.round(alpha * 100) / 100).toFixed(2)})`; cache.set(k, v); }
    return v;
  };
  const refresh = () => {
    const cs = getComputedStyle(document.documentElement);
    for (const [name, token] of [['field', '--viz-field'], ['ink', '--viz-ink'], ['hot', '--viz-hot'], ['hotInk', '--viz-hot-ink']]) {
      rgb[name] = toRGB(cs.getPropertyValue(token));
      P[name] = `rgb(${rgb[name].join(',')})`;
    }
    cache.clear();
    P.mid = P.a('ink', 0.55);
    P.dim = P.a('ink', 0.26);
    P.font = getComputedStyle(document.body).fontFamily;
  };
  refresh();
  return { rng, gauss, clamp, makers, register, P, refresh };
})();
