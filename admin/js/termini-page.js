
let allRows = [];
let allShows = [];
let editingId = null;
const STATUS_LABELS = {
  scheduled: { label: 'Načrtovano', cls: 'status-pill--active' },
  sold_out:  { label: 'Razprodano', cls: 'status-pill--upcoming' },
  cancelled: { label: 'Odpovedano', cls: 'status-pill--archived' },
};
// Local copies for full-name display (data.js has uppercase abbrevs; rename to avoid redeclaration)
const MONTHS_FULL_LC = ['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december'];
const DAYS_FULL_LC = ['nedelja','ponedeljek','torek','sreda','četrtek','petek','sobota'];

(async function() {
  const user = await admin.init();
  if (!user) return;
  await loadShows();
  await loadList();
  document.getElementById('showFilter').addEventListener('change', renderTable);
  document.getElementById('statusFilter').addEventListener('change', renderTable);
  document.getElementById('rangeFilter').addEventListener('change', renderTable);
})();

async function loadShows() {
  const { data: rows, error } = await sb.from('shows').select('id, title').order('title');
  if (error) { admin.toast('Napaka pri nalaganju predstav: ' + error.message, 'error'); return; }
  allShows = rows;
  const opts = rows.map(s => `<option value="${s.id}">${escapeHtml(s.title)}</option>`).join('');
  document.getElementById('showSelect').innerHTML = '<option value="">— Izberi —</option>' + opts;
  document.getElementById('showFilter').innerHTML = '<option value="">Vse predstave</option>' + opts;
}

async function loadList() {
  const { data: rows, error } = await sb.from('performances')
    .select('*')
    .order('performance_date', { ascending: true })
    .order('performance_time', { ascending: true });
  if (error) {
    admin.toast('Napaka pri nalaganju terminov: ' + error.message, 'error');
    console.error('loadList error:', error);
    document.getElementById('rowsBody').innerHTML = `<tr><td colspan="6" class="empty">Napaka: ${error.message}</td></tr>`;
    return;
  }
  // Attach show title from the already-loaded allShows array
  const showMap = Object.fromEntries(allShows.map(s => [s.id, s]));
  allRows = (rows || []).map(r => ({ ...r, show: showMap[r.show_id] || null }));
  renderTable();
}

function escapeHtml(s) { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function renderTable() {
  const show = document.getElementById('showFilter').value;
  const status = document.getElementById('statusFilter').value;
  const range = document.getElementById('rangeFilter').value;
  const today = new Date().toISOString().slice(0, 10);

  const filtered = allRows.filter(r => {
    if (show && r.show_id !== show) return false;
    if (status && r.status !== status) return false;
    if (range === 'upcoming' && r.performance_date < today) return false;
    return true;
  });

  const body = document.getElementById('rowsBody');
  if (filtered.length === 0) { body.innerHTML = '<tr><td colspan="6" class="empty">Ni terminov</td></tr>'; return; }

  body.innerHTML = filtered.map(r => {
    const d = new Date(r.performance_date + 'T00:00:00');
    const dateStr = `${DAYS_FULL_LC[d.getDay()]}, ${d.getDate()}. ${MONTHS_FULL_LC[d.getMonth()]} ${d.getFullYear()}`;
    const past = r.performance_date < today;
    const st = STATUS_LABELS[r.status] || STATUS_LABELS.scheduled;
    return `
      <tr style="${past ? 'opacity:.55;' : ''}">
        <td><strong style="text-transform:capitalize;">${dateStr}</strong></td>
        <td><strong>${(r.performance_time || '').slice(0,5)}</strong></td>
        <td>${escapeHtml(r.show?.title || '')}</td>
        <td><span class="status-pill ${st.cls}">${st.label}</span></td>
        <td style="color:var(--c-muted); font-size:.85rem;">${escapeHtml(r.notes || '')}</td>
        <td class="actions"><button class="icon-btn" onclick="openEditForm('${r.id}')">✎</button></td>
      </tr>
    `;
  }).join('');
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
    document.getElementById('editTitle').textContent = `Uredi termin: ${r.show?.title || ''}`;
    document.getElementById('fieldId').value = r.id;
    form.show_id.value = r.show_id;
    form.performance_date.value = r.performance_date;
    form.performance_time.value = (r.performance_time || '').slice(0, 5);
    form.status.value = r.status;
    form.notes.value = r.notes || '';
    document.getElementById('deleteBtn').style.display = '';
  } else {
    document.getElementById('editTitle').textContent = 'Nov termin';
    document.getElementById('deleteBtn').style.display = 'none';
    form.performance_time.value = '20:00';
    form.status.value = 'scheduled';
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
      show_id: form.show_id.value,
      performance_date: form.performance_date.value,
      performance_time: form.performance_time.value,
      status: form.status.value,
      notes: form.notes.value || null,
    };
    const res = isNew
      ? await sb.from('performances').insert(row).select().single()
      : await sb.from('performances').update(row).eq('id', editingId).select().single();
    if (res.error) throw res.error;
    admin.toast(isNew ? 'Termin dodan.' : 'Spremembe shranjene.');
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
  if (!admin.confirm('Res želite izbrisati ta termin? Vse povezane rezervacije bodo izgubljene.')) return;
  const { error } = await sb.from('performances').delete().eq('id', editingId);
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
