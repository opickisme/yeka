/* Data & fungsi bantu bersama.
   Data disimpan di localStorage browser (tanpa server). */
const STORE_KEY = 'katalog_sepatu_produk';
const CFG_KEY = 'katalog_sepatu_config';

const DEFAULT_CFG = {
  store: 'Sepatu Kita',
  wa: '6281234567890',   // ganti lewat halaman admin
  password: 'admin123'   // ganti lewat halaman admin
};

const SEED = [
  { id: 'p1', name: 'Court Classic', brand: 'Nike', sizes: [39, 40, 41, 42], color: 'Putih', hex: '#f2f2f2', price: 850000, img: '' },
  { id: 'p2', name: 'Runner 90', brand: 'Adidas', sizes: [40, 41, 42, 43], color: 'Hitam', hex: '#1c1c1c', price: 1200000, img: '' },
  { id: 'p3', name: 'Street Low', brand: 'Converse', sizes: [38, 39, 40], color: 'Merah', hex: '#c8321e', price: 650000, img: '' },
  { id: 'p4', name: 'Trail Grip', brand: 'New Balance', sizes: [41, 42, 43, 44], color: 'Biru', hex: '#2b55c9', price: 1100000, img: '' }
];

const $ = s => document.querySelector(s);

function read(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { return false; }
}

const getProducts = () => read(STORE_KEY, SEED);
const saveProducts = list => write(STORE_KEY, list);
const getConfig = () => ({ ...DEFAULT_CFG, ...read(CFG_KEY, {}) });
const saveConfig = cfg => write(CFG_KEY, cfg);

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rupiah = n => 'Rp ' + Number(n).toLocaleString('id-ID');

// 0812xxx -> 62812xxx, buang karakter selain angka
function normWA(n) {
  n = String(n).replace(/\D/g, '');
  return n.startsWith('0') ? '62' + n.slice(1) : n;
}

// Gambar sepatu sederhana yang diwarnai sesuai warna produk
function shoeSVG(hex) {
  return `<svg viewBox="0 0 200 120" role="img" aria-label="Sepatu">
    <path d="M14 94h176c5 0 8 3 8 8v2c0 6-4 10-10 10H20c-6 0-10-4-10-10v-2c0-5 1-8 4-8z" fill="#fff" stroke="#101820" stroke-width="3" stroke-linejoin="round"/>
    <path d="M16 94c0-24 12-42 28-50l26-14c8-4 16-2 20 4 6 10 18 14 32 18 28 8 64 14 66 42z" fill="${esc(hex)}" stroke="#101820" stroke-width="3" stroke-linejoin="round"/>
    <path d="M94 40l12 10M80 46l12 10M66 52l12 10" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/>
  </svg>`;
}

// Pakai foto bila ada URL gambar, kalau tidak pakai ilustrasi sepatu
function productVisual(p) {
  return p.img
    ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" data-hex="${esc(p.hex)}" loading="lazy">`
    : shoeSVG(p.hex);
}
