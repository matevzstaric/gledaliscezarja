
let allRows = [];
let editingId = null;
let pendingFile = null;
const TIER_LABELS = { sponsor: 'Sponzor', donor: 'Donator', media: 'Medijski pokrovitelj' };

(async function() {
  const user = await admin.init();
  if (!user) return;
  await loadList();
  document.getElementById('searchBox').addEventListener('input', renderTable);
  document.getElementById('tierFilter').addEventListener('change', renderTable);
  document.getElementById('logoFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.getElementById('logoPreview');
      img.src = ev.target.result;
      img.classList.remove('hide');
      document.getElementById('logoDropText').textContent = 'Izbrano: ' + file.name;
    };
    reader.readAsDataURL(file);
  });
})();

async function loadList() {
  const { data: rows, error } = await sb.from('sponsors').select('*').order('tier').order('display_order');
  if (error) { admin.toast('Napaka: ' + error.message, 'error'); return; }
  allRows = rows;
  renderTable();
}

function renderTable() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  const tier = document.getElementById('tierFilter').value;
  const filtered = allRows.filter(r => {
    if (tier && r.tier !== tier) return false;
    if (!q) return true;
    return (r.name || '').toLowerCase().includes(q);
  });
  const body = document.getElementById('rowsBody');
  if (filtered.length === 0) { body.innerHTML = '<tr><td colspan="7" class="empty">Ni sponzorjev</td></tr>'; return; }
  body.innerHTML = filtered.map(r => {
    const logo = r.logo_url
      ? `<img src="${r.logo_url}" style="max-width:50px; max-height:40px; object-fit:contain;">`
      : '<div class="poster-thumb" style="width:50px; height:40px;"></div>';
    const link = r.website_url ? `<a href="${r.website_url}" target="_blank">${r.website_url.replace(/^https?:\/\//,'').slice(0,30)}</a>` : '<span style="color:var(--c-muted);">—</span>';
    return `
      <tr>
        <td>${logo}</td>
        <td><strong>${r.name}</strong></td>
        <td>${TIER_LABELS[r.tier] || r.tier}</td>
        <td>${link}</td>
        <td>${r.display_order}</td>
        <td>${r.active ? '✓' : '<span style="color:var(--c-muted);">ne</span>'}</td>
        <td class="actions"><button class="icon-btn" onclick="openEditForm('${r.id}')">✎</button></td>
      </tr>
    `;
  }).join('');
}

function showList() {
  document.getElementById('listView').classList.remove('hide');
  document.getElementById('editView').classList.add('hide');
  editingId = null;
  pendingFile = null;
}

function openEditForm(id) {
  document.getElementById('listView').classList.add('hide');
  document.getElementById('editView').classList.remove('hide');
  editingId = id || null;
  pendingFile = null;

  const form = document.getElementById('editForm');
  form.reset();
  document.getElementById('logoPreview').classList.add('hide');
  document.getElementById('logoDropText').textContent = 'Kliknite za nalaganje slike';

  if (id) {
    const r = allRows.find(x => x.id === id);
    if (!r) return;
    document.getElementById('editTitle').textContent = 'Uredi: ' + r.name;
    document.getElementById('fieldId').value = r.id;
    form.name.value = r.name;
    form.tier.value = r.tier;
    form.display_order.value = r.display_order || 100;
    form.website_url.value = r.website_url || '';
    form.active.checked = r.active !== false;
    document.getElementById('deleteBtn').style.display = '';
    if (r.logo_url) {
      const img = document.getElementById('logoPreview');
      img.src = r.logo_url;
      img.classList.remove('hide');
      document.getElementById('logoDropText').textContent = 'Trenutni logo (klik za zamenjavo)';
    }
  } else {
    document.getElementById('editTitle').textContent = 'Nov sponzor';
    document.getElementById('deleteBtn').style.display = 'none';
    form.display_order.value = 100;
    form.active.checked = true;
  }
}

async function saveRow(e) {
  e.preventDefault();
  const form = e.target;
  const isNew = !editingId;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Shranjujem…';

  try {
    const row = {
      name: form.name.value,
      tier: form.tier.value,
      display_order: parseInt(form.display_order.value, 10) || 100,
      website_url: form.website_url.value || null,
      active: form.active.checked,
    };

    let res;
    if (isNew) {
      res = await sb.from('sponsors').insert(row).select().single();
    } else {
      res = await sb.from('sponsors').update(row).eq('id', editingId).select().single();
    }
    if (res.error) throw res.error;
    const sponsorId = res.data.id;

    if (pendingFile) {
      const url = await admin.uploadLogo(pendingFile, sponsorId);
      await sb.from('sponsors').update({ logo_url: url }).eq('id', sponsorId);
    }

    admin.toast(isNew ? 'Sponzor dodan.' : 'Spremembe shranjene.');
    await loadList();
    showList();
  } catch (err) {
    admin.toast('Napaka: ' + (err.message || err), 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Shrani';
  }
}

async function deleteRow() {
  if (!editingId) return;
  const r = allRows.find(x => x.id === editingId);
  if (!r) return;
  if (!admin.confirm(`Res želite izbrisati sponzorja »${r.name}«?`)) return;
  const { error } = await sb.from('sponsors').delete().eq('id', editingId);
  if (error) { admin.toast('Napaka: ' + error.message, 'error'); return; }
  admin.toast('Izbrisano.');
  await loadList();
  showList();
}

  // expose-to-window: ensure inline onclick handlers can find these regardless of scoping
  if (typeof openEditForm === "function") window.openEditForm = openEditForm;
  if (typeof showList === "function") window.showList = showList;
  if (typeof saveRow === "function") window.saveRow = saveRow;
  if (typeof deleteRow === "function") window.deleteRow = deleteRow;
  if (typeof loadList === "function") window.loadList = loadList;
