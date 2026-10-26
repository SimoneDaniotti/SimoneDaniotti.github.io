/* Abstract fold-outs: native <details>/<summary> (keyboard and screen readers for free),
   with a short height animation on open and close. Reduced motion: opens and closes at once. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('animate' in Element.prototype)) return;
  document.querySelectorAll('details.pub__abs').forEach((d) => {
    const summary = d.querySelector('summary');
    const body = d.querySelector('.pub__abs-body');
    let anim = null;
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      if (anim) anim.cancel();
      const opening = !d.open;
      if (opening) d.open = true;
      const full = body.scrollHeight;
      const from = opening ? 0 : body.offsetHeight;
      const to = opening ? full : 0;
      d.classList.toggle('is-opening', opening);
      anim = body.animate(
        [{ height: `${from}px`, opacity: opening ? 0 : 1 }, { height: `${to}px`, opacity: opening ? 1 : 0 }],
        { duration: Math.min(520, 220 + full * 0.4), easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      anim.onfinish = () => { anim = null; if (!opening) d.open = false; d.classList.remove('is-opening'); };
    });
  });
})();
