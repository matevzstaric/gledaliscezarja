
let allRows = [];
let editingId = null;
let pendingFile = null;
const GROUP_LABELS = {
  igralci: 'Članstvo',
  teatrarij: 'Teatrarij',
  tehnika: 'Tehnika',
  vodstvo: 'Vodstvo',
  ostali: 'Ostale',
};

(async function() {
  const user = await admin.init();
  if (!user) return;
  await loadList();
  document.getElementById('searchBox').addEventListener('input', renderTable);
  document.getElementById('groupFilter').addEventListener('change', renderTable);
  document.getElementById('portraitFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.getElementById('portraitPreview');
      img.src = ev.target.result;
      img.classList.remove('hide');
      document.getElementById('portraitDropText').textContent = 'Izbrano: ' + file.name;
    };
    reader.readAsDataURL(file);
  });
})();

async function loadList() {
  const { data: rows, error } = await sb.from('ensemble_members').select('*').order('group_name').order('display_order');
  if (error) { admin.toast('Napaka: ' + error.message, 'error'); return; }
  allRows = rows;
  renderTable();
}

function escapeHtml(s) { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function renderTable() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  const grp = document.getElementById('groupFilter').value;
  const filtered = allRows.filter(r => {
    if (grp && r.group_name !== grp) return false;
    if (!q) return true;
    return (r.full_name || '').toLowerCase().includes(q)
        || (r.role || '').toLowerCase().includes(q);
  });
  const body = document.getElementById('rowsBody');
  if (filtered.length === 0) { body.innerHTML = '<tr><td colspan="7" class="empty">Ni članov</td></tr>'; return; }
  body.innerHTML = filtered.map(r => {
    const initials = r.full_name.split(/\s+/).filter(Boolean).slice(0,2).map(n => n[0]).join('').toUpperCase();
    const photo = r.portrait_url
      ? `<img src="${r.portrait_url}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">`
      : `<div style="width:40px; height:40px; border-radius:50%; background:#444; color:#bbb; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:.8rem;">${initials}</div>`;
    return `
      <tr>
        <td>${photo}</td>
        <td><strong>${escapeHtml(r.full_name)}</strong></td>
        <td>${GROUP_LABELS[r.group_name] || r.group_name}</td>
        <td>${escapeHtml(r.role || '')}</td>
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
  document.getElementById('portraitPreview').classList.add('hide');
  document.getElementById('portraitDropText').textContent = 'Kliknite za nalaganje slike';

  if (id) {
    const r = allRows.find(x => x.id === id);
    if (!r) return;
    document.getElementById('editTitle').textContent = 'Uredi: ' + r.full_name;
    document.getElementById('fieldId').value = r.id;
    form.full_name.value = r.full_name;
    form.group_name.value = r.group_name;
    form.role.value = r.role || '';
    form.position_title.value = r.position_title || '';
    form.display_order.value = r.display_order || 100;
    form.active.checked = r.active !== false;
    document.getElementById('deleteBtn').style.display = '';
    if (r.portrait_url) {
      const img = document.getElementById('portraitPreview');
      img.src = r.portrait_url;
      img.classList.remove('hide');
      document.getElementById('portraitDropText').textContent = 'Trenutni portret (klik za zamenjavo)';
    }
  } else {
    document.getElementById('editTitle').textContent = 'Nov član';
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
      full_name: form.full_name.value,
      group_name: form.group_name.value,
      role: form.role.value,
      position_title: form.position_title.value || null,
      display_order: parseInt(form.display_order.value, 10) || 100,
      active: form.active.checked,
    };

    let res;
    if (isNew) {
      res = await sb.from('ensemble_members').insert(row).select().single();
    } else {
      res = await sb.from('ensemble_members').update(row).eq('id', editingId).select().single();
    }
    if (res.error) throw res.error;
    const memberId = res.data.id;

    if (pendingFile) {
      const url = await admin.uploadPortrait(pendingFile, memberId);
      await sb.from('ensemble_members').update({ portrait_url: url }).eq('id', memberId);
    }

    admin.toast(isNew ? 'Član dodan.' : 'Spremembe shranjene.');
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
  if (!admin.confirm(`Res želite izbrisati člana »${r.full_name}«?`)) return;
  const { error } = await sb.from('ensemble_members').delete().eq('id', editingId);
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
