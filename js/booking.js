/* =============================================================
   Booking flow (Supabase-backed)
   1. Pick show  →  2. Pick performance  →  3. Pick seats
   →  4. Assign ticket type per seat in cart  →  5. Checkout (mock)
   ============================================================= */

const state = {
  shows: [],              // all shows loaded
  ticketLabels: {},       // {redna: 'Redna cena', ...}
  showId: null,
  performanceId: null,
  selected: [],           // [{ key, row, side, num, ticketType }]
  takenSeats: new Set(),  // set of seat keys
};

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', async () => {
  // Load ticket labels from site_settings (with fallback)
  const settings = await data.getSettings();
  state.ticketLabels = {
    redna:        settings.ticket_label_redna       || TICKET_LABEL_FALLBACK.redna,
    studentska:   settings.ticket_label_studentska  || TICKET_LABEL_FALLBACK.studentska,
    upokojenska:  settings.ticket_label_upokojenska || TICKET_LABEL_FALLBACK.upokojenska,
    otroska:      settings.ticket_label_otroska     || TICKET_LABEL_FALLBACK.otroska,
  };

  // Load all shows (active or upcoming) with at least one upcoming performance
  state.shows = await data.listShows();

  await renderShowPicker();

  // Optional URL params: ?show=X&performance=Y to jump straight in
  const params = new URLSearchParams(window.location.search);
  if (params.get('show')) {
    await selectShow(params.get('show'));
    if (params.get('performance')) {
      await selectPerformance(params.get('performance'));
    }
  }
});

