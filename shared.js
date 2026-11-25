const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rupiah = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

// 0812xxx -> 62812xxx
function normWA(n) {
  n = String(n || '').replace(/\D/g, '');
  return n.startsWith('0') ? '62' + n.slice(1) : n;
}

// Ilustrasi sepatu bila produk belum punya foto
function shoeSVG(hex) {
  return `<svg viewBox="0 0 200 120" role="img" aria-label="Sepatu">
    <path d="M14 94h176c5 0 8 3 8 8v2c0 6-4 10-10 10H20c-6 0-10-4-10-10v-2c0-5 1-8 4-8z" fill="#fff" stroke="#101820" stroke-width="3" stroke-linejoin="round"/>
    <path d="M16 94c0-24 12-42 28-50l26-14c8-4 16-2 20 4 6 10 18 14 32 18 28 8 64 14 66 42z" fill="${esc(hex)}" stroke="#101820" stroke-width="3" stroke-linejoin="round"/>
    <path d="M94 40l12 10M80 46l12 10M66 52l12 10" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/>
  </svg>`;
}

// Gambar produk dengan efek lazy (blur lalu fade-in)
function productImg(p, eager) {
  return p.img
    ? `<img class="lz" src="${esc(p.img)}" alt="${esc(p.name)}" data-hex="${esc(p.hex)}" ${eager ? '' : 'loading="lazy"'} decoding="async">`
    : shoeSVG(p.hex);
}
document.addEventListener('load', e => {
  if (e.target.classList && e.target.classList.contains('lz')) e.target.classList.add('ok');
}, true);
document.addEventListener('error', e => {
  if (e.target.classList && e.target.classList.contains('lz')) e.target.outerHTML = shoeSVG(e.target.dataset.hex || '#cccccc');
}, true);
// Gambar yang sudah ada di cache tidak memicu event load
function markLoaded(root) {
  root.querySelectorAll('img.lz').forEach(i => { if (i.complete && i.naturalWidth) i.classList.add('ok'); });
}

// Tombol tema light/dark (tema awal diatur script kecil di <head>)
const themeBtn = $('#theme');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
}
