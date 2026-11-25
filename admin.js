let cfg = getConfig();
let items = getProducts();

function authed() {
  try { return sessionStorage.getItem('adm') === '1'; } catch (e) { return false; }
}
function setAuth(on) {
  try { on ? sessionStorage.setItem('adm', '1') : sessionStorage.removeItem('adm'); } catch (e) {}
}
function flash(el, text) {
  el.textContent = text;
  setTimeout(() => { if (el.textContent === text) el.textContent = ''; }, 3500);
}

function toggle() {
  $('#login').hidden = authed();
  $('#panel').hidden = !authed();
  if (authed()) { fillSettings(); renderList(); }
}

/* ---------- Login ---------- */
$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  if ($('#pwd').value === cfg.password) {
    setAuth(true);
    $('#pwd').value = '';
    $('#loginErr').textContent = '';
    toggle();
  } else {
    $('#loginErr').textContent = 'Password salah. Coba lagi.';
  }
});
$('#logout').addEventListener('click', () => { setAuth(false); toggle(); });

/* ---------- Pengaturan ---------- */
function fillSettings() {
  $('#cStore').value = cfg.store;
  $('#cWa').value = cfg.wa;
  $('#cPwd').value = '';
}
$('#cfgForm').addEventListener('submit', e => {
  e.preventDefault();
  const wa = normWA($('#cWa').value);
  if (wa.length < 9) { flash($('#cMsg'), 'Nomor WhatsApp tidak valid.'); return; }
  cfg = {
    store: $('#cStore').value.trim(),
    wa,
    password: $('#cPwd').value || cfg.password
  };
  flash($('#cMsg'), saveConfig(cfg) ? 'Pengaturan disimpan.' : 'Gagal menyimpan. Penyimpanan browser penuh atau diblokir.');
  fillSettings();
});

/* ---------- Produk ---------- */
function renderList() {
  $('#list').innerHTML = items.length
    ? items.map(p => `<li style="--c:${esc(p.hex)}">
        <i class="dot"></i>
        <div class="meta">
          <strong>${esc(p.name)}</strong>
          <span>${esc(p.brand)}, ${esc(p.color)}</span>
          <span>Size ${p.sizes.map(esc).join(', ')}</span>
          <span>${rupiah(p.price)}</span>
        </div>
        <div class="acts">
          <button class="btn ghost" type="button" data-edit="${esc(p.id)}">Edit</button>
          <button class="btn danger" type="button" data-del="${esc(p.id)}">Hapus</button>
        </div>
      </li>`).join('')
    : '<li class="note">Belum ada produk. Tambahkan lewat form di atas.</li>';
}

function resetForm() {
  $('#pForm').reset();
  $('#pId').value = '';
  $('#pHex').value = '#1c1c1c';
  $('#formTitle').textContent = 'Tambah produk';
  $('#pCancel').hidden = true;
}

$('#pForm').addEventListener('submit', e => {
  e.preventDefault();
  const sizes = [...new Set(
    $('#pSizes').value.split(/[\s,]+/).filter(Boolean).map(v => (isNaN(v) ? v : Number(v)))
  )].sort((a, b) => (a > b ? 1 : -1));
  if (!sizes.length) { flash($('#pMsg'), 'Isi minimal satu size.'); return; }

  const id = $('#pId').value || 'p' + Date.now();
  const prod = {
    id,
    name: $('#pName').value.trim(),
    brand: $('#pBrand').value.trim(),
    sizes,
    color: $('#pColor').value.trim(),
    hex: $('#pHex').value,
    price: Number($('#pPrice').value) || 0,
    img: $('#pImg').value.trim()
  };
  const i = items.findIndex(p => p.id === id);
  if (i >= 0) items[i] = prod; else items.push(prod);

  if (saveProducts(items)) {
    flash($('#pMsg'), 'Produk disimpan.');
    renderList();
    resetForm();
  } else {
    flash($('#pMsg'), 'Gagal menyimpan. Penyimpanan browser penuh atau diblokir.');
  }
});
$('#pCancel').addEventListener('click', resetForm);

$('#list').addEventListener('click', e => {
  const ed = e.target.closest('[data-edit]');
  const del = e.target.closest('[data-del]');
  if (ed) {
    const p = items.find(x => x.id === ed.dataset.edit);
    if (!p) return;
    $('#pId').value = p.id;
    $('#pName').value = p.name;
    $('#pBrand').value = p.brand;
    $('#pSizes').value = p.sizes.join(', ');
    $('#pPrice').value = p.price;
    $('#pColor').value = p.color;
    $('#pHex').value = p.hex;
    $('#pImg').value = p.img || '';
    $('#formTitle').textContent = 'Edit produk';
    $('#pCancel').hidden = false;
    $('#pForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (del) {
    const p = items.find(x => x.id === del.dataset.del);
    if (p && confirm(`Hapus "${p.name}"?`)) {
      items = items.filter(x => x.id !== p.id);
      saveProducts(items);
      renderList();
    }
  }
});

/* ---------- Cadangan data ---------- */
$('#exp').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'produk-sepatu.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('#imp').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data) || !data.every(p => p.name && p.brand && Array.isArray(p.sizes))) throw new Error('format');
    items = data.map(p => ({
      id: p.id || 'p' + Math.random().toString(36).slice(2),
      name: String(p.name),
      brand: String(p.brand),
      sizes: p.sizes,
      color: String(p.color || ''),
      hex: p.hex || '#cccccc',
      price: Number(p.price) || 0,
      img: p.img || ''
    }));
    saveProducts(items);
    renderList();
    flash($('#bMsg'), 'Data berhasil diimpor.');
  } catch (err) {
    flash($('#bMsg'), 'File tidak valid.');
  }
  e.target.value = '';
});

toggle();
