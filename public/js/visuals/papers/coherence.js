/* Paper: The coherence of US cities (PNAS 2025) — "Two random workers".
   A schematic of the measure, not the paper's data. Occupations sit in an organic relatedness network (soft
   clusters, thicker links = more related). Pick a city: node size shows each job's share of local workers in an
   ILLUSTRATIVE mix based only on the city's well-known specialisation. Each draw picks two random workers by
   those shares, highlights the shortest path between their jobs and reports its length d; the running mean
   over draws gives an illustrative coherence (1 − mean d). */
(() => {
  const { clamp } = SDViz;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- pictograms: one stroke style, drawn in a box of half-size s around (0,0) ---------- */
  const line = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
  const icons = {
    gear(c, s) { c.beginPath(); c.arc(0, 0, s * 0.5, 0, 6.283); c.stroke(); c.beginPath(); c.arc(0, 0, s * 0.18, 0, 6.283); c.stroke();
      for (let i = 0; i < 8; i++) { const a = i * 0.785; line(c, [[Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5], [Math.cos(a) * s * 0.82, Math.sin(a) * s * 0.82]]); } },
    wrench(c, s) { line(c, [[-s * 0.7, s * 0.7], [s * 0.2, -s * 0.2]]); c.beginPath(); c.arc(s * 0.42, -s * 0.42, s * 0.32, 3.1, 3.1 + 4.9); c.stroke(); },
    caliper(c, s) { line(c, [[-s * 0.8, -s * 0.5], [s * 0.8, -s * 0.5]]); line(c, [[-s * 0.6, -s * 0.5], [-s * 0.6, s * 0.7]]); line(c, [[s * 0.1, -s * 0.5], [s * 0.1, s * 0.7]]);
      for (let i = 0; i < 4; i++) line(c, [[-s * 0.4 + i * s * 0.3, -s * 0.5], [-s * 0.4 + i * s * 0.3, -s * 0.3]]); },
    spark(c, s) { c.beginPath(); c.arc(0, 0, s * 0.2, 0, 6.283); c.stroke();
      for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.3; line(c, [[Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42], [Math.cos(a) * s * 0.85, Math.sin(a) * s * 0.85]]); } },
    hammer(c, s) { line(c, [[-s * 0.55, s * 0.75], [s * 0.2, -s * 0.15]]); line(c, [[-s * 0.1, -s * 0.6], [s * 0.55, s * 0.05]]); line(c, [[-s * 0.1, -s * 0.6], [s * 0.05, -s * 0.75]]); line(c, [[s * 0.55, s * 0.05], [s * 0.72, -s * 0.1]]); },
    saw(c, s) { line(c, [[-s * 0.85, -s * 0.15], [s * 0.6, -s * 0.15], [s * 0.6, s * 0.15]]);
      const pts = [[s * 0.6, s * 0.15]]; for (let i = 0; i < 6; i++) { pts.push([s * 0.6 - (i + 0.5) * s * 0.24, s * 0.4]); pts.push([s * 0.6 - (i + 1) * s * 0.24, s * 0.15]); } line(c, pts); },
    wheat(c, s) { line(c, [[0, s * 0.85], [0, -s * 0.8]]); for (let i = 0; i < 3; i++) { const y = -s * 0.55 + i * s * 0.38; line(c, [[0, y + s * 0.2], [-s * 0.38, y - s * 0.05]]); line(c, [[0, y + s * 0.2], [s * 0.38, y - s * 0.05]]); } },
    fork(c, s) { line(c, [[0, s * 0.85], [0, -s * 0.2]]); line(c, [[-s * 0.45, -s * 0.8], [-s * 0.45, -s * 0.2], [s * 0.45, -s * 0.2], [s * 0.45, -s * 0.8]]); line(c, [[0, -s * 0.2], [0, -s * 0.8]]); },
    mill(c, s) { line(c, [[-s * 0.3, s * 0.85], [-s * 0.15, 0], [s * 0.15, 0], [s * 0.3, s * 0.85]]); line(c, [[-s * 0.65, -s * 0.65], [s * 0.65, s * 0.65]]); line(c, [[s * 0.65, -s * 0.65], [-s * 0.65, s * 0.65]]); },
    bread(c, s) { c.beginPath(); c.moveTo(-s * 0.85, s * 0.45); c.quadraticCurveTo(-s * 0.85, -s * 0.6, 0, -s * 0.6); c.quadraticCurveTo(s * 0.85, -s * 0.6, s * 0.85, s * 0.45); c.closePath(); c.stroke();
      for (let i = -1; i <= 1; i++) line(c, [[i * s * 0.32 - s * 0.1, s * 0.1], [i * s * 0.32 + s * 0.1, -s * 0.25]]); },
    tag(c, s) { line(c, [[-s * 0.8, -s * 0.45], [s * 0.35, -s * 0.45], [s * 0.85, 0], [s * 0.35, s * 0.45], [-s * 0.8, s * 0.45], [-s * 0.8, -s * 0.45]]); c.beginPath(); c.arc(s * 0.3, 0, s * 0.1, 0, 6.283); c.stroke(); },
    doc(c, s) { line(c, [[-s * 0.55, -s * 0.8], [s * 0.55, -s * 0.8], [s * 0.55, s * 0.8], [-s * 0.55, s * 0.8], [-s * 0.55, -s * 0.8]]); for (let i = 0; i < 3; i++) line(c, [[-s * 0.3, -s * 0.35 + i * s * 0.35], [s * 0.3, -s * 0.35 + i * s * 0.35]]); },
    ledger(c, s) { line(c, [[0, -s * 0.5], [0, s * 0.7]]); line(c, [[0, -s * 0.5], [-s * 0.85, -s * 0.65], [-s * 0.85, s * 0.55], [0, s * 0.7], [s * 0.85, s * 0.55], [s * 0.85, -s * 0.65], [0, -s * 0.5]]); },
    calc(c, s) { line(c, [[-s * 0.6, -s * 0.85], [s * 0.6, -s * 0.85], [s * 0.6, s * 0.85], [-s * 0.6, s * 0.85], [-s * 0.6, -s * 0.85]]); line(c, [[-s * 0.35, -s * 0.55], [s * 0.35, -s * 0.55], [s * 0.35, -s * 0.25], [-s * 0.35, -s * 0.25], [-s * 0.35, -s * 0.55]]);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { c.beginPath(); c.arc(-s * 0.2 + j * s * 0.4, s * 0.15 + i * s * 0.4, s * 0.06, 0, 6.283); c.stroke(); } },
    scales(c, s) { line(c, [[0, -s * 0.8], [0, s * 0.8]]); line(c, [[-s * 0.4, s * 0.8], [s * 0.4, s * 0.8]]); line(c, [[-s * 0.75, -s * 0.5], [s * 0.75, -s * 0.5]]);
      for (const x of [-s * 0.75, s * 0.75]) { line(c, [[x, -s * 0.5], [x - s * 0.25, s * 0.15]]); line(c, [[x, -s * 0.5], [x + s * 0.25, s * 0.15]]); line(c, [[x - s * 0.3, s * 0.15], [x + s * 0.3, s * 0.15]]); } },
    code(c, s) { line(c, [[-s * 0.35, -s * 0.5], [-s * 0.8, 0], [-s * 0.35, s * 0.5]]); line(c, [[s * 0.35, -s * 0.5], [s * 0.8, 0], [s * 0.35, s * 0.5]]); line(c, [[s * 0.15, -s * 0.6], [-s * 0.15, s * 0.6]]); },
    compass(c, s) { c.beginPath(); c.arc(0, -s * 0.6, s * 0.16, 0, 6.283); c.stroke(); line(c, [[-s * 0.08, -s * 0.45], [-s * 0.6, s * 0.85]]); line(c, [[s * 0.08, -s * 0.45], [s * 0.6, s * 0.85]]); line(c, [[-s * 0.38, s * 0.3], [s * 0.38, s * 0.3]]); },
    flask(c, s) { line(c, [[-s * 0.2, -s * 0.85], [-s * 0.2, -s * 0.25], [-s * 0.7, s * 0.8], [s * 0.7, s * 0.8], [s * 0.2, -s * 0.25], [s * 0.2, -s * 0.85]]); line(c, [[-s * 0.35, -s * 0.85], [s * 0.35, -s * 0.85]]); line(c, [[-s * 0.45, s * 0.3], [s * 0.45, s * 0.3]]); },
    cap(c, s) { line(c, [[-s * 0.9, -s * 0.2], [0, -s * 0.6], [s * 0.9, -s * 0.2], [0, s * 0.2], [-s * 0.9, -s * 0.2]]); line(c, [[-s * 0.5, 0], [-s * 0.5, s * 0.5], [s * 0.5, s * 0.5], [s * 0.5, 0]]); line(c, [[s * 0.9, -s * 0.2], [s * 0.9, s * 0.45]]); },
    cross(c, s) { line(c, [[-s * 0.25, -s * 0.75], [s * 0.25, -s * 0.75], [s * 0.25, -s * 0.25], [s * 0.75, -s * 0.25], [s * 0.75, s * 0.25], [s * 0.25, s * 0.25], [s * 0.25, s * 0.75], [-s * 0.25, s * 0.75], [-s * 0.25, s * 0.25], [-s * 0.75, s * 0.25], [-s * 0.75, -s * 0.25], [-s * 0.25, -s * 0.25], [-s * 0.25, -s * 0.75]]); },
    stetho(c, s) { c.beginPath(); c.moveTo(-s * 0.55, -s * 0.8); c.lineTo(-s * 0.55, -s * 0.1); c.quadraticCurveTo(-s * 0.55, s * 0.45, 0, s * 0.45); c.quadraticCurveTo(s * 0.55, s * 0.45, s * 0.55, -s * 0.1); c.lineTo(s * 0.55, -s * 0.8); c.stroke();
      line(c, [[0, s * 0.45], [0, s * 0.6]]); c.beginPath(); c.arc(0, s * 0.75, s * 0.16, 0, 6.283); c.stroke(); },
  };

  /* ---------- occupations: name, position (unit square), pictogram, cluster ---------- */
  const OCC = [
    ['toolmaker', 0.10, 0.28, 'caliper', 'metal'], ['welder', 0.24, 0.17, 'spark', 'metal'], ['machinist', 0.20, 0.42, 'gear', 'metal'],
    ['blacksmith', 0.08, 0.53, 'hammer', 'metal'], ['mechanic', 0.32, 0.53, 'wrench', 'metal'], ['carpenter', 0.37, 0.31, 'saw', 'metal'],
    ['farmer', 0.06, 0.84, 'wheat', 'farm'], ['farm labourer', 0.2, 0.68, 'fork', 'farm'], ['miller', 0.30, 0.82, 'mill', 'farm'],
    ['baker', 0.42, 0.73, 'bread', 'farm'], ['shopkeeper', 0.53, 0.84, 'tag', 'farm'],
    ['clerk', 0.52, 0.17, 'doc', 'office'], ['bookkeeper', 0.66, 0.11, 'ledger', 'office'], ['accountant', 0.81, 0.25, 'calc', 'office'],
    ['lawyer', 0.93, 0.13, 'scales', 'office'],
    ['engineer', 0.49, 0.43, 'compass', 'tech'], ['programmer', 0.64, 0.35, 'code', 'tech'], ['chemist', 0.74, 0.53, 'flask', 'tech'],
    ['teacher', 0.61, 0.67, 'cap', 'care'], ['physician', 0.89, 0.48, 'stetho', 'care'], ['nurse', 0.86, 0.75, 'cross', 'care'],
  ];
  const idx = Object.fromEntries(OCC.map((o, i) => [o[0], i]));
  /* [a, b, relatedness 1–3] */
  const LINKS = [
    ['toolmaker', 'machinist', 3], ['machinist', 'welder', 2], ['welder', 'toolmaker', 2], ['machinist', 'mechanic', 3],
    ['blacksmith', 'toolmaker', 2], ['blacksmith', 'machinist', 2], ['welder', 'carpenter', 1], ['carpenter', 'mechanic', 1],
    ['farmer', 'farm labourer', 3], ['farm labourer', 'miller', 2], ['farmer', 'blacksmith', 1], ['miller', 'baker', 2],
    ['baker', 'shopkeeper', 2], ['clerk', 'bookkeeper', 3], ['bookkeeper', 'accountant', 3], ['accountant', 'lawyer', 2],
    ['clerk', 'accountant', 1], ['shopkeeper', 'teacher', 1], ['engineer', 'programmer', 2], ['engineer', 'chemist', 2],
    ['programmer', 'chemist', 1], ['mechanic', 'engineer', 2], ['carpenter', 'engineer', 1], ['programmer', 'accountant', 1],
    ['physician', 'nurse', 3], ['chemist', 'physician', 2], ['teacher', 'nurse', 1], ['teacher', 'chemist', 1], ['lawyer', 'physician', 1],
    ['clerk', 'carpenter', 1],
  ].map(([a, b, w]) => [idx[a], idx[b], w]);

  /* illustrative mixes (relative shares of local workers), from each city's well-known specialisation only */
  const CITIES = {
    detroit: { label: 'Detroit', mix: { machinist: 6, toolmaker: 5, welder: 4, mechanic: 6, engineer: 3, blacksmith: 1, carpenter: 2, clerk: 1, shopkeeper: 1, nurse: 1, teacher: 1 } },
    hartford: { label: 'Hartford', mix: { clerk: 6, bookkeeper: 5, accountant: 5, lawyer: 3, programmer: 1, teacher: 1, shopkeeper: 1, nurse: 1, physician: 1, machinist: 1 } },
    sanjose: { label: 'San Jose', mix: { programmer: 7, engineer: 6, chemist: 2, machinist: 1, accountant: 1, clerk: 1, teacher: 1, shopkeeper: 1 } },
    fresno: { label: 'Fresno', mix: { farmer: 6, 'farm labourer': 7, miller: 2, baker: 2, shopkeeper: 2, mechanic: 1, teacher: 1, nurse: 1, clerk: 1 } },
    newyork: { label: 'New York', mix: Object.assign(Object.fromEntries(OCC.map((o) => [o[0], 2])), { clerk: 3, lawyer: 3, accountant: 3, nurse: 3, shopkeeper: 3, farmer: 1, 'farm labourer': 1, miller: 1, blacksmith: 1 }) },
  };

  /* shortest paths: each link's length shrinks with relatedness */
  const N = OCC.length;
  const D = Array.from({ length: N }, () => Array(N).fill(Infinity));
  const NEXT = Array.from({ length: N }, () => Array(N).fill(-1));
  for (let i = 0; i < N; i++) { D[i][i] = 0; NEXT[i][i] = i; }
  for (const [a, b, w] of LINKS) {
    const len = Math.hypot((OCC[a][1] - OCC[b][1]) * 1.6, OCC[a][2] - OCC[b][2]) * (1.45 - 0.3 * w);
    D[a][b] = D[b][a] = len; NEXT[a][b] = b; NEXT[b][a] = a;
  }
  for (let k = 0; k < N; k++) for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (D[i][k] + D[k][j] < D[i][j]) { D[i][j] = D[i][k] + D[k][j]; NEXT[i][j] = NEXT[i][k]; }
  }
  let maxD = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) maxD = Math.max(maxD, D[i][j]);
  const dist = (a, b) => D[a][b] / maxD;
  const path = (a, b) => { const p = [a]; let u = a; while (u !== b) { u = NEXT[u][b]; p.push(u); } return p; };

  /* ---------- the city buttons (HTML, above the canvas) and the Enter key ---------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.pfig__ctl button[data-city]');
    if (!btn) return;
    const fig = btn.closest('.pfig');
    const stage = fig.querySelector('.pfig__stage');
    stage.dataset.city = btn.dataset.city;
    fig.querySelectorAll('.pfig__ctl button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    stage.dispatchEvent(new CustomEvent('vizredraw'));
  });

  /* a quadratic curve for each link, bowed gently to one side */
  const curve = (A, B, bow) => {
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = B.x - A.x, dy = B.y - A.y;
    return { cx: mx - dy * bow, cy: my + dx * bow };
  };
  const qpt = (A, C, B, u) => ({ x: (1 - u) * (1 - u) * A.x + 2 * (1 - u) * u * C.cx + u * u * B.x, y: (1 - u) * (1 - u) * A.y + 2 * (1 - u) * u * C.cy + u * u * B.y });

  SDViz.register('coherence', (W, H, r, P, stage) => {
    const k = clamp(Math.min(W / 560, H / 350), 0.62, 1.6);
    const small = W < 440;
    const padX = 30 * k, top = 22 * k, bottom = 34 * k;
    const R = 12.5 * k;
    const nodes = OCC.map(([name, ux, uy, icon, cl], i) => ({
      name, icon, cl, bx: padX + ux * (W - 2 * padX), by: top + uy * (H - top - bottom - 14 * k),
      x: 0, y: 0, ph: i * 2.399, rad: R * 0.6, alpha: 0.3,
    }));
    const bows = LINKS.map(([a, b]) => ((a * 7 + b * 3) % 5 - 2) * 0.06);

    let city = (stage && stage.dataset.city) || 'detroit';
    let draws = [], pair = null;
    let burst = 0, lastBurst = -1e9, fresh = false;
    let lastAuto = -1e9, lastDraws = stage ? (+stage.dataset.draws || 0) : 0, lastT = null;
    let moved = 0, px = null, py = null, wasOn = false;

    const mix = () => CITIES[city].mix;
    const sample = () => {
      const w = mix(); let tot = 0; for (const o of OCC) tot += w[o[0]] || 0;
      let u = r() * tot; for (let i = 0; i < N; i++) { u -= w[OCC[i][0]] || 0; if (u <= 0) return i; } return 0;
    };
    const draw1 = (t) => {
      const a = sample(); let b = sample(), guard = 0;
      while (b === a && guard++ < 40) b = sample(); /* two different occupations */
      pair = { a, b, path: path(a, b), d: dist(a, b), t0: t };
      draws.push(pair.d); if (draws.length > 80) draws.shift();
    };
    const targets = () => {
      const w = mix(); const mx = Math.max(...Object.values(w));
      return nodes.map((n) => { const s = w[n.name] || 0; return s > 0 ? { rad: R * (0.72 + 0.7 * Math.sqrt(s / mx)), alpha: 1 } : { rad: R * 0.62, alpha: 0.28 }; });
    };
    let goal = targets();
    const reset = () => { draws = []; for (let i = 0; i < 60; i++) draw1(0); goal = targets(); };
    reset();
    nodes.forEach((n, i) => { n.rad = goal[i].rad; n.alpha = goal[i].alpha; });

    return {
      draw(ctx, t, p) {
        const dt = lastT === null ? 16 : clamp(t - lastT, 0, 64); lastT = t;
        const want = (stage && stage.dataset.city) || 'detroit';
        if (want !== city) { city = want; reset(); fresh = false; burst = 0; pair.t0 = t; }
        const ext = stage ? (+stage.dataset.draws || 0) : 0;
        if (ext !== lastDraws) { lastDraws = ext; draw1(t); }
        if (burst > 0 && t - lastBurst > 60) { draw1(t); burst--; lastBurst = t; }
        if (p.on) {
          if (!wasOn) { draw1(t); moved = 0; }
          else if (px !== null) { moved += Math.hypot(p.x - px, p.y - py); if (moved > 70 * k) { moved = 0; draw1(t); } }
          px = p.x; py = p.y;
          if (t - pair.t0 > 1400) draw1(t);
        } else if (t - lastAuto > 2600) { lastAuto = t; draw1(t); }
        wasOn = p.on; if (!p.on) px = null;

        /* ease sizes toward the city's shares; breathe gently */
        const ease = reduce ? 1 : 1 - Math.exp(-dt / 260);
        nodes.forEach((n, i) => {
          n.rad += (goal[i].rad - n.rad) * ease; n.alpha += (goal[i].alpha - n.alpha) * ease;
          const amp = reduce ? 0 : 2.2 * k;
          n.x = n.bx + Math.sin(t * 0.00045 + n.ph) * amp; n.y = n.by + Math.cos(t * 0.00038 + n.ph * 1.3) * amp;
        });
        const prog = reduce ? 1 : clamp((t - pair.t0) / 650, 0, 1);
        const onPath = new Set(pair.path);
        ctx.clearRect(0, 0, W, H);

        /* soft groups: the union of discs around each cluster's members */
        ctx.fillStyle = P.a('ink', 0.045);
        for (const cl of ['metal', 'farm', 'office', 'tech', 'care']) {
          ctx.beginPath();
          for (const n of nodes) if (n.cl === cl) { const rr = 30 * k; ctx.moveTo(n.x + rr, n.y); ctx.arc(n.x, n.y, rr, 0, 6.283); }
          ctx.fill();
        }

        /* links: thicker = more related, fainter where a job is absent */
        ctx.lineCap = 'round';
        LINKS.forEach(([a, b, w], li) => {
          const A = nodes[a], B = nodes[b], C = curve(A, B, bows[li]);
          ctx.strokeStyle = P.a('ink', (0.1 + 0.07 * w) * Math.min(A.alpha, B.alpha) + 0.04);
          ctx.lineWidth = (0.6 + 0.8 * w) * k;
          ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(C.cx, C.cy, B.x, B.y); ctx.stroke();
        });

        /* the shortest path, drawn out from worker A to worker B */
        const segs = pair.path.length - 1;
        if (segs > 0) {
          ctx.strokeStyle = P.hot; ctx.lineWidth = 3 * k;
          const reach = prog * segs;
          for (let s = 0; s < segs && s < reach; s++) {
            const ia = pair.path[s], ib = pair.path[s + 1];
            const li = LINKS.findIndex(([a, b]) => (a === ia && b === ib) || (a === ib && b === ia));
            const A = nodes[ia], B = nodes[ib];
            const bow = LINKS[li][0] === ia ? bows[li] : -bows[li];
            const C = curve(A, B, bow), f = Math.min(1, reach - s);
            ctx.beginPath(); ctx.moveTo(A.x, A.y);
            for (let q = 1; q <= 14; q++) { const pt = qpt(A, C, B, (q / 14) * f); ctx.lineTo(pt.x, pt.y); }
            ctx.stroke();
          }
        }

        /* nodes with their pictograms */
        let near = -1;
        if (p.on) { let bd = (R * 2.4) ** 2; nodes.forEach((n, i) => { const d = (n.x - p.x) ** 2 + (n.y - p.y) ** 2; if (d < bd) { bd = d; near = i; } }); }
        const fs = Math.round(clamp(11 * k, 10, 13));
        ctx.font = `500 ${fs}px ${P.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        nodes.forEach((n, i) => {
          const end = i === pair.a || i === pair.b;
          const via = !end && onPath.has(i) && prog === 1;
          ctx.globalAlpha = end || via ? 1 : n.alpha;
          ctx.beginPath(); ctx.arc(n.x, n.y, n.rad, 0, 6.283);
          ctx.fillStyle = end ? P.hot : P.field; ctx.fill();
          ctx.lineWidth = (end || via ? 2 : 1.3) * k; ctx.strokeStyle = end || via ? P.hot : P.ink; ctx.stroke();
          ctx.save(); ctx.translate(n.x, n.y);
          ctx.strokeStyle = end ? P.hotInk : P.ink; ctx.lineWidth = 1.25 * k; ctx.lineJoin = 'round';
          icons[n.icon](ctx, Math.max(n.rad * 0.6, 5 * k));
          ctx.restore();
          if (end || i === near || (!small && n.alpha > 0.6)) { ctx.fillStyle = end ? P.ink : P.mid; ctx.fillText(n.name, n.x, n.y + n.rad + 3 * k); }
          ctx.globalAlpha = 1;
        });
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

        /* readouts: the pair, and an illustrative coherence as one decimal and a short bar */
        const mean = draws.reduce((s, v) => s + v, 0) / draws.length, coh = 1 - mean;
        const rf = Math.round(clamp(13 * k, 12, 15));
        ctx.font = `500 ${rf}px ${P.font}`; ctx.fillStyle = P.ink;
        const by = H - 10 * k;
        ctx.fillText(`${OCC[pair.a][0]} – ${OCC[pair.b][0]}   d = ${pair.d.toFixed(2)}`, 12 * k, small ? by - rf - 6 : by);
        const barW = 54 * k, barH = 6 * k;
        const lbl = `illustrative coherence ${coh.toFixed(1)}` + (fresh ? ` · ${draws.length} pairs` : '');
        const lw = ctx.measureText(lbl).width;
        const x0 = W - 12 * k - barW - 8 * k - lw;
        ctx.fillText(lbl, x0, by);
        ctx.fillStyle = P.a('ink', 0.14); ctx.fillRect(W - 12 * k - barW, by - barH - 2 * k, barW, barH);
        ctx.fillStyle = P.hot; ctx.fillRect(W - 12 * k - barW, by - barH - 2 * k, barW * clamp(coh, 0, 1), barH);
      },
      /* click: a quick burst of 20 fresh pairs; the city's running coherence settles visibly */
      click(pt, t) { draws = []; burst = 20; lastBurst = -1e9; fresh = true; },
      reset(t) { burst = 0; fresh = false; reset(); pair.t0 = t; },
    };
  });
})();
