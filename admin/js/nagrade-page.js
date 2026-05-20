
let allRows = [];
let editingId = null;
let pendingRecipients = []; // working copy while editing

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
    if ((r.category || '').toLowerCase().includes(q)) return true;
    if ((r.show_title || '').toLowerCase().includes(q)) return true;
    if ((r.role_or_description || '').toLowerCase().includes(q)) return true;
    const recips = r.recipients || [];
    return recips.some(x => (x.name || '').toLowerCase().includes(q));
  });
  const body = document.getElementById('rowsBody');
  if (filtered.length === 0) { body.innerHTML = '<tr><td colspan="7" class="empty">Ni nagrad</td></tr>'; return; }
  body.innerHTML = filtered.map(r => {
    const recipients = r.recipients || [];
    let recipientLabel;
    if (recipients.length === 0) {
      recipientLabel = '<span style="color:var(--c-muted);">—</span>';
    } else if (recipients.length === 1) {
      recipientLabel = escapeHtml(recipients[0].name || '—');
    } else {
      recipientLabel = recipients.map(x => escapeHtml(x.name)).join(', ') + ` <span style="color:var(--c-muted); font-size:.78rem;">(${recipients.length})</span>`;
    }
    return `
      <tr>
        <td><strong style="font-family:var(--font-display); font-size:1.2rem; color:var(--c-red);">${r.year}</strong></td>
        <td>${escapeHtml(r.category)}</td>
        <td>${recipientLabel}</td>
        <td>${escapeHtml(r.role_or_description || '')}</td>
        <td><em>${escapeHtml(r.show_title || '')}</em></td>
        <td>${r.is_highlight ? '<span class="status-pill status-pill--active">★</span>' : '<span style="color:var(--c-muted);">—</span>'}</td>
        <td class="actions"><button class="icon-btn" onclick="openEditForm('${r.id}')">✎</button></td>
      </tr>
    `;
  }).join('');
}

function showList() {
  document.getElementById('listView').classList.remove('hide');
  document.getElementById('editView').classList.add('hide');
  editingId = null;
  pendingRecipients = [];
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
    form.show_title.value = r.show_title || '';
    form.role_or_description.value = r.role_or_description || '';
    form.is_highlight.checked = !!r.is_highlight;
    pendingRecipients = JSON.parse(JSON.stringify(r.recipients || []));
    document.getElementById('deleteBtn').style.display = '';
  } else {
    document.getElementById('editTitle').textContent = 'Nova nagrada';
    document.getElementById('deleteBtn').style.display = 'none';
    form.year.value = new Date().getFullYear();
    form.display_order.value = 100;
    pendingRecipients = [];
  }
  renderRecipientsEditor();
}

function renderRecipientsEditor() {
  const root = document.getElementById('recipientsEditor');
  if (!root) return;
  if (pendingRecipients.length === 0) {
    root.innerHTML = '<p style="color:var(--c-muted); padding:.5rem 0; font-size:.88rem;">Brez konkretnih prejemnikov (nagrada predstavi/produkciji). Dodajte spodaj, če gre za individualno nagrado.</p>';
  } else {
    root.innerHTML = pendingRecipients.map((r, i) => `
      <div style="display:grid; grid-template-columns: 1fr 1.4fr auto; gap:.6rem; align-items:end; padding:.7rem; background:var(--c-bg); border-radius:6px; margin-bottom:.5rem;">
        <div class="form-row" style="margin:0;">
          <label style="font-size:.7rem;">Prejemnik *</label>
          <input type="text" value="${escapeHtml(r.name || '')}" oninput="updateRecipient(${i}, 'name', this.value)" placeholder="Ime in priimek">
        </div>
        <div class="form-row" style="margin:0;">
          <label style="font-size:.7rem;">Vloga / Opis (neobvezno)</label>
          <input type="text" value="${escapeHtml(r.role_or_description || '')}" oninput="updateRecipient(${i}, 'role_or_description', this.value)" placeholder="npr. vloga Katurian">
        </div>
        <button type="button" class="icon-btn icon-btn--danger" onclick="removeRecipient(${i})" title="Odstrani prejemnika">✕</button>
      </div>
    `).join('');
  }
}

function updateRecipient(idx, field, value) {
  if (!pendingRecipients[idx]) return;
  pendingRecipients[idx][field] = value || null;
}

function addRecipient() {
  pendingRecipients.push({ name: '', role_or_description: null });
  renderRecipientsEditor();
}

function removeRecipient(idx) {
  pendingRecipients.splice(idx, 1);
  renderRecipientsEditor();
}

async function saveRow(e) {
  e.preventDefault();
  const form = e.target;
  const isNew = !editingId;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Shranjujem…';

  try {
    // Validate recipients
    const cleanRecipients = pendingRecipients
      .filter(r => r.name && r.name.trim())
      .map(r => ({ name: r.name.trim(), role_or_description: r.role_or_description || null }));

    // Legacy columns: keep first recipient as the "primary"
    const primary = cleanRecipients[0] || { name: null, role_or_description: null };

    const row = {
      year: parseInt(form.year.value, 10),
      category: form.category.value,
      recipient: primary.name,
      role_or_description: form.role_or_description.value || primary.role_or_description || null,
      show_title: form.show_title.value || null,
      is_highlight: form.is_highlight.checked,
      display_order: parseInt(form.display_order.value, 10) || 100,
      recipients: cleanRecipients,
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

window.openEditForm = openEditForm;
window.showList = showList;
window.saveRow = saveRow;
window.deleteRow = deleteRow;
window.loadList = loadList;
window.updateRecipient = updateRecipient;
window.addRecipient = addRecipient;
window.removeRecipient = removeRecipient;
