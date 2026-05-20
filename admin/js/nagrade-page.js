
let allRows = [];
let editingId = null;

(async function() {
  const user = await admin.init();
  if (!user) return;
  await loadList();
  document.getElementById('searchBox').addEventListener('input', renderTable);
  document.getElementById('categoryFilter').addEventListener('change', renderTable);
})();

async function loadList() {
  const { data: rows, error } = await sb.from('awards').select('*').order('year', { ascending: false }).order('display_order');
  if (error) { admin.toast('Napaka: ' + error.message, 'error'); return; }
  allRows = rows;

  // Refresh datalist + filter dropdown
  const cats = [...new Set(rows.map(r => r.category).filter(Boolean))].sort();
  document.getElementById('categoryList').innerHTML = cats.map(c => `<option value="${escapeAttr(c)}">`).join('');
  const filter = document.getElementById('categoryFilter');
  const prev = filter.value;
  filter.innerHTML = '<option value="">Vse kategorije</option>' + cats.map(c => `<option value="${escapeAttr(c)}"${c===prev?' selected':''}>${escapeHtml(c)}</option>`).join('');

  renderTable();
}

function escapeHtml(s) { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s) { return escapeHtml(s); }

function renderTable() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  const cat = document.getElementById('categoryFilter').value;
  const filtered = allRows.filter(r => {
    if (cat && r.category !== cat) return false;
    if (!q) return true;
    return (r.category || '').toLowerCase().includes(q)
        || (r.recipient || '').toLowerCase().includes(q)
        || (r.show_title || '').toLowerCase().includes(q)
        || (r.role_or_description || '').toLowerCase().includes(q);
  });
  const body = document.getElementById('rowsBody');
  if (filtered.length === 0) { body.innerHTML = '<tr><td colspan="7" class="empty">Ni nagrad</td></tr>'; return; }
  body.innerHTML = filtered.map(r => `
    <tr>
      <td><strong style="font-family:var(--font-display); font-size:1.2rem; color:var(--c-red);">${r.year}</strong></td>
      <td>${escapeHtml(r.category)}</td>
      <td>${escapeHtml(r.recipient || '—')}</td>
      <td>${escapeHtml(r.role_or_description || '')}</td>
      <td><em>${escapeHtml(r.show_title || '')}</em></td>
      <td>${r.is_highlight ? '<span class="status-pill status-pill--active">★</span>' : '<span style="color:var(--c-muted);">—</span>'}</td>
      <td class="actions"><button class="icon-btn" onclick="openEditForm('${r.id}')">✎</button></td>
    </tr>
  `).join('');
}

function showList() {
  document.getElementById('listView').classList.remove('hide');
  document.getElementById('editView').classList.add('hide');
  editingId = null;
}

function openEditForm(id) {
  document.getElementById('listView').classList.add('hide');
  document.getElementById('editView').classList.remove('hide');
  editingId = id || null;
  const form = document.getElementById('editForm');
  form.reset();

  if (id) {
    const r = allRows.find(x => x.id === id);
    if (!r) return;
    document.getElementById('editTitle').textContent = `Uredi: ${r.year} · ${r.category}`;
    document.getElementById('fieldId').value = r.id;
    form.year.value = r.year;
    form.display_order.value = r.display_order || 100;
    form.category.value = r.category || '';
    form.recipient.value = r.recipient || '';
    form.role_or_description.value = r.role_or_description || '';
    form.show_title.value = r.show_title || '';
    form.is_highlight.checked = !!r.is_highlight;
    document.getElementById('deleteBtn').style.display = '';
  } else {
    document.getElementById('editTitle').textContent = 'Nova nagrada';
    document.getElementById('deleteBtn').style.display = 'none';
    form.year.value = new Date().getFullYear();
    form.display_order.value = 100;
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
      year: parseInt(form.year.value, 10),
      category: form.category.value,
      recipient: form.recipient.value || null,
      role_or_description: form.role_or_description.value || null,
      show_title: form.show_title.value || null,
      is_highlight: form.is_highlight.checked,
      display_order: parseInt(form.display_order.value, 10) || 100,
    };
    const res = isNew
      ? await sb.from('awards').insert(row).select().single()
      : await sb.from('awards').update(row).eq('id', editingId).select().single();
    if (res.error) throw res.error;
    admin.toast(isNew ? 'Nagrada dodana.' : 'Spremembe shranjene.');
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
  if (!admin.confirm('Res želite izbrisati to nagrado?')) return;
  const { error } = await sb.from('awards').delete().eq('id', editingId);
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
