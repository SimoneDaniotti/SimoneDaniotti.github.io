/* Paper: Systemic risk approach to mitigate delay cascading in railway networks (npj SMT 2024)
   A delay at one station cascades along the lines. Hover a station to delay it.
   Click a station: add the paper's intervention there, a short extra service that absorbs delays. The cascade
   from the same starting delay replays, and the readout compares delayed stations without and with the services
   (up to three; numbers come from this toy network, not the paper). */
(() => {
  const { clamp } = SDViz;
  const PASS = 0.78, PASS_BUFFERED = 0.38;
  SDViz.register('rail', (W, H, r, P) => {
    const nodes = [], edges = [];
    const lines = 4, per = 9;
    const k = clamp(Math.min(W, H) / 250, 1, 2);
    for (let l = 0; l < lines; l++) {
      for (let i = 0; i < per; i++) {
        const x = W * (0.07 + 0.86 * i / (per - 1));
        const y = H * (0.16 + 0.6 * l / (lines - 1)) + Math.sin(i * 0.9 + l * 2) * H * 0.06;
        nodes.push({ x, y, d: 0, nd: 0, line: l });
        if (i) edges.push([l * per + i - 1, l * per + i]);
      }
    }
    for (let e = 0; e < 7; e++) { const l = Math.floor(r() * (lines - 1)); const i = Math.floor(r() * per); edges.push([l * per + i, (l + 1) * per + clamp(i + Math.floor(r() * 3) - 1, 0, per - 1)]); }
    const adj = nodes.map(() => []);
    edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });

    let buffers = [];            /* stations with an extra service, oldest first */
    let seed = Math.floor(nodes.length / 2) + 2, result = null, replayUntil = -1e9;
    let last = -1e9, lastNear = -1, lastHit = -1e9;

    /* one step of the cascade; an extra service at either end of a link damps what it passes on */
    const step = (d, buf) => {
      const nd = d.map((v, i) => {
        let m = v;
        for (const j of adj[i]) m = Math.max(m, d[j] * (buf.has(i) || buf.has(j) ? PASS_BUFFERED : PASS));
        return Math.max(v * 0.97, m * 0.94);
      });
      return nd.map((v) => (v < 0.04 ? 0 : v));
    };
    const simulate = (s, buf) => {
      let d = nodes.map(() => 0); d[s] = 1;
      const ever = new Set([s]);
      for (let i = 0; i < 400 && d.some((v) => v > 0); i++) { d = step(d, buf); d.forEach((v, j) => { if (v > 0.12) ever.add(j); }); }
      return ever.size;
    };
    const start = (i) => { nodes[i].d = 1; seed = i; };

    return {
      draw(ctx, t, p) {
        ctx.clearRect(0, 0, W, H);
        const buf = new Set(buffers);
        const replaying = t < replayUntil;
        let near = -1;
        if (p.on) { let bd = (40 * k) ** 2; nodes.forEach((n, i) => { const d = (n.x - p.x) ** 2 + (n.y - p.y) ** 2; if (d < bd) { bd = d; near = i; } }); }
        if (!replaying) {
          if (near >= 0) { if (near !== lastNear || t - lastHit > 1400) { start(near); lastHit = t; } }
          else if (!p.on && t - last > 3200) { start(Math.floor(Math.random() * nodes.length)); last = t; }
        }
        lastNear = near;
        const nd = step(nodes.map((n) => n.d), buf);
        nodes.forEach((n, i) => { n.d = nd[i]; });

        ctx.lineWidth = 2 * k;
        edges.forEach(([a, b]) => {
          const v = Math.max(nodes[a].d, nodes[b].d);
          ctx.strokeStyle = v > 0.12 ? P.a('hot', 0.25 + v * 0.65) : P.a('ink', 0.2);
          ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
        });
        /* the extra services: a short parallel track beside the station */
        buffers.forEach((i) => {
          const n = nodes[i], o = nodes[i % per < per - 1 ? i + 1 : i - 1];
          const dx = o.x - n.x, dy = o.y - n.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
          const off = 9 * k, half = Math.min(L * 0.45, 26 * k);
          ctx.strokeStyle = P.ink; ctx.lineWidth = 3 * k; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(n.x - ux * half - uy * off, n.y - uy * half + ux * off); ctx.lineTo(n.x + ux * half - uy * off, n.y + uy * half + ux * off); ctx.stroke();
          ctx.lineCap = 'butt';
        });
        let late = 0;
        nodes.forEach((n, i) => {
          const on = n.d > 0.12; if (on) late++;
          ctx.beginPath(); ctx.arc(n.x, n.y, (3.5 + n.d * 4) * k, 0, 6.28);
          if (on) { ctx.fillStyle = P.hot; ctx.fill(); }
          else { ctx.fillStyle = P.field; ctx.fill(); ctx.strokeStyle = P.mid; ctx.lineWidth = 1.6 * k; ctx.stroke(); }
          if (buf.has(i)) { ctx.beginPath(); ctx.arc(n.x, n.y, (3.5 + n.d * 4) * k + 4 * k, 0, 6.28); ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6 * k; ctx.stroke(); }
          if (replaying && i === seed) { ctx.beginPath(); ctx.arc(n.x, n.y, 13 * k, 0, 6.28); ctx.strokeStyle = P.hot; ctx.lineWidth = 1.6 * k; ctx.stroke(); }
        });
        const rf = Math.round(clamp(13 * k * 0.9, 12, 15));
        ctx.font = `500 ${rf}px ${P.font}`;
        const msg = result
          ? `Same delay: ${result.before} stations delayed → ${result.after} with ${result.n} extra service${result.n > 1 ? 's' : ''}`
          : W > 480 ? `${late} of ${nodes.length} stations delayed` : '';
        if (msg) {
          const mw = ctx.measureText(msg).width;
          ctx.fillStyle = P.field; ctx.fillRect(8, H - rf - 18, mw + 16, rf + 12);
          ctx.fillStyle = P.ink; ctx.fillText(msg, 16, H - 12);
        }
      },
      click(pt, t) {
        let s = 0, bd = Infinity;
        nodes.forEach((n, i) => { const d = Math.hypot(n.x - pt.x, n.y - pt.y); if (d < bd) { bd = d; s = i; } });
        if (pt.kb) s = (buffers.length ? buffers[buffers.length - 1] + 5 : 11) % nodes.length;
        if (!buffers.includes(s)) { buffers.push(s); if (buffers.length > 3) buffers.shift(); }
        const before = simulate(seed, new Set()), after = simulate(seed, new Set(buffers));
        result = { before, after, n: buffers.length };
        nodes.forEach((n) => { n.d = 0; }); nodes[seed].d = 1;
        replayUntil = t + 4000;
      },
      reset() { buffers = []; result = null; replayUntil = -1e9; nodes.forEach((n) => { n.d = 0; }); },
    };
  });
})();
