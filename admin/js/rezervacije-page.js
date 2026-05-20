
let allRows = [];
const STATUS_LABELS = {
  pending:   { label: 'Čaka',       cls: 'status-pill--upcoming' },
  paid:      { label: 'Plačano',    cls: 'status-pill--active' },
  refunded:  { label: 'Vrnjeno',    cls: 'status-pill--archived' },
  cancelled: { label: 'Odpovedano', cls: 'status-pill--archived' },
};

(async function() {
  const user = await admin.init();
  if (!user) return;
  await loadList();
  document.getElementById('searchBox').addEventListener('input', renderTable);
  document.getElementById('statusFilter').addEventListener('change', renderTable);
})();

async function loadList() {
  // Pull bookings, then resolve performance + show via separate queries (more robust than nested join)
  const { data: rows, error } = await sb.from('bookings')
    .select('*, booking_seats(id)')
    .order('created_at', { ascending: false });
  if (error) {
    admin.toast('Napaka: ' + error.message, 'error');
    console.error('rezervacije loadList:', error);
    document.getElementById('rowsBody').innerHTML = `<tr><td colspan="8" class="empty">Napaka: ${error.message}</td></tr>`;
    return;
  }

  // Fetch related performances + shows in one go and join in memory
  const perfIds = [...new Set((rows || []).map(r => r.performance_id).filter(Boolean))];
  let perfMap = {};
  if (perfIds.length > 0) {
    const { data: perfs } = await sb.from('performances').select('*').in('id', perfIds);
    const showIds = [...new Set((perfs || []).map(p => p.show_id).filter(Boolean))];
    const { data: shows } = showIds.length > 0
      ? await sb.from('shows').select('id, title').in('id', showIds)
      : { data: [] };
    const showMap = Object.fromEntries((shows || []).map(s => [s.id, s]));
    perfMap = Object.fromEntries((perfs || []).map(p => [p.id, { ...p, show: showMap[p.show_id] || null }]));
  }

  allRows = (rows || []).map(r => ({ ...r, performance: perfMap[r.performance_id] || null }));
  renderTable();
}

function escapeHtml(s) { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function renderTable() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;
  const filtered = allRows.filter(r => {
    if (status && r.status !== status) return false;
    if (!q) return true;
    return (r.customer_name || '').toLowerCase().includes(q)
        || (r.customer_email || '').toLowerCase().includes(q);
  });

  const body = document.getElementById('rowsBody');
  if (filtered.length === 0) {
    body.innerHTML = '<tr><td colspan="8" class="empty">Še ni rezervacij. Ko bo plačilni sistem aktiven, se bodo pojavile tukaj.</td></tr>';
    return;
  }

  body.innerHTML = filtered.map(r => {
    const created = new Date(r.created_at);
    const createdStr = `${created.getDate()}.${created.getMonth()+1}.${created.getFullYear()} ${String(created.getHours()).padStart(2,'0')}:${String(created.getMinutes()).padStart(2,'0')}`;
    const perf = r.performance;
    const perfStr = perf
      ? `${perf.performance_date} ob ${(perf.performance_time||'').slice(0,5)}`
      : '—';
    const showTitle = perf?.show?.title || '—';
    const seatCount = (r.booking_seats || []).length;
    const st = STATUS_LABELS[r.status] || STATUS_LABELS.pending;
    return `
      <tr>
        <td>${createdStr}</td>
        <td><strong>${escapeHtml(showTitle)}</strong></td>
        <td style="font-size:.85rem; color:var(--c-anthracite);">${perfStr}</td>
        <td>${escapeHtml(r.customer_name)}</td>
        <td><a href="mailto:${escapeHtml(r.customer_email)}">${escapeHtml(r.customer_email)}</a></td>
        <td>${seatCount}</td>
        <td><strong>${Number(r.total_eur).toFixed(2)} €</strong></td>
        <td><span class="status-pill ${st.cls}">${st.label}</span></td>
      </tr>
    `;
  }).join('');
}

  // expose-to-window: ensure inline onclick handlers can find these regardless of scoping
  if (typeof loadList === "function") window.loadList = loadList;
