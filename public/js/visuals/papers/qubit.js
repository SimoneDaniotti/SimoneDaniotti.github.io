/* Paper: Qubit systems subject to unbalanced random telegraph noise (EPJ D 2018)
   Two qubits as phase dials, kicked by telegraph noise whose balance the pointer sets (move left/right).
   Click: run a teleportation. A state travels from the left qubit to the right one through the noisy channel;
   the readout shows the fidelity, which is higher the more unbalanced the noise (the paper's finding; the
   numbers here are illustrative). The last runs stay listed until reset. */
(() => {
  const { clamp } = SDViz;
  /* illustrative: decoherence strength falls as the noise becomes unbalanced */
  const fidelity = (bal) => clamp(0.5 + 0.5 * Math.exp(-1.25 * (1 - 2 * Math.abs(bal - 0.5))) + (Math.random() - 0.5) * 0.02, 0.5, 1);
  SDViz.register('qubit', (W, H, r, P) => {
    const q = [{ ph: 0, s: 1 }, { ph: 0.4, s: 1 }];
    let corrS = 1, bal = 0.5, run = null, runs = [];
    const DUR = 1400;
    return {
      draw(ctx, t, p) {
        ctx.clearRect(0, 0, W, H);
        bal = p.on ? clamp(p.x / W, 0.05, 0.95) : 0.5 + 0.4 * Math.sin(t * 0.0003);
        const R = Math.min(W * 0.2, H * 0.36);
        const k = Math.max(1, R / 70);
        const tip = (i) => ({ x: W * (0.3 + i * 0.4) + Math.cos(q[i].ph) * R, y: H * 0.5 + Math.sin(q[i].ph) * R * 0.55 });
        q.forEach((b, i) => {
          if (Math.random() < 0.03) b.s = Math.random() < bal ? 1 : -1;
          b.ph += 0.05 * b.s;
          const cx = W * (0.3 + i * 0.4), cy = H * 0.5;
          ctx.fillStyle = P.a('ink', 0.07); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.fill();
          ctx.strokeStyle = P.ink; ctx.lineWidth = 2.4 * k; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tip(i).x, tip(i).y); ctx.stroke();
          ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(tip(i).x, tip(i).y, 4 * k, 0, 6.28); ctx.fill();
        });
        const corr = Math.cos(q[0].ph - q[1].ph);
        corrS += (corr - corrS) * 0.1;
        ctx.strokeStyle = P.a('hot', 0.25 + 0.65 * Math.abs(corr)); ctx.lineWidth = 2 * k;
        ctx.beginPath(); ctx.moveTo(tip(0).x, tip(0).y); ctx.lineTo(tip(1).x, tip(1).y); ctx.stroke();

        /* the teleported state: travels left → right, jittered by the noise, then lands with its fidelity */
        if (run) {
          const u = clamp((t - run.t0) / DUR, 0, 1);
          const ax = W * 0.3, bx = W * 0.7, y0 = H * 0.5;
          if (u < 1) {
            const jit = (1 - run.F) * 60 * k;
            const x = ax + (bx - ax) * u, y = y0 - Math.sin(u * Math.PI) * R * 0.9 + Math.sin(u * 40) * jit * Math.sin(u * Math.PI);
            ctx.fillStyle = P.hot; ctx.beginPath(); ctx.arc(x, y, 6 * k, 0, 6.28); ctx.fill();
            ctx.strokeStyle = P.a('hot', 0.35); ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.arc(x, y, 11 * k, 0, 6.28); ctx.stroke();
          } else {
            ctx.strokeStyle = P.hot; ctx.lineWidth = 2.5 * k; ctx.beginPath(); ctx.arc(bx, y0, R + 6 * k, -Math.PI / 2, -Math.PI / 2 + 6.283 * run.F); ctx.stroke();
          }
        }
        const rf = Math.round(clamp(13 * k * 0.9, 12, 15));
        ctx.font = `500 ${rf}px ${P.font}`; ctx.fillStyle = P.ink;
        if (W > 480 || !runs.length) {
          ctx.fillText(`noise balance ${Math.round(bal * 100)} : ${100 - Math.round(bal * 100)}`, 16, H - 14);
          const lbl = `phase correlation ${corrS.toFixed(2)}`;
          ctx.fillText(lbl, W - 16 - ctx.measureText(lbl).width, H - 14);
        }
        if (runs.length) {
          const done = !run || t - run.t0 >= DUR;
          const latest = runs[runs.length - 1];
          const head = done ? `Teleportation fidelity ${latest.F.toFixed(2)} at noise ${latest.b} : ${100 - latest.b}` : 'Teleporting…';
          const prev = runs.slice(0, -1).slice(-3).map((x) => `${x.F.toFixed(2)} (${x.b}:${100 - x.b})`).join('  ');
          const tw = Math.max(ctx.measureText(head).width, prev ? ctx.measureText(`earlier ${prev}`).width : 0);
          ctx.fillStyle = P.field; ctx.fillRect(8, 8, tw + 16, prev ? rf * 2 + 20 : rf + 12);
          ctx.fillStyle = P.ink; ctx.fillText(head, 16, 8 + rf + 2);
          if (prev) { ctx.fillStyle = P.mid; ctx.fillText(`earlier ${prev}`, 16, 8 + rf * 2 + 10); }
        }
      },
      click(pt, t) {
        const F = fidelity(bal);
        run = { t0: t, F };
        runs.push({ F, b: Math.round(bal * 100) }); if (runs.length > 4) runs.shift();
      },
      reset() { run = null; runs = []; },
    };
  });
})();
