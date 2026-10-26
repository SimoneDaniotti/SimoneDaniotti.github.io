/* Paper: The changing global division of labor in software (arXiv 2026)
   Six IT hubs of different sizes and specialisations. Hover highlights a hub. Click a hub: a new skill emerges
   there and diffuses to the others, faster to large hubs specialised in related skills (speeds illustrative).
   Several skills can travel at once, each in its own shade; they stay until reset. */
(() => {
  const { clamp } = SDViz;
  SDViz.register('hubs', (W, H, r, P) => {
    const k = Math.min(W, H) / 250;
    const FIELD = ['web', 'data', 'systems'];
    const SPEC = [{ f: 0, size: 1 }, { f: 1, size: 0.55 }, { f: 2, size: 0.8 }, { f: 0, size: 0.45 }, { f: 1, size: 0.95 }, { f: 2, size: 0.5 }];
    const hubs = SPEC.map((s, i) => {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      return {
        x: W / 2 + Math.cos(a) * W * 0.33, y: H * 0.46 + Math.sin(a) * H * 0.3, f: s.f, size: s.size,
        R: (14 + 14 * s.size) * k,
        skills: Array.from({ length: Math.round(5 + 9 * s.size) }, () => ({ a: r() * 6.28, d: 0.3 + r() * 0.55, shade: -1, lit: 0 })),
      };
    });
    let travellers = [], waves = [], nextShade = 0, lastDemo = -1e9, kbHub = -1;
    const shadeOf = (i) => [P.hot, P.a('hot', 0.5), P.ink][i % 3];
    const place = (h, shade, lit) => {
      h.skills.push({ a: Math.random() * 6.28, d: 0.3 + Math.random() * 0.6, shade, lit });
      const cap = Math.round(10 + 14 * h.size);
      if (h.skills.length > cap) { const i = h.skills.findIndex((s) => s.shade < 0); h.skills.splice(i >= 0 ? i : 0, 1); }
    };
    /* speed per ms: larger hubs and hubs in the same (related) field adopt sooner */
    const launch = (from, t, wave) => {
      hubs.forEach((h, j) => {
        if (j === from) return;
        const rate = 0.00042 * (0.45 + 0.75 * h.size) * (h.f === hubs[from].f ? 1.8 : 0.75);
        travellers.push({ from, to: j, u: 0, rate, wave });
      });
    };
    const emerge = (h, t, demo) => {
      const wave = demo ? { demo: true, reached: new Set([h]) } : { shade: nextShade++ % 3, id: nextShade, reached: new Set([h]), origin: h };
      place(hubs[h], demo ? -1 : wave.shade, 1);
      if (!demo) waves.push(wave);
      launch(h, t, wave);
    };
    let lastT = null;
    return {
      draw(ctx, t, p) {
        const dt = lastT === null ? 16 : clamp(t - lastT, 0, 64); lastT = t;
        ctx.clearRect(0, 0, W, H);
        let near = -1;
        if (p.on) { let bd = 1e9; hubs.forEach((h, i) => { const d = Math.hypot(h.x - p.x, h.y - p.y); if (d < bd) { bd = d; near = i; } }); }
        /* before any click, a quiet demo skill now and then */
        if (!waves.length && t - lastDemo > 3000) { lastDemo = t; emerge(Math.floor(Math.random() * hubs.length), t, true); }
        for (let i = travellers.length - 1; i >= 0; i--) {
          const q = travellers[i]; q.u += q.rate * dt;
          const A = hubs[q.from], B = hubs[q.to];
          if (q.u >= 1) { place(B, q.wave.demo ? -1 : q.wave.shade, 1); q.wave.reached.add(q.to); travellers.splice(i, 1); continue; }
          ctx.fillStyle = q.wave.demo ? P.a('hot', 0.45) : shadeOf(q.wave.shade);
          ctx.beginPath(); ctx.arc(A.x + (B.x - A.x) * q.u, A.y + (B.y - A.y) * q.u, 2.6 * Math.max(1, k * 0.8), 0, 6.28); ctx.fill();
        }
        const fs = Math.round(clamp(11 * k, 10, 13));
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        hubs.forEach((h, i) => {
          ctx.fillStyle = P.a('ink', i === near ? 0.13 : 0.06);
          ctx.beginPath(); ctx.arc(h.x, h.y, h.R, 0, 6.28); ctx.fill();
          if (i === near) { ctx.strokeStyle = P.a('ink', 0.5); ctx.lineWidth = 1.5; ctx.stroke(); }
          for (const s of h.skills) {
            s.a += 0.004 * dt / 16; s.lit = Math.max(0, s.lit - 0.004 * dt / 16);
            const own = s.shade >= 0;
            ctx.fillStyle = own ? shadeOf(s.shade) : s.lit > 0.05 ? P.a('hot', 0.6) : P.mid;
            ctx.beginPath(); ctx.arc(h.x + Math.cos(s.a) * s.d * h.R, h.y + Math.sin(s.a) * s.d * h.R, (own ? 3 : 2) * Math.max(1, k * 0.7), 0, 6.28); ctx.fill();
          }
          ctx.font = `${i === near ? 600 : 500} ${fs}px ${P.font}`;
          ctx.fillStyle = i === near ? P.ink : P.mid;
          ctx.fillText(`${h.size > 0.7 ? 'large' : 'small'} ${FIELD[h.f]} hub`, h.x, h.y + h.R + 4);
        });
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        if (waves.length) {
          const w = waves[waves.length - 1];
          const moving = new Set(travellers.filter((q) => !q.wave.demo).map((q) => q.wave)).size;
          const msg = `Skill ${w.id} from a ${FIELD[hubs[w.origin].f]} hub reached ${w.reached.size} of 6 hubs` + (moving > 1 ? ` · ${moving} skills spreading` : '');
          const rf = Math.round(clamp(13 * k, 12, 15));
          ctx.font = `500 ${rf}px ${P.font}`;
          const mw = ctx.measureText(msg).width;
          ctx.fillStyle = P.field; ctx.fillRect(8, H - rf - 18, mw + 16, rf + 12);
          ctx.fillStyle = P.ink; ctx.fillText(msg, 16, H - 12);
        }
      },
      click(pt, t) {
        let h = 0;
        if (pt.kb) { kbHub = (kbHub + 1) % hubs.length; h = kbHub; }
        else { let bd = 1e9; hubs.forEach((q, i) => { const d = Math.hypot(q.x - pt.x, q.y - pt.y); if (d < bd) { bd = d; h = i; } }); }
        travellers = travellers.filter((q) => !q.wave.demo);
        emerge(h, t, false);
      },
      reset() {
        travellers = []; waves = []; nextShade = 0; lastDemo = -1e9;
        hubs.forEach((h) => { h.skills = h.skills.filter((s) => s.shade < 0); });
      },
    };
  });
})();
