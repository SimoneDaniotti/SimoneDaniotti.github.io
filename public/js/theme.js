/* Theme toggle: follows prefers-color-scheme until the visitor chooses. The choice is kept in localStorage
   and, because file:// pages (and some privacy modes) do not share storage, also carried in the URL:
   ?theme=light|dark on the current address and on every internal link. The inline snippet in <head>
   reads the param (then storage) before first paint, so there is no flash. */
(() => {
  'use strict';
  const root = document.documentElement;
  const KEY = 'sd-theme';
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch (_) {} };
  const resolved = () => root.dataset.theme || (mq.matches ? 'dark' : 'light');

  /* same-site page links: relative .html targets, no scheme */
  const internal = (a) => {
    const h = a.getAttribute('href');
    return h && !/^[a-z][a-z0-9+.-]*:/i.test(h) && !h.startsWith('//') && /\.html(?:[?#]|$)/.test(h);
  };
  const withTheme = (href, theme) => {
    const [pathQuery, hash = ''] = href.split('#');
    const [path, query = ''] = pathQuery.split('?');
    const params = new URLSearchParams(query);
    params.set('theme', theme);
    return `${path}?${params}${hash ? '#' + hash : ''}`;
  };
  const carry = (theme) => {
    document.querySelectorAll('a[href]').forEach((a) => { if (internal(a)) a.setAttribute('href', withTheme(a.getAttribute('href'), theme)); });
    try {
      const u = new URL(location.href);
      if (u.searchParams.get('theme') !== theme) { u.searchParams.set('theme', theme); history.replaceState(history.state, '', u); }
    } catch (_) {}
  };

  const sync = () => {
    const r = resolved();
    root.dataset.themeResolved = r;
    const next = r === 'dark' ? 'light' : 'dark';
    document.querySelectorAll('.theme-toggle').forEach((b) => {
      b.setAttribute('aria-label', `Switch to ${next} mode`);
      b.title = `Switch to ${next} mode`;
    });
    window.dispatchEvent(new CustomEvent('themechange', { detail: r }));
  };

  /* the head snippet already applied ?theme or storage; remember a URL choice and pass it on */
  if (root.dataset.theme === 'light' || root.dataset.theme === 'dark') { write(root.dataset.theme); carry(root.dataset.theme); }
  sync();

  document.addEventListener('click', (e) => {
    const b = e.target.closest('.theme-toggle');
    if (!b) return;
    const next = resolved() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    write(next);
    carry(next);
    sync();
  });
  mq.addEventListener('change', () => { if (!root.dataset.theme) sync(); });
})();
