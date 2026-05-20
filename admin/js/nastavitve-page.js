
let allSettings = [];

(async function() {
  const user = await admin.init();
  if (!user) return;
  await loadSettings();
})();

async function loadSettings() {
  const { data: rows, error } = await sb.from('site_settings').select('*').order('key');
  if (error) { admin.toast('Napaka: ' + error.message, 'error'); return; }
  allSettings = rows;
  renderSettings();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderSettings() {
  const groups = {
    'Kontaktni podatki':         allSettings.filter(s => s.key.startsWith('contact_') || s.key.startsWith('address_')),
    'Pravni podatki':            allSettings.filter(s => ['legal_name','tax_number','registration_number'].includes(s.key)),
    'Domača stran — hero':       allSettings.filter(s => s.key.startsWith('hero_')),
    'Domača stran — trak novic': allSettings.filter(s => s.key.startsWith('news_strip_')),
    'Cene vstopnic — oznake':    allSettings.filter(s => s.key.startsWith('ticket_label_')),
  };
  const assigned = new Set(Object.values(groups).flat().map(s => s.key));
  groups['Ostalo'] = allSettings.filter(s => !assigned.has(s.key));

  const body = document.getElementById('settingsBody');
  body.innerHTML = Object.entries(groups)
    .filter(([_, rows]) => rows.length > 0)
    .map(([heading, rows]) => `
      <h3 class="subgroup-title" style="color:var(--c-anthracite); margin-top:2rem; margin-bottom:1rem;">${heading}</h3>
      ${rows.map(s => {
        const isLong = (s.value || '').length > 80 || s.key.includes('news_strip_text');
        const inputEl = isLong
          ? `<textarea data-key="${s.key}" rows="3">${escapeHtml(s.value || '')}</textarea>`
          : `<input data-key="${s.key}" type="text" value="${escapeHtml(s.value || '')}">`;
        return `
          <div class="form-row" style="margin-bottom:1.4rem;">
            <label>${s.description || s.key}</label>
            ${inputEl}
            <small style="color:var(--c-muted); font-size:.78rem; margin-top:.25rem;">Ključ: <code>${s.key}</code></small>
          </div>
        `;
      }).join('')}
    `).join('');
}

async function saveAll() {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Shranjujem…';

  const updates = [];
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    const oldVal = (allSettings.find(s => s.key === key) || {}).value || '';
    const newVal = el.value;
    if (oldVal !== newVal) updates.push({ key, value: newVal });
  });

  if (updates.length === 0) {
    admin.toast('Ni sprememb.');
    btn.disabled = false;
    btn.textContent = 'Shrani spremembe';
    return;
  }

  const { error } = await sb.from('site_settings').upsert(
    updates.map(u => ({ ...u, updated_at: new Date().toISOString() })),
    { onConflict: 'key' }
  );
  if (error) {
    admin.toast('Napaka: ' + error.message, 'error');
  } else {
    admin.toast(`Shranjeno: ${updates.length} ${updates.length === 1 ? 'sprememba' : 'sprememb'}.`);
    await loadSettings();
  }
  btn.disabled = false;
  btn.textContent = 'Shrani spremembe';
}

  // expose-to-window: ensure inline onclick handlers can find these regardless of scoping
  if (typeof saveAll === "function") window.saveAll = saveAll;
