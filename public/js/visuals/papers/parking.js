/* Paper: A maximum entropy approach for the modelling of car-sharing parking dynamics (Sci Rep 2023)
   Cars park where a maximum-entropy model puts demand: p(spot) ∝ Σ exp(−distance to demand / λ).
   Hover moves a passing demand point. Click drops a lasting demand hotspot (up to three); cars redistribute by
   the same rule and the readout compares the share of parked cars within reach before and after. */
(() => {
  const { clamp } = SDViz;
  SDViz.register('parking', (W, H, r, P) => {
    const spots = [];
    const bx = 6, by = 4;
    const u = Math.min(W / 400, H / 250);
    for (let i = 0; i < bx; i++) for (let j = 0; j < by; j++) {
      const x0 = W * (0.06 + i * 0.152), y0 = H * (0.1 + j * 0.215);
      for (let k = 0; k < 5; k++) spots.push({ x: x0 + k * W * 0.024 + W * 0.012, y: y0 + H * 0.12, car: r() < 0.35 });
    }
    const cars = Array.from({ length: 14 }, () => ({ x: r() * W, y: r() * H, to: Math.floor(r() * spots.length) }));
    const lam = Math.min(W, H) * 0.22;
    let hot = [], before = null, fx = W / 2, fy = H / 2;
    const demand = (p) => (hot.length ? hot.concat(p.on ? [{ x: p.x, y: p.y }] : []) : [{ x: fx, y: fy }]);
    const nearShare = () => {
      let n = 0, m = 0;
      for (const s of spots) if (s.car) { m++; if (hot.some((h) => Math.hypot(s.x - h.x, s.y - h.y) < lam)) n++; }
      return m ? n / m : 0;
    };
    return {
      draw(ctx, t, p) {
        ctx.clearRect(0, 0, W, H);
        fx = p.on ? p.x : W * (0.5 + 0.35 * Math.sin(t * 0.0004)); fy = p.on ? p.y : H * (0.5 + 0.3 * Math.cos(t * 0.0006));
        ctx.fillStyle = P.a('ink', 0.06);
        for (let i = 0; i < bx; i++) for (let j = 0; j < by; j++) ctx.fillRect(W * (0.05 + i * 0.152), H * (0.08 + j * 0.215), W * 0.135, H * 0.17);
        /* lasting hotspots: a flat disc of reach λ */
        for (const h of hot) {
          ctx.fillStyle = P.a('hot', 0.08); ctx.beginPath(); ctx.arc(h.x, h.y, lam, 0, 6.283); ctx.fill();
          ctx.strokeStyle = P.a('hot', 0.5); ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = P.hot; ctx.beginPath(); ctx.arc(h.x, h.y, 5 * Math.max(1, u * 0.8), 0, 6.283); ctx.fill();
        }
        const D = demand(p);
        const pick = () => {
          let tot = 0; const w = spots.map((s) => { if (s.car) return 0; let v = 0; for (const d of D) v += Math.exp(-Math.hypot(s.x - d.x, s.y - d.y) / lam); tot += v; return v; });
          let q = Math.random() * tot; for (let i = 0; i < w.length; i++) { q -= w[i]; if (q <= 0) return i; } return 0;
        };
        let near = 0, parked = 0;
        spots.forEach((s) => {
          if (s.car) { parked++; if (Math.hypot(s.x - fx, s.y - fy) < lam) near++; }
          ctx.fillStyle = s.car ? P.ink : P.dim; ctx.fillRect(s.x - 4 * u, s.y - 6 * u, 8 * u, 12 * u);
        });
        for (const c of cars) {
          const s = spots[c.to];
          c.x += (s.x - c.x) * 0.07; c.y += (s.y - c.y) * 0.07;
          if (Math.hypot(s.x - c.x, s.y - c.y) < 1) {
            s.car = true;
            const occ = spots.filter((q) => q.car); const lv = occ[Math.floor(Math.random() * occ.length)]; lv.car = false;
            c.x = lv.x; c.y = lv.y; c.to = pick();
          }
          ctx.fillStyle = P.hot; ctx.beginPath(); ctx.arc(c.x, c.y, 3.6 * Math.max(1, u * 0.8), 0, 6.28); ctx.fill();
        }
        const rf = Math.round(clamp(13 * u, 12, 15));
        ctx.font = `500 ${rf}px ${P.font}`;
        const lbl = hot.length
          ? `Parked near demand: ${Math.round(before * 100)}% → ${Math.round(nearShare() * 100)}%`
          : W > 480 ? `${near} of ${parked} parked cars sit near demand` : '';
        if (lbl) {
          const tw = ctx.measureText(lbl).width;
          ctx.fillStyle = P.field; ctx.fillRect(8, H - rf - 18, tw + 16, rf + 12); ctx.fillStyle = P.ink; ctx.fillText(lbl, 16, H - 12);
        }
      },
      click(pt) {
        hot.push({ x: pt.x, y: pt.y }); if (hot.length > 3) hot.shift();
        before = nearShare();
      },
      reset() { hot = []; before = null; },
    };
  });
})();
