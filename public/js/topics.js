/* Topic filter for the publications list, multi-select (OR). Chips are real buttons (aria-pressed) that toggle;
   'All' is on when nothing is selected and clears the selection. Paper tags (#topic= links) toggle the same way.
   The set lives in the URL hash (#topic=software,skills): linkable, and it survives the theme toggle.
   Without this script the chips stay hidden and every paper shows. */
(() => {
  'use strict';
  const bar = document.querySelector('.topics');
  if (!bar) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chips = [...bar.querySelectorAll('button[data-topic]')];
  const pubs = [...document.querySelectorAll('.pub[data-topics]')];
  const years = [...document.querySelectorAll('.year')];
  const status = document.getElementById('topic-status');
  const names = Object.fromEntries(chips.map((c) => [c.dataset.topic, c.textContent]));
  const order = chips.map((c) => c.dataset.topic).filter((t) => t !== 'all');
  bar.hidden = false;

  const fromHash = () => {
    const m = /topic=([a-z,]+)/.exec(location.hash);
    return new Set(m ? m[1].split(',').filter((t) => order.includes(t)) : []);
  };
  let current = new Set(['__init__']);
  const same = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

  const apply = (sel, first) => {
    if (same(sel, current)) return;
    current = new Set(sel);
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.topic === 'all' ? sel.size === 0 : sel.has(c.dataset.topic))));
    const show = (p) => sel.size === 0 || p.dataset.topics.split(' ').some((t) => sel.has(t));
    const leaving = pubs.filter((p) => !p.hidden && !show(p));
    const entering = pubs.filter((p) => p.hidden && show(p));
    const swap = () => {
      leaving.forEach((p) => { p.hidden = true; });
      entering.forEach((p) => { p.hidden = false; });
      years.forEach((y) => { y.hidden = !y.querySelector('.pub:not([hidden])'); });
      window.dispatchEvent(new CustomEvent('vizlayout'));
      if (!reduce && !first) entering.forEach((p, i) => p.animate(
        [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
        { duration: 320, delay: i * 50, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }));
    };
    if (reduce || first || !leaving.length) swap();
    else Promise.all(leaving.map((p) => p.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-out', fill: 'forwards' }).finished))
      .then(() => { swap(); leaving.forEach((p) => p.getAnimations().forEach((a) => a.cancel())); });
    const n = pubs.filter(show).length;
    const list = order.filter((t) => sel.has(t)).map((t) => names[t]).join(' or ');
    if (status && !first) status.textContent = sel.size === 0 ? `All ${n} papers` : `${n} ${n === 1 ? 'paper' : 'papers'}: ${list}`;
  };

  const setHash = (sel) => {
    const val = order.filter((t) => sel.has(t)).join(',');
    try {
      const u = new URL(location.href);
      u.hash = val ? `topic=${val}` : '';
      history.replaceState(history.state, '', val ? u.href : u.href.replace(/#$/, ''));
    } catch (_) { location.hash = val ? `topic=${val}` : ''; }
  };
  const toggle = (t) => {
    const next = new Set(current.has('__init__') ? [] : current);
    if (t === 'all') next.clear();
    else if (next.has(t)) next.delete(t);
    else next.add(t);
    setHash(next);
    apply(next);
  };

  bar.addEventListener('click', (e) => {
    const c = e.target.closest('button[data-topic]');
    if (c) toggle(c.dataset.topic);
  });
  /* a tag inside a paper toggles its topic, then the chips come back into view */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a.pub__tag');
    if (!a) return;
    e.preventDefault();
    const t = /topic=([a-z]+)/.exec(a.getAttribute('href'))[1];
    toggle(t);
    const top = bar.getBoundingClientRect().top;
    if (top < 0) window.scrollBy({ top: top - 24, behavior: reduce ? 'auto' : 'smooth' });
    const chip = chips.find((c) => c.dataset.topic === t);
    if (chip) chip.focus({ preventScroll: true });
  });
  window.addEventListener('hashchange', () => apply(fromHash()));
  apply(fromHash(), true);
})();
