
let allRows = [];
let editingId = null;
let pendingFile = null;
let pendingMemberships = [];

const GROUP_LABELS = {
  igralci: 'Članstvo',
  teatrarij: 'Teatrarij',
  tehnika: 'Tehnika',
  vodstvo: 'Vodstvo',
  ostali: 'Ostale',
};
const GROUP_OPTIONS = Object.entries(GROUP_LABELS);

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
  const { data: rows, error } = await sb.from('ensemble_members').select('*');
  if (error) { admin.toast('Napaka: ' + error.message, 'error'); return; }
  allRows = (rows || []).sort((a, b) => {
    const aOrd = (a.memberships?.[0]?.display_order) ?? a.display_order ?? 1000;
    const bOrd = (b.memberships?.[0]?.display_order) ?? b.display_order ?? 1000;
    return aOrd - bOrd;
  });
  renderTable();
}

function escapeHtml(s) { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function memberInGroup(m, group) {
  return (m.memberships || []).some(x => x && x.group_name === group);
}

function renderTable() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  const grp = document.getElementById('groupFilter').value;
  const filtered = allRows.filter(r => {
    if (grp && !memberInGroup(r, grp)) return false;
    if (!q) return true;
    if ((r.full_name || '').toLowerCase().includes(q)) return true;
    return (r.memberships || []).some(m => (m.role || '').toLowerCase().includes(q));
  });
  const body = document.getElementById('rowsBody');
  if (filtered.length === 0) { body.innerHTML = '<tr><td colspan="7" class="empty">Ni članov</td></tr>'; return; }
  body.innerHTML = filtered.map(r => {
    const initials = r.full_name.split(/\s+/).filter(Boolean).slice(0,2).map(n => n[0]).join('').toUpperCase();
    const photo = r.portrait_url
      ? `<img src="${r.portrait_url}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">`
      : `<div style="width:40px; height:40px; border-radius:50%; background:#444; color:#bbb; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:.8rem;">${initials}</div>`;
    const memberships = r.memberships || [];
    const groupPills = memberships.map(m =>
      `<span style="display:inline-block; background:rgba(0,0,0,.06); padding:.15rem .55rem; border-radius:3px; font-size:.72rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; margin-right:.3rem;">${GROUP_LABELS[m.group_name] || m.group_name}</span>`
    ).join('');
    const rolesText = memberships.map(m =>
      `<div style="font-size:.85rem; line-height:1.3;"><span style="color:var(--c-muted); font-size:.72rem; text-transform:uppercase; letter-spacing:.06em;">${GROUP_LABELS[m.group_name] || m.group_name}:</span> ${escapeHtml(m.role || '—')}</div>`
    ).join('');
    return `
      <tr>
        <td>${photo}</td>
        <td><strong>${escapeHtml(r.full_name)}</strong></td>
        <td>${groupPills || '<span style="color:var(--c-muted);">—</span>'}</td>
        <td>${rolesText || '<span style="color:var(--c-muted);">—</span>'}</td>
        <td>${memberships.length}</td>
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
  pendingMemberships = [];
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
    form.active.checked = r.active !== false;
    document.getElementById('deleteBtn').style.display = '';
    if (r.portrait_url) {
      const img = document.getElementById('portraitPreview');
      img.src = r.portrait_url;
      img.classList.remove('hide');
      document.getElementById('portraitDropText').textContent = 'Trenutni portret (klik za zamenjavo)';
    }
    pendingMemberships = JSON.parse(JSON.stringify(r.memberships || []));
  } else {
    document.getElementById('editTitle').textContent = 'Nov član';
    document.getElementById('deleteBtn').style.display = 'none';
    form.active.checked = true;
    pendingMemberships = [{ group_name: 'igralci', role: 'Član', position_title: null, display_order: 100 }];
  }
  renderMembershipsEditor();
}

function renderMembershipsEditor() {
  const root = document.getElementById('membershipsEditor');
  if (!root) return;
  if (pendingMemberships.length === 0) {
    root.innerHTML = '<p style="color:var(--c-muted); padding:1rem 0;">Brez članstev v skupinah. Dodajte spodaj.</p>';
  } else {
    root.innerHTML = pendingMemberships.map((m, i) => `
      <div style="display:grid; grid-template-columns: 1fr 1.4fr 1fr 90px auto; gap:.6rem; align-items:end; padding:.8rem; background:var(--c-bg); border-radius:6px; margin-bottom:.6rem;">
        <div class="form-row" style="margin:0;">
          <label style="font-size:.7rem;">Skupina *</label>
          <select onchange="updateMembership(${i}, 'group_name', this.value)">
            ${GROUP_OPTIONS.map(([v, l]) => `<option value="${v}" ${m.group_name === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-row" style="margin:0;">
          <label style="font-size:.7rem;">Vloga / Funkcija *</label>
          <input type="text" value="${escapeHtml(m.role || '')}" oninput="updateMembership(${i}, 'role', this.value)" placeholder="npr. Igralka, Tajnica">
        </div>
        <div class="form-row" style="margin:0;">
          <label style="font-size:.7rem;">Naziv (vodstvo/ostale)</label>
          <input type="text" value="${escapeHtml(m.position_title || '')}" oninput="updateMembership(${i}, 'position_title', this.value)" placeholder="npr. Predsednik">
        </div>
        <div class="form-row" style="margin:0;">
          <label style="font-size:.7rem;">Vrstni red</label>
          <input type="number" value="${m.display_order ?? 100}" oninput="updateMembership(${i}, 'display_order', this.value)">
        </div>
        <button type="button" class="icon-btn icon-btn--danger" onclick="removeMembership(${i})" title="Odstrani iz skupine">✕</button>
      </div>
    `).join('');
  }
}

function updateMembership(idx, field, value) {
  if (!pendingMemberships[idx]) return;
  if (field === 'display_order') {
    pendingMemberships[idx][field] = parseInt(value, 10) || 100;
  } else {
    pendingMemberships[idx][field] = value || null;
  }
}

function addMembership() {
  const used = new Set(pendingMemberships.map(m => m.group_name));
  const next = GROUP_OPTIONS.find(([v]) => !used.has(v)) || GROUP_OPTIONS[0];
  pendingMemberships.push({ group_name: next[0], role: '', position_title: null, display_order: 100 });
  renderMembershipsEditor();
}

function removeMembership(idx) {
  pendingMemberships.splice(idx, 1);
  renderMembershipsEditor();
}

async function saveRow(e) {
  e.preventDefault();
  const form = e.target;
  const isNew = !editingId;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Shranjujem…';

  try {
    if (pendingMemberships.length === 0) {
      throw new Error('Član mora biti vsaj v eni skupini.');
    }
    for (const m of pendingMemberships) {
      if (!m.group_name) throw new Error('Vsako članstvo mora imeti skupino.');
      if (!m.role || !m.role.trim()) throw new Error('Vsako članstvo mora imeti vlogo.');
    }

    const primary = pendingMemberships[0];
    const row = {
      full_name: form.full_name.value,
      group_name: primary.group_name,
      role: primary.role,
      position_title: primary.position_title || null,
      display_order: primary.display_order || 100,
      active: form.active.checked,
      memberships: pendingMemberships,
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

window.openEditForm = openEditForm;
window.showList = showList;
window.saveRow = saveRow;
window.deleteRow = deleteRow;
window.loadList = loadList;
window.updateMembership = updateMembership;
window.addMembership = addMembership;
window.removeMembership = removeMembership;
