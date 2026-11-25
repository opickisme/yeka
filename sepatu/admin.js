const DATA_PATH = 'data/products.json';
let gh = null;
try { gh = JSON.parse(localStorage.getItem('gh') || 'null'); } catch (e) {}
let db = { store: 'Sepatu Kita', wa: '', logo: '', products: [] };
let sha = null;

/* ---------- GitHub API ---------- */
async function api(path, opt = {}) {
  const r = await fetch('https://api.github.com/repos/' + gh.repo + path, {
    ...opt,
    headers: {
      Authorization: 'Bearer ' + gh.token,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    }
  });
  if (!r.ok && r.status !== 404) {
    const j = await r.json().catch(() => ({}));
    throw new Error(r.status + (j.message ? ': ' + j.message : ''));
  }
  return r;
}

const toB64 = s => {
  let bin = '';
  new TextEncoder().encode(s).forEach(c => bin += String.fromCharCode(c));
  return btoa(bin);
};
const fromB64 = b => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\n/g, '')), c => c.charCodeAt(0)));

async function loadDb() {
  const r = await api('/contents/' + DATA_PATH);
  if (r.status === 404) { sha = null; return; }   // repo baru, belum ada data
  const j = await r.json();
  sha = j.sha;
  db = { ...db, ...JSON.parse(fromB64(j.content)) };
  db.products = db.products || [];
}

async function commitDb(message) {
  const body = { message, content: toB64(JSON.stringify(db, null, 2)) };
  if (sha) body.sha = sha;
  const r = await api('/contents/' + DATA_PATH, { method: 'PUT', body: JSON.stringify(body) });
  sha = (await r.json()).content.sha;
}

// Perkecil gambar di browser lalu unggah ke images/
function resize(file, max) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.round(im.width * k);
      c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(im.src);
      res(c.toDataURL('image/webp', 0.82).split(',')[1]);
    };
    im.onerror = () => rej(new Error('File gambar tidak bisa dibaca.'));
    im.src = URL.createObjectURL(file);
  });
}
async function uploadImage(file, max, name) {
  const path = `images/${name}-${Date.now()}.webp`;
  await api('/contents/' + path, {
    method: 'PUT',
    body: JSON.stringify({ message: 'Upload ' + path, content: await resize(file, max) })
  });
  return path;
}

const say = (el, text) => { el.textContent = text; };
const busy = (btn, on) => { btn.disabled = on; };

/* ---------- Hubungkan ---------- */
async function start() {
  $('#connect').hidden = !!gh;
  $('#panel').hidden = !gh;
  if (!gh) return;
  try {
    await loadDb();
  } catch (e) {
    gh = null;
    localStorage.removeItem('gh');
    $('#connect').hidden = false;
    $('#panel').hidden = true;
    say($('#ghErr'), 'Gagal terhubung: ' + e.message);
    return;
  }
  fillSettings();
  renderList();
}