// ---------- 1. SHOW PICKER ----------
async function renderShowPicker() {
  const root = document.getElementById('showPicker');
  if (!root) return;

  // Only shows that have at least one upcoming performance
  const showsWithPerformances = [];
  for (const s of state.shows) {
    const perfs = await data.listPerformancesForShow(s.id);
    if (perfs.length > 0) showsWithPerformances.push({ ...s, _perfCount: perfs.length });
  }

  if (showsWithPerformances.length === 0) {
    root.innerHTML = `
      <span class="eyebrow">1. korak</span>
      <h2 class="mt-0">Trenutno ni napovedanih predstav</h2>
      <p class="lead">Spremljajte nas za nove termine.</p>
    `;
    return;
  }

  root.innerHTML = `
    <span class="eyebrow">1. korak</span>
    <h2 class="mt-0">Izberite predstavo</h2>
    <p class="lead">Aktualne predstave Gledališča Zarja Celje s prostimi termini.</p>
    <div class="show-picker">
      ${showsWithPerformances.map(s => {
        const p = s.pricing || {};
        const redna = p.redna;
        const otroska = p.otroska;
        const priceLabel = redna && otroska && otroska < redna
          ? `Redna ${redna} €, otroška ${otroska} €`
          : (redna ? `${redna} €` : '—');
        return `
          <button class="show-option" onclick="selectShow('${s.id}')">
            <h3>${s.title}</h3>
            <div class="meta">${s.type} · ${s.duration_minutes} min · ${s.director}</div>
            <span class="date">${s._perfCount} ${s._perfCount === 1 ? 'termin' : (s._perfCount < 5 ? 'termini' : 'terminov')}</span>
            <div style="margin-top:.8rem; font-size:.85rem; color:var(--c-muted);">${priceLabel}</div>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

// ---------- 2. SELECT SHOW ----------
async function selectShow(showId) {
  state.showId = showId;
  state.performanceId = null;
  state.selected = [];
  state.takenSeats.clear();

  const show = await data.getShow(showId);
  if (!show) return;
  state._currentShow = show;

  document.getElementById('showPicker').classList.add('hide');
  const perfRoot = document.getElementById('performancePicker');
  perfRoot.classList.remove('hide');

  const perfs = await data.listPerformancesForShow(showId);

  perfRoot.innerHTML = `
    <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap; margin-bottom:.5rem;">
      <button class="btn btn--ghost" style="color:var(--c-anthracite) !important; border-color:var(--c-line);" onclick="backToShows()">← Druga predstava</button>
      <span class="eyebrow" style="margin:0;">2. korak</span>
    </div>
    <h2 class="mt-0">${show.title}</h2>
    <p class="lead">${show.description || ''}<br>
      <strong style="color:var(--c-ink);">${show.type} · Režija: ${show.director} · ${show.duration_minutes} min</strong>
    </p>

    <h3 style="margin-top:2rem;">Izberite termin</h3>
    <div class="show-picker">
      ${perfs.map(p => `
        <button class="show-option" onclick="selectPerformance('${p.id}')">
          <h3 style="text-transform:capitalize;">${fmtWeekday(p.performance_date)}</h3>
          <div class="meta">${fmtDateLong(p.performance_date)} ob <strong style="color:var(--c-ink);">${fmtTime(p.performance_time)}</strong></div>
          <span class="date">Prosti sedeži na voljo</span>
        </button>
      `).join('')}
    </div>
  `;
}

function backToShows() {
  state.showId = null;
  state.performanceId = null;
  state.selected = [];
  document.getElementById('showPicker').classList.remove('hide');
  document.getElementById('performancePicker').classList.add('hide');
  document.getElementById('bookingLayout').classList.add('hide');
}

// ---------- 3. SELECT PERFORMANCE → seat picker ----------
async function selectPerformance(performanceId) {
  state.performanceId = performanceId;
  state.selected = [];

  const show = state._currentShow;
  if (!show) return;
  const perfs = await data.listPerformancesForShow(state.showId);
  const perf = perfs.find(p => p.id === performanceId);
  if (!perf) return;
  state._currentPerformance = perf;

  // Load taken seats
  const takenKeys = await data.listBookedSeatsForPerformance(performanceId);
  state.takenSeats = new Set(takenKeys);

  document.getElementById('performancePicker').classList.add('hide');
  const layout = document.getElementById('bookingLayout');
  layout.classList.remove('hide');

  layout.innerHTML = `
    <div class="theatre-stage">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
        <button class="btn btn--ghost" style="color:var(--c-anthracite) !important; border-color:var(--c-line);" onclick="backToPerformances()">← Drug termin</button>
        <div style="text-align:right;">
          <div style="font-family:var(--font-display); font-size:1.3rem; font-weight:700;">${show.title}</div>
          <div style="color:var(--c-muted); font-size:.9rem; text-transform:capitalize;">${fmtWeekday(perf.performance_date)}, ${fmtDateLong(perf.performance_date)} ob ${fmtTime(perf.performance_time)}</div>
        </div>
      </div>

      <div class="stage-bar">ODER</div>
      <div class="seat-map" id="seatMap"></div>

      <div class="legend">
        <div class="legend__item"><span class="legend__swatch" style="background:#d6d4cf;"></span> Prost</div>
        <div class="legend__item"><span class="legend__swatch" style="background:var(--c-red);"></span> Vaša izbira</div>
        <div class="legend__item"><span class="legend__swatch" style="background:repeating-linear-gradient(45deg, #bbb 0 4px, #aaa 4px 8px);"></span> Zaseden</div>
      </div>
    </div>

    <aside class="cart" id="cart"></aside>
  `;

  renderSeatMap();
  renderCart();
}

function backToPerformances() {
  state.performanceId = null;
  state.selected = [];
  selectShow(state.showId);
  document.getElementById('bookingLayout').classList.add('hide');
}

// ---------- SEAT MAP — sections, rows, L/R sides ----------
function renderSeatMap() {
  const root = document.getElementById('seatMap');
  const selectedKeys = new Set(state.selected.map(s => s.key));

  let html = '';
  DVORANA.sections.forEach((section, secIdx) => {
    html += `<div class="section-label">${section.label}</div>`;
    section.rows.forEach(row => {
      let rowHtml = `<div class="row-label">${row.num}</div>`;

      // LEFT side: seats numbered from outer (1) to inner (leftSeats)
      for (let n = 1; n <= row.leftSeats; n++) {
        rowHtml += renderSeatButton(row.num, 'L', n, selectedKeys);
      }

      // Center aisle gap only for rows that physically have it (e.g. 9-10 with staircase)
      if (row.centerAisle) {
        rowHtml += `<div class="aisle"></div>`;
      }

      // RIGHT side: seats numbered from inner (rightSeats) to outer (1)
      for (let n = row.rightSeats; n >= 1; n--) {
        rowHtml += renderSeatButton(row.num, 'R', n, selectedKeys);
      }

      rowHtml += `<div class="row-label row-label--right">${row.num}</div>`;
      html += `<div class="seat-row">${rowHtml}</div>`;
    });

    // Aisle gap between sections
    if (secIdx < DVORANA.sections.length - 1) {
      html += `<div class="section-gap"></div>`;
    }
  });

  root.innerHTML = html;
}

function renderSeatButton(row, side, num, selectedKeys) {
  const key = seatKey(row, side, num);
  const taken = state.takenSeats.has(key);
  const selected = selectedKeys.has(key);
  let cls = 'seat';
  if (taken) cls += ' taken';
  if (selected) cls += ' selected';
  const sideLabel = side === 'L' ? 'levo' : 'desno';
  return taken
    ? `<button class="${cls}" disabled aria-label="Vrsta ${row}, ${sideLabel} ${num}, zaseden"></button>`
    : `<button class="${cls}" data-seat="${key}" aria-label="Vrsta ${row}, ${sideLabel} ${num}" onclick="toggleSeat('${key}')">${num}</button>`;
}

// ---------- TOGGLE SEAT ----------
function toggleSeat(key) {
  const idx = state.selected.findIndex(s => s.key === key);
  if (idx >= 0) {
    state.selected.splice(idx, 1);
  } else {
    if (state.selected.length >= 10) {
      alert('Naenkrat lahko kupite največ 10 vstopnic. Za večje skupine nas kontaktirajte na info@kud-zarja.si.');
      return;
    }
    const { row, side, num } = parseSeatKey(key);
    state.selected.push({ key, row, side: side, num, ticketType: 'redna' });
  }
  // Update visual
  const btn = document.querySelector(`[data-seat="${key}"]`);
  if (btn) btn.classList.toggle('selected');
  renderCart();
}

function changeTicketType(key, newType) {
  const s = state.selected.find(x => x.key === key);
  if (s) {
    s.ticketType = newType;
    renderCart();
  }
}

// ---------- CART ----------
function renderCart() {
  const root = document.getElementById('cart');
  if (!root) return;
  const show = state._currentShow;
  const pricing = show.pricing || {};

  if (state.selected.length === 0) {
    root.innerHTML = `
      <h3>Vaša košarica</h3>
      <div class="cart__empty">Izberite sedeže na shemi.</div>
      <div style="margin-top:1.5rem; padding:1rem; background:var(--c-bg); border-radius:6px; font-size:.85rem; color:var(--c-muted);">
        <strong style="color:var(--c-ink);">Cene</strong><br>
        ${state.ticketLabels.redna}: <strong>${pricing.redna || '—'} €</strong><br>
        ${state.ticketLabels.studentska}: <strong>${pricing.studentska || '—'} €</strong><br>
        ${state.ticketLabels.upokojenska}: <strong>${pricing.upokojenska || '—'} €</strong><br>
        ${state.ticketLabels.otroska}: <strong>${pricing.otroska || '—'} €</strong>
      </div>
    `;
    return;
  }

  // Sort by row then side (L before R) then seat num
  const sorted = [...state.selected].sort((a, b) =>
    a.row - b.row || a.side.localeCompare(b.side) || a.num - b.num
  );

  const total = sorted.reduce((sum, s) => sum + (Number(pricing[s.ticketType]) || 0), 0);

  root.innerHTML = `
    <h3>Vaša košarica (${sorted.length})</h3>
    <ul class="cart__list">
      ${sorted.map(s => {
        const sideLabel = s.side === 'L' ? 'levo' : 'desno';
        const price = Number(pricing[s.ticketType]) || 0;
        return `
          <li class="cart__item">
            <div class="info" style="flex:1;">
              <span class="label">Vrsta ${s.row}, ${sideLabel} ${s.num}</span>
              <select onchange="changeTicketType('${s.key}', this.value)" style="margin-top:.3rem; padding:.3rem .5rem; font-size:.85rem; border:1px solid var(--c-line); border-radius:4px; background:#fff;">
                ${TICKET_TYPES.map(t => `<option value="${t}" ${s.ticketType === t ? 'selected' : ''}>${state.ticketLabels[t]} (${pricing[t] || '—'} €)</option>`).join('')}
              </select>
            </div>
            <span class="price">${price} €</span>
            <button onclick="toggleSeat('${s.key}')" aria-label="Odstrani">×</button>
          </li>
        `;
      }).join('')}
    </ul>
    <div class="cart__total">
      <span>Skupaj</span>
      <span class="grand">${total.toFixed(2)} €</span>
    </div>
    <button class="btn btn--primary" onclick="openCheckout()">Nadaljuj na plačilo →</button>
  `;
}

// ---------- CHECKOUT MODAL ----------
function openCheckout() {
  const show = state._currentShow;
  const perf = state._currentPerformance;
  const pricing = show.pricing || {};
  const sorted = [...state.selected].sort((a, b) =>
    a.row - b.row || a.side.localeCompare(b.side) || a.num - b.num
  );
  const total = sorted.reduce((sum, s) => sum + (Number(pricing[s.ticketType]) || 0), 0);

  const modal = document.getElementById('checkoutModal');
  modal.classList.add('open');

  document.getElementById('checkoutBody').innerHTML = `
    <button class="modal__close" onclick="closeCheckout()" aria-label="Zapri">×</button>
    <h2>Vaš nakup</h2>
    <p class="sub">${show.title} — ${fmtDateShort(perf.performance_date)} ob ${fmtTime(perf.performance_time)}</p>

    <div class="summary-box">
      ${sorted.map(s => {
        const sideLabel = s.side === 'L' ? 'levo' : 'desno';
        const price = Number(pricing[s.ticketType]) || 0;
        return `<div class="line"><span>Vrsta ${s.row}, ${sideLabel} ${s.num} — ${state.ticketLabels[s.ticketType]}</span><span>${price} €</span></div>`;
      }).join('')}
      <div class="line grand"><span>Skupaj (${sorted.length} ${sorted.length===1?'vstopnica':'vstopnic'})</span><span>${total.toFixed(2)} €</span></div>
    </div>

    <form id="checkoutForm" onsubmit="submitCheckout(event)">
      <div class="form-row--two">
        <div class="form-row"><label>Ime</label><input required type="text" name="firstName"></div>
        <div class="form-row"><label>Priimek</label><input required type="text" name="lastName"></div>
      </div>
      <div class="form-row"><label>E-naslov (za pošiljanje vstopnic)</label><input required type="email" name="email" placeholder="vase.ime@email.si"></div>
      <div class="form-row"><label>Telefon (neobvezno)</label><input type="tel" name="phone"></div>

      <div style="background:#fff7e6; border:1px solid #f0d97a; padding:.9rem 1.1rem; border-radius:6px; font-size:.85rem; margin-bottom:1rem;">
        <strong>Prototip:</strong> Plačila trenutno niso aktivna. Z oddajo obrazca boste videli simulirano potrditveno e-pošto in vstopnice.
      </div>

      <button type="submit" class="btn btn--primary" style="width:100%; justify-content:center;">Potrdi nakup · ${total.toFixed(2)} €</button>
    </form>
  `;
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
}

// ---------- SUBMIT (mock for now) ----------
function submitCheckout(e) {
  e.preventDefault();
  const form = e.target;
  const customer = {
    firstName: form.firstName.value,
    lastName:  form.lastName.value,
    email:     form.email.value,
    phone:     form.phone.value,
  };
  const show = state._currentShow;
  const perf = state._currentPerformance;
  const pricing = show.pricing || {};
  const sorted = [...state.selected].sort((a, b) =>
    a.row - b.row || a.side.localeCompare(b.side) || a.num - b.num
  );
  const total = sorted.reduce((sum, s) => sum + (Number(pricing[s.ticketType]) || 0), 0);
  const orderNo = 'ZRJ-' + Date.now().toString().slice(-7);

  // (In phase 2, this is where we POST to /api/checkout for real Stripe + DB write)

  document.getElementById('checkoutBody').innerHTML = `
    <button class="modal__close" onclick="closeAndReset()" aria-label="Zapri">×</button>
    <div style="text-align:center; margin-bottom:1.5rem;">
      <div style="width:64px; height:64px; border-radius:50%; background:#d9f5e0; color:#1d8a3a; display:inline-flex; align-items:center; justify-content:center; font-size:2rem; margin-bottom:.8rem;">✓</div>
      <h2 style="margin-bottom:.3rem;">Nakup uspešen!</h2>
      <p class="sub">Številka naročila: <strong style="color:var(--c-ink);">${orderNo}</strong></p>
    </div>

    ${sorted.map(s => {
      const sideLabel = s.side === 'L' ? 'levo' : 'desno';
      const price = Number(pricing[s.ticketType]) || 0;
      return `
        <div class="ticket">
          <div>
            <div class="ticket__brand">Gledališče Zarja Celje</div>
            <div class="ticket__title">${show.title}</div>
            <div class="ticket__meta" style="text-transform:capitalize;">${fmtWeekday(perf.performance_date)}, ${fmtDateShort(perf.performance_date)} ob ${fmtTime(perf.performance_time)} · ${show.duration_minutes} min</div>
            <div class="ticket__seats">Vrsta ${s.row}, ${sideLabel} ${s.num} · ${state.ticketLabels[s.ticketType]} · ${price} €</div>
            <div style="font-size:.75rem; color:var(--c-muted); margin-top:.4rem;">Imetnik: ${customer.firstName} ${customer.lastName}</div>
          </div>
          <div class="ticket__qr" aria-hidden="true"></div>
        </div>
      `;
    }).join('')}

    <div class="email-mock">
      <div class="email-mock__head">
        <div class="from">Od: Gledališče Zarja Celje &lt;info@kud-zarja.si&gt;</div>
        <div>Za: ${customer.email}</div>
        <div class="subject">Zadeva: Vaše vstopnice za »${show.title}« — naročilo ${orderNo}</div>
      </div>
      <div class="email-mock__body">
        <p>Pozdravljeni ${customer.firstName},</p>
        <p>hvala za nakup vstopnic v Gledališču Zarja Celje. V prilogi prejemate <strong>${sorted.length} ${sorted.length===1?'vstopnico':'vstopnic'}</strong> za predstavo:</p>
        <p style="background:#fff; border-left:3px solid var(--c-red); padding:.8rem 1rem; margin:1rem 0;">
          <strong>${show.title}</strong><br>
          <span style="text-transform:capitalize;">${fmtWeekday(perf.performance_date)}</span>, ${fmtDateLong(perf.performance_date)} ob ${fmtTime(perf.performance_time)}<br>
          <span style="color:var(--c-muted); font-size:.85rem;">Sedeži: ${sorted.map(s => `${s.row}/${s.side}${s.num}`).join(', ')} · Skupaj: ${total.toFixed(2)} €</span>
        </p>
        <p>Prosimo, pridite vsaj 15 minut pred začetkom predstave. Pri vhodu pokažite QR kodo z vstopnice (priloga PDF).</p>
        <p>Naslov: Kulturniška ulica 4, 3000 Celje<br>Informacije: 031 744 654</p>
        <p style="color:var(--c-muted); font-size:.85rem; margin-top:1.5rem;">— Ekipa Gledališča Zarja Celje</p>
      </div>
    </div>

    <div style="display:flex; gap:.6rem; margin-top:1.4rem; flex-wrap:wrap;">
      <button class="btn btn--primary" onclick="downloadTickets('${orderNo}')">⬇ Prenesi vstopnice</button>
      <button class="btn btn--ghost" style="color:var(--c-anthracite) !important; border-color:var(--c-line);" onclick="closeAndReset()">Zaključi</button>
    </div>
  `;
}

async function closeAndReset() {
  closeCheckout();
  state.selected = [];
  state.performanceId = null;
  state.showId = null;
  document.getElementById('bookingLayout').classList.add('hide');
  document.getElementById('performancePicker').classList.add('hide');
  document.getElementById('showPicker').classList.remove('hide');
  await renderShowPicker();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function downloadTickets(orderNo) {
  const show = state._currentShow;
  const perf = state._currentPerformance;
  const pricing = show.pricing || {};
  const sorted = [...state.selected].sort((a, b) =>
    a.row - b.row || a.side.localeCompare(b.side) || a.num - b.num
  );

  const lines = [
    '========================================',
    '   GLEDALIŠČE ZARJA CELJE',
    '   Vstopnice / Order: ' + orderNo,
    '========================================',
    '',
    'Predstava: ' + show.title,
    'Datum:     ' + fmtDateShort(perf.performance_date) + ' ob ' + fmtTime(perf.performance_time),
    'Trajanje:  ' + show.duration_minutes + ' min',
    'Režija:    ' + show.director,
    '',
    '----------------------------------------',
    'SEDEŽI',
    '----------------------------------------',
    ...sorted.map(s => {
      const sideLabel = s.side === 'L' ? 'levo' : 'desno';
      const price = Number(pricing[s.ticketType]) || 0;
      return `  Vrsta ${s.row}, ${sideLabel} ${String(s.num).padStart(2)} — ${state.ticketLabels[s.ticketType]} — ${price} €`;
    }),
    '----------------------------------------',
    'SKUPAJ:  ' + sorted.reduce((sum, s) => sum + (Number(pricing[s.ticketType]) || 0), 0).toFixed(2) + ' €',
    '----------------------------------------',
    '',
    'Naslov: Kulturniška ulica 4, 3000 Celje',
    'Info:   031 744 654 · info@kud-zarja.si',
    '',
    'Prosimo, pridite vsaj 15 minut pred',
    'začetkom predstave.',
    '',
    '========================================',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Zarja_${orderNo}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
