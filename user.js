const cfg = getConfig();
const all = getProducts();

document.title = 'Katalog ' + cfg.store;
$('#storeName').textContent = cfg.store;

const uniq = arr => [...new Set(arr)];
function fillSelect(sel, label, vals) {
  sel.innerHTML = `<option value="">${label}</option>` + vals.map(v => `<option>${esc(v)}</option>`).join('');
}
fillSelect($('#fBrand'), 'Semua merk', uniq(all.map(p => p.brand)).sort());
fillSelect($('#fSize'), 'Semua size', uniq(all.flatMap(p => p.sizes)).sort((a, b) => a - b));
fillSelect($('#fColor'), 'Semua warna', uniq(all.map(p => p.color)).sort());

function card(p) {
  // Size terpilih otomatis bila hanya satu, atau mengikuti filter size
  const pre = p.sizes.length === 1 ? String(p.sizes[0]) : $('#fSize').value;
  return `<article class="card" data-id="${esc(p.id)}" style="--c:${esc(p.hex)}">
    <div class="visual">${productVisual(p)}</div>
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
}

$('#filters').addEventListener('input', render);
$('#filters').addEventListener('change', render);
$('#filters').addEventListener('reset', () => setTimeout(render));

$('#grid').addEventListener('click', e => {
  const cardEl = e.target.closest('.card');
  if (!cardEl) return;

  const chip = e.target.closest('.chip');
  if (chip) {
    cardEl.querySelectorAll('.chip').forEach(c => {
      const on = c === chip;
      c.classList.toggle('on', on);
      c.setAttribute('aria-pressed', on);
    });
    cardEl.querySelector('.hint').textContent = '';
    return;
  }

  if (e.target.closest('.order')) {
    const p = all.find(x => x.id === cardEl.dataset.id);
    const on = cardEl.querySelector('.chip.on');
    if (!p) return;
    if (!on) {
      cardEl.querySelector('.hint').textContent = 'Pilih size dulu sebelum order.';
      return;
    }
    const msg = [
      `Halo ${cfg.store}, saya mau order:`,
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

// Bila URL foto gagal dimuat, ganti dengan ilustrasi sepatu
$('#grid').addEventListener('error', e => {
  if (e.target.tagName === 'IMG') e.target.outerHTML = shoeSVG(e.target.dataset.hex || '#cccccc');
}, true);

render();