$('#ghForm').addEventListener('submit', async e => {
  e.preventDefault();
  gh = { repo: $('#ghRepo').value.trim().replace(/^https:\/\/github\.com\//, ''), token: $('#ghToken').value.trim() };
  busy($('#ghBtn'), true);
  say($('#ghErr'), '');
  try {
    const r = await api('');
    if (r.status === 404) throw new Error('Repo tidak ditemukan atau token tidak punya akses.');
    localStorage.setItem('gh', JSON.stringify(gh));
    $('#ghToken').value = '';
    await start();
  } catch (err) {
    gh = null;
    say($('#ghErr'), 'Gagal terhubung: ' + err.message);
  }
  busy($('#ghBtn'), false);
});

$('#logout').addEventListener('click', () => {
  localStorage.removeItem('gh');
  gh = null;
  start();
});

/* ---------- Pengaturan toko ---------- */
function fillSettings() {
  $('#cStore').value = db.store || '';
  $('#cWa').value = db.wa || '';
  $('#cLogoPrev').hidden = !db.logo;
  if (db.logo) $('#cLogoPrev').src = db.logo;
}

$('#cfgForm').addEventListener('submit', async e => {
  e.preventDefault();
  const wa = normWA($('#cWa').value);
  if (wa.length < 9) { say($('#cMsg'), 'Nomor WhatsApp tidak valid.'); return; }
  busy($('#cBtn'), true);
  say($('#cMsg'), 'Menyimpan...');
  try {
    const f = $('#cLogo').files[0];
    if (f) db.logo = await uploadImage(f, 400, 'logo');
    db.store = $('#cStore').value.trim();
    db.wa = wa;
    await commitDb('Update pengaturan toko');
    $('#cLogo').value = '';
    fillSettings();
    say($('#cMsg'), 'Tersimpan.');
  } catch (err) {
    say($('#cMsg'), 'Gagal: ' + err.message);
  }
  busy($('#cBtn'), false);
});

/* ---------- Produk ---------- */
function renderList() {
  $('#list').innerHTML = db.products.length
    ? db.products.map(p => `<li style="--c:${esc(p.hex)}">
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
  $('#pPrev').hidden = true;
  $('#formTitle').textContent = 'Tambah produk';
  $('#pCancel').hidden = true;
}

$('#pFile').addEventListener('change', e => {
  const f = e.target.files[0];
  if (f) { $('#pPrev').src = URL.createObjectURL(f); $('#pPrev').hidden = false; }
});

$('#pForm').addEventListener('submit', async e => {
  e.preventDefault();
  const sizes = [...new Set($('#pSizes').value.split(/[\s,]+/).filter(Boolean).map(v => (isNaN(v) ? v : Number(v))))]
    .sort((a, b) => (a > b ? 1 : -1));
  if (!sizes.length) { say($('#pMsg'), 'Isi minimal satu size.'); return; }

  const id = $('#pId').value || 'p' + Date.now();
  const old = db.products.find(p => p.id === id);
  busy($('#pSave'), true);
  say($('#pMsg'), 'Menyimpan...');
  try {
    const f = $('#pFile').files[0];
    const img = f ? await uploadImage(f, 900, 'produk') : (old ? old.img : '');
    const prod = {
      id,
      name: $('#pName').value.trim(),
      brand: $('#pBrand').value.trim(),
      sizes,
      color: $('#pColor').value.trim(),
      hex: $('#pHex').value,
      price: Number($('#pPrice').value) || 0,
      img: img || '',
      created: old ? old.created : Date.now()
    };
    if (old) db.products[db.products.indexOf(old)] = prod; else db.products.push(prod);
    await commitDb((old ? 'Edit produk ' : 'Tambah produk ') + prod.name);
    renderList();
    resetForm();
    say($('#pMsg'), 'Produk tersimpan.');
  } catch (err) {
    say($('#pMsg'), 'Gagal: ' + err.message + '. Bila 409, muat ulang halaman lalu coba lagi.');
  }
  busy($('#pSave'), false);
});
$('#pCancel').addEventListener('click', resetForm);

$('#list').addEventListener('click', async e => {
  const ed = e.target.closest('[data-edit]');
  const del = e.target.closest('[data-del]');
  if (ed) {
    const p = db.products.find(x => x.id === ed.dataset.edit);
    if (!p) return;
    $('#pId').value = p.id;
    $('#pName').value = p.name;
    $('#pBrand').value = p.brand;
    $('#pSizes').value = p.sizes.join(', ');
    $('#pPrice').value = p.price;
    $('#pColor').value = p.color;
    $('#pHex').value = p.hex;
    $('#pFile').value = '';
    $('#pPrev').hidden = !p.img;
    if (p.img) $('#pPrev').src = p.img;
    $('#formTitle').textContent = 'Edit produk';
    $('#pCancel').hidden = false;
    $('#pForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (del) {
    const p = db.products.find(x => x.id === del.dataset.del);
    if (!p || !confirm(`Hapus "${p.name}"?`)) return;
    try {
      db.products = db.products.filter(x => x.id !== p.id);
      await commitDb('Hapus produk ' + p.name);
      renderList();
    } catch (err) {
      say($('#pMsg'), 'Gagal menghapus: ' + err.message);
      await loadDb();
      renderList();
    }
  }
});

start();
