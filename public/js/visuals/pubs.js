/* Publications: runs the paper figures in place.
   At rest a figure is calm (a third of the speed); under the pointer, a finger or keyboard focus it runs at full
   speed and follows the input. Arrow keys move a virtual pointer. Off-screen figures stop.
   Reduced motion: still frames that redraw once per input.
   Click action (owner rule): a tap/click without drag, or Enter/Space, calls inst.click(pt, t); the result
   persists until the next click or a reset (double-click, Escape, or the small Reset button), which calls
   inst.reset(t). With reduced motion the click's animation is settled off-screen and only the end state is shown. */
(() => {
  'use strict';
  const V = window.SDViz;
  if (!V) return;
  const { P, clamp, rng } = V;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const figs = [];

  const resize = (f) => {
    const b = f.stage.getBoundingClientRect();
    if (!b.width) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    f.W = b.width; f.H = b.height;
    f.canvas.width = Math.round(b.width * dpr); f.canvas.height = Math.round(b.height * dpr);
    f.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const maker = V.makers[f.kind];
    if (!maker) return;
    f.inst = maker(f.W, f.H, rng(f.seed), P, f.stage);
    const idle = { x: 0, y: 0, on: false };
    for (let i = 0; i < (reduce ? 140 : 60); i++) f.inst.draw(f.ctx, 4000 + i * 16, idle);
    f.vt = 5000;
  };

  const still = (f) => { if (reduce && f.inst) f.inst.draw(f.ctx, f.vt, f.p); };
  /* reduced motion: run the click's animation silently, then show its end state */
  const settle = (f) => { if (!f.inst) return; for (let i = 0; i < 160; i++) { f.vt += 16; f.inst.draw(f.ctx, f.vt, f.p); } };
  const act = (f, pt) => {
    if (!f.inst || !f.inst.click) return;
    f.inst.click(pt || { x: f.W / 2, y: f.H / 2, kb: true }, f.vt);
    f.reset.hidden = false; placeReset(f);
    if (reduce) settle(f); else { f.active = true; kick(); }
  };
  const doReset = (f) => {
    if (!f.inst || !f.inst.reset) return;
    f.inst.reset(f.vt);
    f.reset.hidden = true;
    if (reduce) settle(f); else kick();
  };
  const placeReset = (f) => { f.reset.style.top = `${f.stage.offsetTop + 8}px`; };

  const setup = (stage) => {
    const canvas = stage.querySelector('canvas');
    const f = { stage, canvas, ctx: canvas.getContext('2d'), kind: stage.dataset.viz,
                seed: stage.dataset.viz.length * 7919 + 13, p: { x: 0, y: 0, on: false },
                visible: true, active: false, vt: 5000, tick: 0 };
    const local = (cx, cy) => {
      const b = canvas.getBoundingClientRect();
      f.p.x = cx - b.left; f.p.y = cy - b.top; f.p.on = true; f.active = true;
      still(f); kick();
    };
    const off = () => { f.p.on = false; f.active = document.activeElement === stage; };
    /* tap / click without drag = the figure's action; double-click resets */
    let down = null;
    stage.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    stage.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), quick = performance.now() - down.t < 700;
      down = null;
      if (moved < 10 && quick) { const b = canvas.getBoundingClientRect(); act(f, { x: e.clientX - b.left, y: e.clientY - b.top }); }
    });
    stage.addEventListener('pointercancel', () => { down = null; });
    stage.addEventListener('dblclick', (e) => { e.preventDefault(); doReset(f); });
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'pfig__reset'; btn.textContent = 'Reset'; btn.hidden = true;
    btn.setAttribute('aria-label', 'Reset the figure');
    btn.addEventListener('click', () => { doReset(f); stage.focus({ preventScroll: true }); });
    stage.parentElement.appendChild(btn);
    f.reset = btn;
    stage.addEventListener('pointermove', (e) => local(e.clientX, e.clientY), { passive: true });
    stage.addEventListener('pointerdown', (e) => local(e.clientX, e.clientY), { passive: true });
    stage.addEventListener('pointerleave', off);
    stage.addEventListener('touchmove', (e) => local(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    stage.addEventListener('touchend', off, { passive: true });
    stage.addEventListener('vizredraw', () => { still(f); kick(); });
    stage.addEventListener('focus', () => { f.active = true; kick(); });
    stage.addEventListener('blur', () => { f.active = false; f.p.on = false; });
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(f, f.p.on ? { x: f.p.x, y: f.p.y } : null); return; }
      if (e.key === 'Escape') { if (!f.reset.hidden) { e.preventDefault(); doReset(f); } return; }
      const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!step) return;
      e.preventDefault();
      if (!f.p.on) { f.p.x = f.W / 2; f.p.y = f.H / 2; f.p.on = true; }
      f.p.x = clamp(f.p.x + step[0] * f.W * 0.05, 0, f.W);
      f.p.y = clamp(f.p.y + step[1] * f.H * 0.05, 0, f.H);
      still(f);
    });
    figs.push(f);
  };
  document.querySelectorAll('.pfig__stage[data-viz]').forEach(setup);

  let raf = 0, last = 0;
  const frame = (t) => {
    raf = 0;
    const dt = Math.min(64, last ? t - last : 16); last = t;
    let any = false;
    for (const f of figs) {
      if (!f.inst || !f.visible) continue;
      any = true;
      if (f.active) { f.vt += dt; f.inst.draw(f.ctx, f.vt, f.p); }
      else { f.vt += dt / 3; if (++f.tick % 3 === 0) f.inst.draw(f.ctx, f.vt, f.p); }
    }
    if (any && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!reduce && !raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      for (const e of es) { const f = figs.find((g) => g.stage === e.target); if (f) f.visible = e.isIntersecting; }
      kick();
    }, { rootMargin: '80px' });
    figs.forEach((f) => io.observe(f.stage));
  }
  document.addEventListener('visibilitychange', kick);

  const all = () => { figs.forEach((f) => { resize(f); if (f.reset) { f.reset.hidden = true; placeReset(f); } }); kick(); };
  let rt = 0, lastW = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (innerWidth !== lastW) { lastW = innerWidth; all(); } }, 120); });
  /* colours are read every frame, so a theme change keeps each figure's state (and its click result) */
  const retheme = () => { V.refresh(); figs.forEach((f) => { if (f.inst) f.inst.draw(f.ctx, f.vt, f.p); }); };
  window.addEventListener('themechange', retheme);
  window.addEventListener('vizlayout', () => figs.forEach((f) => { if (!f.inst || f.W !== f.stage.getBoundingClientRect().width) { resize(f); if (f.reset) f.reset.hidden = true; } }));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', retheme);
  lastW = innerWidth;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { V.refresh(); all(); }); else all();
})();
