const HEADER_BASE = (() => {
  const el = document.querySelector('script[src*="js/header.js"]');
  if (!el) return '';
  return new URL(el.src, location.origin).pathname.replace(/\/js\/header\.js$/, '');
})();

function renderSiteHeader() {
  const el = document.getElementById('site-header');
  if (!el) return;
  const home = `${HEADER_BASE}/`;
  el.innerHTML = `
    <h1><a href="${home}" class="site-title-link">SHORTY'S PIN GOLF</a></h1>
    <p class="subtitle">Eat a fucking hotdog.</p>
  `;
  renderSiteFooter();
}

function renderSiteFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.textContent = '(C) Madison & Steve';
}
