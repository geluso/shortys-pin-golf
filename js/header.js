const HEADER_BASE = (() => {
  const el = document.querySelector('script[src*="js/header.js"]');
  if (!el) return '';
  return new URL(el.src, location.origin).pathname.replace(/\/js\/header\.js$/, '');
})();

const QR_ICON_SRC = `${HEADER_BASE}/img/qr-code-icon.png`;

let qrModalReady = false;

function appLink(path) {
  return `${HEADER_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

function pageLink(file) {
  return `${HEADER_BASE}/${file}`;
}

function renderSiteHeader(options = {}) {
  const el = document.getElementById('site-header');
  if (!el) return;
  const home = pageLink('index.html');
  el.innerHTML = `
    <h1><a href="${home}" class="site-title-link">SHORTY'S PIN GOLF</a></h1>
    <p class="subtitle">Eat a fucking hotdog.</p>
  `;
  renderSiteFooter(options);
}

function qrPageUrl() {
  return new URL(location.pathname, location.origin).href;
}

function ensureQrModal() {
  if (qrModalReady) return document.getElementById('qr-modal');

  const modal = document.createElement('div');
  modal.id = 'qr-modal';
  modal.className = 'qr-modal';
  modal.hidden = true;
  modal.innerHTML = '<div id="qr-modal-code" class="qr-modal-code"></div>';
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeQrModal();
  });
  document.body.appendChild(modal);
  qrModalReady = true;
  return modal;
}

function closeQrModal() {
  const modal = document.getElementById('qr-modal');
  if (!modal) return;
  modal.hidden = true;
  document.getElementById('qr-modal-code').innerHTML = '';
}

function openQrModal() {
  if (typeof QRCode === 'undefined') return;

  const modal = ensureQrModal();
  const container = document.getElementById('qr-modal-code');
  const size = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.9);

  container.innerHTML = '';
  container.onclick = () => closeQrModal();

  new QRCode(container, {
    text: qrPageUrl(),
    width: size,
    height: size,
    correctLevel: QRCode.CorrectLevel.M,
  });

  modal.hidden = false;
}

function renderSiteFooter({ qr = false } = {}) {
  const el = document.getElementById('site-footer');
  if (!el) return;

  if (qr && typeof QRCode !== 'undefined') {
    document.body.classList.add('has-qr-footer');
    el.className = 'site-footer site-footer-bar';
    el.innerHTML = `
      <button type="button" class="qr-fab" aria-label="Show QR code for this page">
        <img src="${QR_ICON_SRC}" class="qr-fab-icon" alt="">
      </button>
      <span class="site-footer-copy">(C) Madison & Steve</span>
    `;
    el.querySelector('.qr-fab').addEventListener('click', openQrModal);
    return;
  }

  el.className = 'site-footer';
  el.textContent = '(C) Madison & Steve';
}
