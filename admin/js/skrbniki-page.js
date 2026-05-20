
let allRows = [];

(async function() {
  const user = await admin.init();
  if (!user) return;
  await loadList();
})();

function escapeHtml(s) { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

async function loadList() {
  const { data: rows, error } = await sb.from('admin_users').select('*').order('created_at', { ascending: true });
  if (error) { admin.toast('Napaka: ' + error.message, 'error'); return; }
  allRows = rows;
  renderTable();
}

function renderTable() {
  const body = document.getElementById('rowsBody');
  if (allRows.length === 0) {
    body.innerHTML = '<tr><td colspan="4" class="empty">Ni skrbnikov</td></tr>';
    return;
  }
  const currentEmail = admin.user.email.toLowerCase();
  body.innerHTML = allRows.map(r => {
    const isMe = r.email.toLowerCase() === currentEmail;
    const created = new Date(r.created_at);
    const createdStr = `${created.getDate()}.${created.getMonth()+1}.${created.getFullYear()}`;
    const youBadge = isMe ? ' <span class="status-pill status-pill--active" style="font-size:.65rem;">Ti</span>' : '';
    const removeBtn = isMe
      ? '<span style="color:var(--c-muted); font-size:.8rem;">Sebe ne moreš odstraniti</span>'
      : `<button class="icon-btn icon-btn--danger" onclick="removeAdmin('${escapeHtml(r.email)}')" title="Odstrani skrbnika">✕</button>`;
    return `
      <tr>
        <td><strong>${escapeHtml(r.email)}</strong>${youBadge}</td>
        <td>${escapeHtml(r.full_name || '—')}</td>
        <td style="color:var(--c-muted); font-size:.85rem;">${createdStr}</td>
        <td class="actions">${removeBtn}</td>
      </tr>
    `;
  }).join('');
}

async function addAdmin(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value.trim().toLowerCase();
  const fullName = form.full_name.value.trim() || null;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Dodajam…';

  try {
    const { error } = await sb.from('admin_users').insert({ email, full_name: fullName });
    if (error) {
      if (error.code === '23505') {
        admin.toast('E-naslov je že na seznamu.', 'error');
      } else {
        throw error;
      }
    } else {
      admin.toast(`Dodan: ${email}`);
      form.reset();
      await loadList();
    }
  } catch (err) {
    admin.toast('Napaka: ' + (err.message || err), 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Dodaj skrbnika';
  }
}

async function removeAdmin(email) {
  if (!admin.confirm(`Res želite odstraniti skrbnika ${email}?\n\nIzgubili bodo dostop do admin strani takoj.`)) return;
  const { error } = await sb.from('admin_users').delete().eq('email', email);
  if (error) { admin.toast('Napaka: ' + error.message, 'error'); return; }
  admin.toast('Odstranjeno.');
  await loadList();
}

  // expose-to-window: ensure inline onclick handlers can find these regardless of scoping
  if (typeof addAdmin === "function") window.addAdmin = addAdmin;
  if (typeof removeAdmin === "function") window.removeAdmin = removeAdmin;
  if (typeof loadList === "function") window.loadList = loadList;
