/* Paper: The building blocks of software work (under review, Nature Communications)
   A grid of building blocks; moving across it traces a career that combines them.
   Click: "predict the next job". The blocks lit along the traced career fly together and are classified into a
   likely future occupation, shown with a pictogram in the coherence figure's style. The mapping from block
   regions to occupations is illustrative. */
(() => {
  const { clamp } = SDViz;
  const line = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
  const icons = {
    web(c, s) { line(c, [[-s * 0.85, -s * 0.6], [s * 0.85, -s * 0.6], [s * 0.85, s * 0.6], [-s * 0.85, s * 0.6], [-s * 0.85, -s * 0.6]]); line(c, [[-s * 0.85, -s * 0.28], [s * 0.85, -s * 0.28]]);
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-s * 0.62 + i * s * 0.2, -s * 0.44, s * 0.05, 0, 6.283); c.stroke(); } },
    devops(c, s) { c.beginPath(); c.arc(-s * 0.4, 0, s * 0.38, 0.6, 6.283 - 0.6); c.stroke(); c.beginPath(); c.arc(s * 0.4, 0, s * 0.38, Math.PI + 0.6, Math.PI - 0.6 + 6.283); c.stroke();
      line(c, [[-s * 0.1, -s * 0.2], [s * 0.1, s * 0.2]]); line(c, [[-s * 0.1, s * 0.2], [s * 0.1, -s * 0.2]]); },
    data(c, s) { c.beginPath(); c.ellipse(0, -s * 0.55, s * 0.65, s * 0.22, 0, 0, 6.283); c.stroke();
      line(c, [[-s * 0.65, -s * 0.55], [-s * 0.65, s * 0.55]]); line(c, [[s * 0.65, -s * 0.55], [s * 0.65, s * 0.55]]);
      c.beginPath(); c.ellipse(0, s * 0.55, s * 0.65, s * 0.22, 0, 0, Math.PI); c.stroke(); c.beginPath(); c.ellipse(0, 0, s * 0.65, s * 0.22, 0, 0, Math.PI); c.stroke(); },
    ml(c, s) { const L = [[-s * 0.7, -s * 0.5], [-s * 0.7, s * 0.5], [0, -s * 0.7], [0, 0], [0, s * 0.7], [s * 0.7, 0]];
      for (const a of [0, 1]) for (const b of [2, 3, 4]) line(c, [L[a], L[b]]); for (const b of [2, 3, 4]) line(c, [L[b], L[5]]);
      for (const [x, y] of L) { c.beginPath(); c.arc(x, y, s * 0.13, 0, 6.283); c.stroke(); } },
    sci(c, s) { line(c, [[-s * 0.8, -s * 0.8], [-s * 0.8, s * 0.7], [s * 0.85, s * 0.7]]); line(c, [[-s * 0.6, s * 0.4], [-s * 0.2, -s * 0.05], [s * 0.15, s * 0.15], [s * 0.7, -s * 0.6]]); },
  };
  const JOBS = { web: 'Web developer', devops: 'DevOps engineer', data: 'Data engineer', ml: 'ML engineer', sci: 'Scientific programmer' };
  /* illustrative mapping: where the traced career sits on the grid */
  const classify = (cx, cy, cols, rows) => (cx < cols * 0.36 ? (cy < rows / 2 ? 'web' : 'devops') : cx < cols * 0.64 ? 'data' : (cy < rows / 2 ? 'ml' : 'sci'));

  SDViz.register('blocks', (W, H, r, P) => {
    const cols = 14, rows = 8, gx = W / (cols + 1), gy = H / (rows + 1), sz = Math.min(gx, gy) * 0.56;
    const cells = Array.from({ length: cols * rows }, () => ({ v: r() * 0.25, pop: r() }));
    const path = [];
    const k = clamp(Math.min(W / 560, H / 350), 0.62, 1.6);
    const pos = (id) => ({ x: (id % cols + 1) * gx, y: (Math.floor(id / cols) + 1) * gy });
    let result = null;
    return {
      draw(ctx, t, p) {
        ctx.clearRect(0, 0, W, H);
        const px = p.on ? p.x : W * (0.5 + 0.38 * Math.sin(t * 0.0005));
        const py = p.on ? p.y : H * (0.5 + 0.3 * Math.sin(t * 0.0008 + 2));
        const ci = clamp(Math.round(px / gx - 1), 0, cols - 1), ri = clamp(Math.round(py / gy - 1), 0, rows - 1);
        const id = ri * cols + ci;
        if (path[path.length - 1] !== id) { path.push(id); if (path.length > 7) path.shift(); }
        path.forEach((c, i) => { cells[c].v = Math.min(1, cells[c].v + 0.02 * (i + 1) / path.length); });
        cells.forEach((c, i) => {
          c.v = Math.max(c.pop * 0.25, c.v - 0.002);
          const { x, y } = pos(i);
          ctx.fillStyle = P.a('ink', 0.1 + c.v * 0.8);
          ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        });
        ctx.strokeStyle = P.hot; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
        path.forEach((c, i) => { const { x, y } = pos(c); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
        ctx.fillStyle = P.hot;
        path.forEach((c) => { const { x, y } = pos(c); ctx.fillRect(x - sz * 0.28, y - sz * 0.28, sz * 0.56, sz * 0.56); });

        const rf = Math.round(clamp(13 * k, 12, 15));
        ctx.font = `500 ${rf}px ${P.font}`;
        if (result) {
          const u = clamp((t - result.t0) / 700, 0, 1), e = 1 - Math.pow(1 - u, 3);
          const R = 15 * k, cx = 12 * k + R, cy = H - 12 * k - R;
          if (u < 1) for (const c of result.from) {
            ctx.fillStyle = P.hot;
            const s2 = sz * 0.6 * (1 - e) + 3;
            ctx.fillRect(c.x + (cx - c.x) * e - s2 / 2, c.y + (cy - c.y) * e - s2 / 2, s2, s2);
          }
          if (u > 0.55) {
            const a = clamp((u - 0.55) / 0.45, 0, 1);
            ctx.globalAlpha = a;
            const msg = `Likely next role: ${JOBS[result.job]}`;
            const mw = ctx.measureText(msg).width;
            ctx.fillStyle = P.field; ctx.fillRect(6 * k, cy - R - 6 * k, 2 * R + mw + 26 * k, 2 * R + 12 * k);
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fillStyle = P.hot; ctx.fill();
            ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = P.hotInk; ctx.lineWidth = 1.4 * k; ctx.lineJoin = 'round'; icons[result.job](ctx, R * 0.62); ctx.restore();
            ctx.fillStyle = P.ink; ctx.fillText(msg, cx + R + 10 * k, cy + rf * 0.35);
            ctx.globalAlpha = 1;
          }
        } else if (W > 480) {
          const used = cells.filter((c) => c.v > 0.6).length;
          const lbl = `${used} blocks in heavy use`;
          const tw = ctx.measureText(lbl).width;
          ctx.fillStyle = P.field; ctx.fillRect(10, H - 34, tw + 16, 26); ctx.fillStyle = P.ink; ctx.fillText(lbl, 18, H - 16);
        }
      },
      click(pt, t) {
        const pts = path.map(pos);
        const cx = path.reduce((s, c) => s + (c % cols), 0) / path.length, cy = path.reduce((s, c) => s + Math.floor(c / cols), 0) / path.length;
        result = { from: pts, job: classify(cx, cy, cols, rows), t0: t };
      },
      reset() { result = null; },
    };
  });
})();
