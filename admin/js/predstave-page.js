
let allShows = [];
let editingId = null;
let pendingPosterFile = null;

(async function() {
  const user = await admin.init();
  if (!user) return;
  await loadList();

  // Wire up filters
  document.getElementById('searchBox').addEventListener('input', renderTable);
  document.getElementById('statusFilter').addEventListener('change', renderTable);

  // Wire up poster preview
  document.getElementById('posterFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingPosterFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.getElementById('posterPreview');
      img.src = ev.target.result;
      img.classList.remove('hide');
      document.getElementById('posterDropText').textContent = 'Izbrano: ' + file.name + ' (klik za zamenjavo)';
    };
    reader.readAsDataURL(file);
  });
})();

async function loadList() {
  const { data: rows, error } = await sb.from('shows').select('*').order('display_order');
  if (error) { admin.toast('Napaka pri nalaganju: ' + error.message, 'error'); return; }
  allShows = rows;
  renderTable();
}

function renderTable() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;
  const filtered = allShows.filter(s => {
    if (status && s.status !== status) return false;
    if (!q) return true;
    return (s.title||'').toLowerCase().includes(q)
        || (s.director||'').toLowerCase().includes(q)
        || (s.type||'').toLowerCase().includes(q);
  });

  const body = document.getElementById('showsBody');
  if (filtered.length === 0) {
    body.innerHTML = '<tr><td colspan="7" class="empty">Ni predstav</td></tr>';
    return;
  }

  body.innerHTML = filtered.map(s => {
    const poster = s.poster_url
      ? `<div class="poster-thumb" style="background-image:url('${s.poster_url}');"></div>`
      : `<div class="poster-thumb"></div>`;
    const pricing = s.pricing || {};
    const prices = ['redna','studentska','upokojenska','otroska']
      .map(k => pricing[k]).filter(v => v != null);
    const priceLabel = prices.length
      ? `${Math.min(...prices)}–${Math.max(...prices)} €`
      : '—';
    const statusCls = `status-pill status-pill--${s.status || 'active'}`;
    const statusLabel = s.status === 'upcoming' ? 'Prihajajoča' : (s.status === 'archived' ? 'Arhivirana' : 'Aktivna');
    return `
      <tr>
        <td>${poster}</td>
        <td><strong>${s.title}</strong><br><span style="color:var(--c-muted); font-size:.8rem;">${s.duration_minutes} min</span></td>
        <td>${s.type || ''}</td>
        <td>${s.director || ''}</td>
        <td><span class="${statusCls}">${statusLabel}</span></td>
        <td>${priceLabel}</td>
        <td class="actions">
          <button class="icon-btn" title="Uredi" onclick="openEditForm('${s.id}')">✎</button>
        </td>
      </tr>
    `;
  }).join('');
}

function showList() {
  document.getElementById('listView').classList.remove('hide');
  document.getElementById('editView').classList.add('hide');
  editingId = null;
  pendingPosterFile = null;
}

function openEditForm(id) {
  document.getElementById('listView').classList.add('hide');
  document.getElementById('editView').classList.remove('hide');
  editingId = id || null;
  pendingPosterFile = null;

  const form = document.getElementById('editForm');
  form.reset();
  document.getElementById('posterPreview').classList.add('hide');
  document.getElementById('posterDropText').textContent = 'Kliknite za nalaganje slike ali povlecite datoteko sem';

  if (id) {
    const s = allShows.find(x => x.id === id);
    if (!s) return;
    document.getElementById('editTitle').textContent = 'Uredi: ' + s.title;
    document.getElementById('fieldId').value = s.id;
    form.title.value = s.title;
    form.type.value = s.type || '';
    form.director.value = s.director || '';
    form.duration_minutes.value = s.duration_minutes || '';
    form.season.value = s.season || '';
    form.description.value = s.description || '';
    form.status.value = s.status || 'active';
    form.display_order.value = s.display_order || 100;
    const p = s.pricing || {};
    form.price_redna.value        = p.redna ?? '';
    form.price_studentska.value   = p.studentska ?? '';
    form.price_upokojenska.value  = p.upokojenska ?? '';
    form.price_otroska.value      = p.otroska ?? '';
    document.getElementById('deleteBtn').style.display = '';
    if (s.poster_url) {
      const img = document.getElementById('posterPreview');
      img.src = s.poster_url;
      img.classList.remove('hide');
      document.getElementById('posterDropText').textContent = 'Trenutni plakat (klik za zamenjavo)';
    }
  } else {
    document.getElementById('editTitle').textContent = 'Nova predstava';
    document.getElementById('deleteBtn').style.display = 'none';
    form.display_order.value = 100;
    form.status.value = 'active';
  }
}

async function saveShow(e) {
  e.preventDefault();
  const form = e.target;
  const isNew = !editingId;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Shranjujem…';

  try {
    const id = isNew ? slugify(form.title.value) : editingId;

    // Build pricing JSON, skipping empty fields
    const pricing = {};
    if (form.price_redna.value)        pricing.redna        = parseFloat(form.price_redna.value);
    if (form.price_studentska.value)   pricing.studentska   = parseFloat(form.price_studentska.value);
    if (form.price_upokojenska.value)  pricing.upokojenska  = parseFloat(form.price_upokojenska.value);
    if (form.price_otroska.value)      pricing.otroska      = parseFloat(form.price_otroska.value);

    // Upload poster first if a new file is pending
    let posterUrl = null;
    if (pendingPosterFile) {
      posterUrl = await admin.uploadPoster(pendingPosterFile, id);
    }

    const row = {
      id,
      title: form.title.value,
      type: form.type.value,
      director: form.director.value,
      duration_minutes: parseInt(form.duration_minutes.value, 10),
      season: form.season.value || null,
      description: form.description.value || null,
      status: form.status.value,
      display_order: parseInt(form.display_order.value, 10) || 100,
      pricing,
    };
    if (posterUrl) row.poster_url = posterUrl;

    let res;
    if (isNew) {
      res = await sb.from('shows').insert(row).select().single();
    } else {
      res = await sb.from('shows').update(row).eq('id', editingId).select().single();
    }

    if (res.error) throw res.error;
    admin.toast(isNew ? 'Predstava dodana.' : 'Spremembe shranjene.');
    await loadList();
    showList();
  } catch (err) {
    console.error(err);
    admin.toast('Napaka: ' + (err.message || err), 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Shrani';
  }
}

async function deleteShow() {
  if (!editingId) return;
  const s = allShows.find(x => x.id === editingId);
  if (!s) return;
  if (!admin.confirm(`Res želite izbrisati predstavo »${s.title}«?\n\nVsi termini in plakat bodo izgubljeni.`)) return;

  const { error } = await sb.from('shows').delete().eq('id', editingId);
  if (error) { admin.toast('Napaka: ' + error.message, 'error'); return; }
  admin.toast('Predstava izbrisana.');
  await loadList();
  showList();
}

  // expose-to-window: ensure inline onclick handlers can find these regardless of scoping
  if (typeof openEditForm === "function") window.openEditForm = openEditForm;
  if (typeof showList === "function") window.showList = showList;
  if (typeof loadList === "function") window.loadList = loadList;
