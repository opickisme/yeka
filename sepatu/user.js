let cfg = {}, all = [];

(async () => {
  try {
    const r = await fetch('data/products.json?t=' + Date.now());
    if (!r.ok) throw new Error(r.status);
    cfg = await r.json();
    all = cfg.products || [];
  } catch (e) {
    $('#grid').innerHTML = '<p class="empty">Data produk belum bisa dimuat. Buka lewat GitHub Pages atau server lokal, bukan dengan klik dua kali file HTML.</p>';
    return;
  }
  init();
})();

const uniq = a => [...new Set(a)];
function fillSelect(sel, label, vals) {
  sel.innerHTML = `<option value="">${label}</option>` + vals.map(v => `<option>${esc(v)}</option>`).join('');
}

function init() {
  const store = cfg.store || 'Katalog Sepatu';
  document.title = 'Katalog ' + store;
  $('#logo').innerHTML = cfg.logo ? `<img src="${esc(cfg.logo)}" alt="${esc(store)}">` : esc(store);

  fillSelect($('#fBrand'), 'Semua merk', uniq(all.map(p => p.brand)).sort());
  fillSelect($('#fSize'), 'Semua size', uniq(all.flatMap(p => p.sizes)).sort((a, b) => a - b));
  fillSelect($('#fColor'), 'Semua warna', uniq(all.map(p => p.color)).sort());

  slider();
  render();
}

/* ---------- Slider: 5 produk terbaru ---------- */
function slider() {
  const list = [...all].sort((a, b) => (b.created || 0) - (a.created || 0)).slice(0, 5);
  if (!list.length) return;
  $('#slider').hidden = false;

  const track = $('#track'), dots = $('#dots');
  track.innerHTML = list.map((p, i) => `
    <a class="slide" href="#p-${esc(p.id)}" style="--c:${esc(p.hex)}">
      <div class="pic">${productImg(p, i === 0)}</div>
      <div class="txt">
        <span class="badge">BARU</span>
        <p class="brand">${esc(p.brand)}</p>
        <h2>${esc(p.name)}</h2>
        <strong>${rupiah(p.price)}</strong>
      </div>
    </a>`).join('');
  dots.innerHTML = list.map((_, i) => `<button type="button" aria-label="Slide ${i + 1}" data-i="${i}"></button>`).join('');
  markLoaded(track);

  let i = 0, timer;
  const mark = () => [...dots.children].forEach((d, n) => d.classList.toggle('on', n === i));
  const go = n => {
    i = (n + list.length) % list.length;
    track.scrollTo({ left: track.children[i].offsetLeft, behavior: 'smooth' });
    mark();
  };
  const play = () => {
    if (list.length < 2 || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    clearInterval(timer);
    timer = setInterval(() => go(i + 1), 4500);
  };

  track.addEventListener('scroll', () => {
    const n = Math.round(track.scrollLeft / (track.children[0].offsetWidth + 12));
    if (n !== i) { i = n; mark(); }
  }, { passive: true });
  dots.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { go(+b.dataset.i); play(); } });
  ['pointerdown', 'mouseenter', 'focusin'].forEach(ev => track.addEventListener(ev, () => clearInterval(timer)));
  ['mouseleave', 'focusout', 'pointerup'].forEach(ev => track.addEventListener(ev, play));
  mark();
  play();
}

/* ---------- Katalog ---------- */
function card(p) {
  // Size otomatis terpilih bila hanya satu, atau mengikuti filter size
  const pre = p.sizes.length === 1 ? String(p.sizes[0]) : $('#fSize').value;
  return `<article class="card" id="p-${esc(p.id)}" data-id="${esc(p.id)}" style="--c:${esc(p.hex)}">
    <div class="visual">${productImg(p)}</div>
    <div class="info">
      <p class="brand">${esc(p.brand)}</p>
      <h2>${esc(p.name)}</h2>
      <p class="color"><i class="dot"></i>${esc(p.color)}</p>
      <div class="sizes" role="group" aria-label="Pilih size">
        ${p.sizes.map(z => `<button type="button" class="chip${String(z) === pre ? ' on' : ''}" data-size="${esc(z)}" aria-pressed="${String(z) === pre}">${esc(z)}</button>`).join('')}
      </div>
      <p class="hint" aria-live="polite"></p>
      <div class="buy">
        <strong>${rupiah(p.price)}</strong>
        <button type="button" class="order">ORDER</button>
      </div>
    </div>
  </article>`;
}

function render() {
  const q = $('#q').value.trim().toLowerCase();
  const b = $('#fBrand').value, s = $('#fSize').value, c = $('#fColor').value;
  const list = all.filter(p =>
    (!q || (p.name + ' ' + p.brand).toLowerCase().includes(q)) &&
    (!b || p.brand === b) &&
    (!s || p.sizes.map(String).includes(s)) &&
    (!c || p.color === c)
  );
  $('#count').textContent = list.length + ' produk';
  $('#grid').innerHTML = list.length
    ? list.map(card).join('')
    : '<p class="empty">Tidak ada sepatu yang cocok. Ubah atau reset filter.</p>';
  markLoaded($('#grid'));
}

$('#filters').addEventListener('input', render);
$('#filters').addEventListener('change', render);
$('#filters').addEventListener('reset', () => setTimeout(render));

$('#grid').addEventListener('click', e => {
  const el = e.target.closest('.card');
  if (!el) return;

  const chip = e.target.closest('.chip');
  if (chip) {
    el.querySelectorAll('.chip').forEach(c => {
      const on = c === chip;
      c.classList.toggle('on', on);
      c.setAttribute('aria-pressed', on);
    });
    el.querySelector('.hint').textContent = '';
    return;
  }

  if (e.target.closest('.order')) {
    const p = all.find(x => x.id === el.dataset.id);
    const on = el.querySelector('.chip.on');
    if (!p) return;
    if (!on) { el.querySelector('.hint').textContent = 'Pilih size dulu.'; return; }
    const msg = [
      `Halo ${cfg.store || ''}, saya mau order:`,
      `Produk: ${p.name}`,
      `Merk: ${p.brand}`,
      `Size: ${on.dataset.size}`,
      `Warna: ${p.color}`,
      `Harga: ${rupiah(p.price)}`,
      '',
      'Apakah masih tersedia?'
    ].join('\n');
    window.open(`https://wa.me/${normWA(cfg.wa)}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }
});
