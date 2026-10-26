/* Paper: Who is using AI to code? (Science 2026)
   A stream of functions; a classifier lens marks the AI-written ones, 29 in every 100. */
(() => {
  const { clamp } = SDViz;
  SDViz.register('code', (W, H, r, P) => {
    const s = clamp(W / 760, 0.6, 1.4);
    const lineH = 15 * s, tokH = 5 * s, left = 26 * s;
    const fns = [];
    let idx = 0;
    const total = Math.ceil((H * 3) / lineH);
    const pattern = Array.from({ length: 100 }, (_, i) => i < 29);
    for (let i = pattern.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pattern[i], pattern[j]] = [pattern[j], pattern[i]]; }
    const ncol = W > 460 ? 2 : 1, colW = (W - left * 2) / ncol;
    for (let col = 0; col < ncol; col++) {
      let y = col * 3;
      while (y < total) {
        const n = 2 + Math.floor(r() * 6);
        const ai = pattern[idx % 100]; idx++;
        const lines = [];
        for (let k = 0; k < n; k++) {
          const ind = k === 0 ? 0 : 1 + Math.floor(r() * Math.min(3, k + 1));
          const toks = []; let x = 0; const m = 2 + Math.floor(r() * 8);
          const maxW = colW - 30 * s - ind * 22 * s;
          for (let t = 0; t < m; t++) { const w = (10 + r() * 58) * s; if (x + w > maxW) break; toks.push([x, w]); x += w + 7 * s; }
          lines.push({ ind, toks });
        }
        fns.push({ y, ai, lines, col });
        y += n + 1;
      }
    }
    const period = total * lineH;
    const lens = { x: W * 0.5, y: H * 0.5 };
    let idle = null, idleAt = -1e9;
    let shown = 29; /* the readout eases toward the share under the lens; sparse spots keep the last value */
    /* click: classify the functions under the lens; AI-written ones stay marked after the lens moves on */
    let stamped = new Set(), tally = { n: 0, ai: 0 }, pulse = null, lastOff = 0;
    const under = () => {
      const R = Math.min(W, H) * 0.24, hits = [];
      /* a function is classified when any of its lines passes under the lens */
      for (const f of fns) {
        for (let k = 0; k < f.lines.length; k++) {
          let yy = (f.y + k) * lineH - lastOff; if (yy < -lineH) yy += period; if (yy < 0 || yy > H) continue;
          const L = f.lines[k]; if (!L.toks.length) continue;
          const x0 = left + f.col * colW + L.ind * 22 * s, x1 = x0 + L.toks[L.toks.length - 1][0] + L.toks[L.toks.length - 1][1];
          const nx = clamp(lens.x, x0, x1);
          if (Math.hypot(nx - lens.x, yy - lens.y) < R) { hits.push(f); break; }
        }
      }
      return hits;
    };
    return {
      draw(ctx, t, p) {
        const R = Math.min(W, H) * 0.24;
        const off = (t * 0.018 * s) % period; lastOff = off;
        /* at rest the lens rides on an AI-written function, so highlighted lines are always inside it */
        const fy = (f) => ((f.y * lineH - off) % period + period) % period + (f.lines.length * lineH) / 2;
        const fx = (f) => left + f.col * colW + colW * 0.32;
        if (!p.on) {
          const ok = (f) => { const y = fy(f); return y > H * 0.28 && y < H * 0.72; };
          if (!idle || !ok(idle) || t - idleAt > 4200) {
            /* prefer spots where the local share under the lens is close to the measured 29% */
            const local = (f) => { let a = 0, n = 0; const cx = fx(f), cy = fy(f);
              for (const g of fns) { const y = fy(g); if (y > H) continue; if (Math.hypot(fx(g) - cx, y - cy) < R * 1.1) { n++; if (g.ai) a++; } }
              return { a, n }; };
            let best = null, bd = Infinity;
            for (const f of fns) if (f.ai && f !== idle && ok(f)) {
              const { a, n } = local(f); const share = n ? a / n : 1;
              const d = Math.abs(share - 0.29) * W * 4 + (n < 3 ? W * 2 : 0) + Math.hypot(fx(f) - lens.x, fy(f) - lens.y) * 0.3 + Math.random() * W * 0.2;
              if (d < bd) { bd = d; best = f; } }
            if (best) { idle = best; idleAt = t; }
          }
        }
        const tx = p.on ? p.x : idle ? fx(idle) : W * 0.5;
        const ty = p.on ? p.y : idle ? fy(idle) : H * 0.5;
        const follow = p.on ? 0.14 : 0.06;
        lens.x += (tx - lens.x) * follow; lens.y += (ty - lens.y) * follow;
        ctx.clearRect(0, 0, W, H);
        let inAI = 0, inAll = 0;
        const pass = (inside) => {
          for (const f of fns) {
            for (let k = 0; k < f.lines.length; k++) {
              let yy = (f.y + k) * lineH - off; if (yy < -lineH) yy += period; if (yy > H + lineH) continue;
              const L = f.lines[k];
              const x0 = left + f.col * colW + L.ind * 22 * s;
              if (inside && !f.ai) continue;
              ctx.fillStyle = inside ? P.hot : stamped.has(f) ? (f.ai ? P.hot : P.mid) : P.dim;
              for (const [x, w] of L.toks) { if (x0 + x > W - 12) break; ctx.fillRect(x0 + x, yy, Math.min(w, W - 12 - x0 - x), tokH); }
            }
            if (inside) {
              const yy0 = ((f.y * lineH - off) % period + period) % period;
              const yy1 = yy0 + f.lines.length * lineH;
              const cy = (yy0 + yy1) / 2;
              const fx = left + f.col * colW + colW * 0.3;
              if (Math.hypot(cy - lens.y, fx - lens.x) < R * 1.1 && yy1 < H) { inAll++; if (f.ai) inAI++; }
            }
          }
        };
        pass(false);
        ctx.save();
        ctx.beginPath(); ctx.arc(lens.x, lens.y, R, 0, Math.PI * 2);
        ctx.fillStyle = P.a('hot', 0.12); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.a('hot', 0.7); ctx.stroke();
        ctx.clip();
        pass(true);
        ctx.restore();
        if (inAll >= 3) shown += ((inAI / inAll) * 100 - shown) * 0.08;
        const share = Math.round(shown);
        const fs = Math.round(14 * clamp(s, 0.9, 1.2));
        ctx.font = `500 ${fs}px ${P.font}`;
        const label = p.on ? `${share}% AI-written here` : '29% AI-written overall';
        const tw = ctx.measureText(label).width;
        const lx = clamp(lens.x + R * 0.72, 12, W - tw - 12);
        const ly = clamp(lens.y + R + 22, 24, H - 12);
        ctx.fillStyle = P.field; ctx.fillRect(lx - 6, ly - fs, tw + 12, fs + 8);
        ctx.fillStyle = P.ink; ctx.fillText(label, lx, ly);
        if (pulse) {
          const u = (t - pulse.t0) / 520;
          if (u >= 1 || u < 0) pulse = null;
          else { ctx.strokeStyle = P.a('hot', 0.8 * (1 - u)); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pulse.x, pulse.y, R * (1 + 0.25 * u), 0, Math.PI * 2); ctx.stroke(); }
        }
        if (tally.n) {
          const msg = `${tally.n} functions classified, ${Math.round((100 * tally.ai) / tally.n)}% AI-written`;
          const mw = ctx.measureText(msg).width;
          ctx.fillStyle = P.field; ctx.fillRect(8, H - fs - 18, mw + 16, fs + 12);
          ctx.fillStyle = P.ink; ctx.fillText(msg, 16, H - 12);
        }
      },
      click(pt, t) {
        for (const f of under()) if (!stamped.has(f)) { stamped.add(f); tally.n++; if (f.ai) tally.ai++; }
        pulse = { x: lens.x, y: lens.y, t0: t };
      },
      reset() { stamped = new Set(); tally = { n: 0, ai: 0 }; pulse = null; },
    };
  });
})();
