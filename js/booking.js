/* =============================================================
   Booking flow — show pick → performance pick → seat pick → checkout
   ============================================================= */

const STAGE_AISLE_AFTER = 7; // visual aisle gap appears after seat #7

const state = {
  showId: null,
  performanceId: null,
  selected: [], // ['row-seat', ...]
};

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  renderShowPicker();
  // Read URL params to optionally jump directly to a show
  const params = new URLSearchParams(window.location.search);
  if (params.get('show')) {
    selectShow(params.get('show'));
  }
});

// ---------- HELPER: only show future performances ----------
function upcomingPerformances(show) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return show.performances.filter(p => new Date(p.date + 'T00:00:00') >= today);
}

// ---------- SHOW PICKER ----------
function renderShowPicker() {
  const root = document.getElementById('showPicker');
  // Only show shows that have at least one upcoming performance
  const upcomingShows = SHOWS.filter(s => upcomingPerformances(s).length > 0);
  root.innerHTML = `
    <span class="eyebrow">1. korak</span>
    <h2 class="mt-0">Izberite predstavo</h2>
    <p class="lead">Trenutno aktualne predstave Gledališča Zarja Celje. Cene se razlikujejo glede na predstavo in vrsto sedeža.</p>
    <div class="show-picker">
      ${upcomingShows.map(s => {
        const upcoming = upcomingPerformances(s);
        return `
          <button class="show-option" onclick="selectShow('${s.id}')">
            <h3>${s.title}</h3>
            <div class="meta">${s.type} · ${s.duration} min · ${s.director}</div>
            <span class="date">${upcoming.length} ${upcoming.length === 1 ? 'termin' : (upcoming.length < 5 ? 'termini' : 'terminov')}</span>
            <div style="margin-top:.8rem; font-size:.85rem; color:var(--c-muted);">Od ${Math.min(...Object.values(s.pricing))} € do ${Math.max(...Object.values(s.pricing))} €</div>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

// ---------- SELECT SHOW ----------
function selectShow(showId) {
  state.showId = showId;
  state.performanceId = null;
  state.selected = [];
  const show = SHOWS.find(s => s.id === showId);
  if (!show) return;

  document.getElementById('showPicker').classList.add('hide');
  const perfRoot = document.getElementById('performancePicker');
  perfRoot.classList.remove('hide');

  perfRoot.innerHTML = `
    <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap; margin-bottom:.5rem;">
      <button class="btn btn--ghost" style="color:var(--c-anthracite) !important; border-color:var(--c-line);" onclick="backToShows()">← Druga predstava</button>
      <span class="eyebrow" style="margin:0;">2. korak</span>
    </div>
    <h2 class="mt-0">${show.title}</h2>
    <p class="lead">${show.description}<br><strong style="color:var(--c-ink);">${show.type} · Režija: ${show.director} · ${show.duration} min</strong></p>

    <h3 style="margin-top:2rem;">Izberite termin</h3>
    <div class="show-picker">
      ${upcomingPerformances(show).map(p => {
        const taken = (p.taken || []).length;
        const total = show.seatLayout.reduce((sum, row) => sum + [...row].filter(c => c !== '.').length, 0);
        const free = total - taken;
        return `
          <button class="show-option" onclick="selectPerformance('${p.id}')">
            <h3 style="text-transform:capitalize;">${weekdayName(p.date)}</h3>
            <div class="meta">${formatDate(p.date)} ob <strong style="color:var(--c-ink);">${p.time}</strong></div>
            <span class="date">${free} prostih sedežev</span>
          </button>
        `;
      }).join('')}
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

// ---------- SELECT PERFORMANCE — render seat picker ----------
function selectPerformance(performanceId) {
  state.performanceId = performanceId;
  state.selected = [];

  const show = SHOWS.find(s => s.id === state.showId);
  const perf = show.performances.find(p => p.id === performanceId);

  document.getElementById('performancePicker').classList.add('hide');
  const layout = document.getElementById('bookingLayout');
  layout.classList.remove('hide');

  // Sidebar (cart)
  layout.innerHTML = `
    <div class="theatre-stage">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
        <div>
          <button class="btn btn--ghost" style="color:var(--c-anthracite) !important; border-color:var(--c-line);" onclick="backToPerformances()">← Drug termin</button>
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--font-display); font-size:1.3rem; font-weight:700;">${show.title}</div>
          <div style="color:var(--c-muted); font-size:.9rem; text-transform:capitalize;">${weekdayName(perf.date)}, ${formatDate(perf.date)} ob ${perf.time}</div>
        </div>
      </div>

      <div class="stage-bar">ODER</div>
      <div class="seat-map" id="seatMap"></div>

      <div class="legend">
        <div class="legend__item"><span class="legend__swatch" style="background:#f5c5cf;"></span> ${TIER_NAMES.A} · ${show.pricing.A} €</div>
        <div class="legend__item"><span class="legend__swatch" style="background:#d6d4cf;"></span> ${TIER_NAMES.B} · ${show.pricing.B} €</div>
        <div class="legend__item"><span class="legend__swatch" style="background:#e4e2dd;"></span> ${TIER_NAMES.C} · ${show.pricing.C} €</div>
        <div class="legend__item"><span class="legend__swatch" style="background:repeating-linear-gradient(45deg, #bbb 0 4px, #aaa 4px 8px);"></span> Zaseden</div>
        <div class="legend__item"><span class="legend__swatch" style="background:var(--c-red);"></span> Vaša izbira</div>
      </div>
    </div>

    <aside class="cart" id="cart"></aside>
  `;

  renderSeatMap(show, perf);
  renderCart();
}

function backToPerformances() {
  state.performanceId = null;
  state.selected = [];
  selectShow(state.showId);
  document.getElementById('bookingLayout').classList.add('hide');
}

// ---------- RENDER SEAT MAP ----------
function renderSeatMap(show, perf) {
  const root = document.getElementById('seatMap');
  const taken = new Set(perf.taken || []);

  root.innerHTML = show.seatLayout.map((rowStr, rIdx) => {
    const rowNum = rIdx + 1;
    const seats = [...rowStr];
    let cells = `<div class="row-label">${rowNum}</div>`;
    seats.forEach((tier, sIdx) => {
      const seatNum = sIdx + 1;
      const key = `${rowNum}-${seatNum}`;
      if (tier === '.') {
        cells += `<div class="seat unavailable" aria-hidden="true"></div>`;
      } else {
        const isTaken = taken.has(key);
        const cls = `seat ${isTaken ? 'taken' : ''}`;
        cells += `<button class="${cls}" data-tier="${tier}" data-seat="${key}" ${isTaken ? 'disabled aria-label="Zaseden"' : `aria-label="Vrsta ${rowNum}, sedež ${seatNum}, ${TIER_NAMES[tier]}, ${show.pricing[tier]} €" onclick="toggleSeat('${key}','${tier}')"`}>${seatNum}</button>`;
      }
      // visual aisle after seat #7
      if (seatNum === STAGE_AISLE_AFTER) cells += `<div class="aisle"></div>`;
    });
    cells += `<div class="row-label row-label--right">${rowNum}</div>`;
    return `<div class="seat-row">${cells}</div>`;
  }).join('');
}

// ---------- SEAT TOGGLE ----------
function toggleSeat(key, tier) {
  const idx = state.selected.findIndex(s => s.key === key);
  if (idx >= 0) {
    state.selected.splice(idx, 1);
  } else {
    if (state.selected.length >= 10) {
      alert('Naenkrat lahko kupite največ 10 vstopnic. Za večje skupine nas kontaktirajte na info@kud-zarja.si.');
      return;
    }
    state.selected.push({ key, tier });
  }
  // Update visual
  const btn = document.querySelector(`[data-seat="${key}"]`);
  if (btn) btn.classList.toggle('selected');
  renderCart();
}

// ---------- CART ----------
function renderCart() {
  const root = document.getElementById('cart');
  const show = SHOWS.find(s => s.id === state.showId);

  if (state.selected.length === 0) {
    root.innerHTML = `
      <h3>Vaša košarica</h3>
      <div class="cart__empty">Izberite sedeže na shemi.</div>
    `;
    return;
  }

  // sort by row then seat
  const sorted = [...state.selected].sort((a, b) => {
    const [ar, as] = a.key.split('-').map(Number);
    const [br, bs] = b.key.split('-').map(Number);
    return ar - br || as - bs;
  });

  const total = sorted.reduce((sum, s) => sum + show.pricing[s.tier], 0);

  root.innerHTML = `
    <h3>Vaša košarica (${sorted.length})</h3>
    <ul class="cart__list">
      ${sorted.map(s => {
        const [r, num] = s.key.split('-');
        return `
          <li class="cart__item">
            <div class="info">
              <span class="label">Vrsta ${r}, sedež ${num}</span>
              <span class="tier">${TIER_NAMES[s.tier].split('·')[0].trim()}</span>
            </div>
            <span class="price">${show.pricing[s.tier]} €</span>
            <button onclick="toggleSeat('${s.key}','${s.tier}')" aria-label="Odstrani">×</button>
          </li>
        `;
      }).join('')}
    </ul>
    <div class="cart__total">
      <span>Skupaj</span>
      <span class="grand">${total} €</span>
    </div>
    <button class="btn btn--primary" onclick="openCheckout()">Nadaljuj na plačilo →</button>
  `;
}

// ---------- CHECKOUT MODAL ----------
function openCheckout() {
  const show = SHOWS.find(s => s.id === state.showId);
  const perf = show.performances.find(p => p.id === state.performanceId);
  const sorted = [...state.selected].sort((a, b) => {
    const [ar, as] = a.key.split('-').map(Number);
    const [br, bs] = b.key.split('-').map(Number);
    return ar - br || as - bs;
  });
  const total = sorted.reduce((sum, s) => sum + show.pricing[s.tier], 0);

  const modal = document.getElementById('checkoutModal');
  modal.classList.add('open');

  document.getElementById('checkoutBody').innerHTML = `
    <button class="modal__close" onclick="closeCheckout()" aria-label="Zapri">×</button>
    <h2>Vaš nakup</h2>
    <p class="sub">${show.title} — ${formatDateShort(perf.date)} ob ${perf.time}</p>

    <div class="summary-box">
      ${sorted.map(s => {
        const [r, num] = s.key.split('-');
        return `<div class="line"><span>Vrsta ${r}, sedež ${num} (${s.tier})</span><span>${show.pricing[s.tier]} €</span></div>`;
      }).join('')}
      <div class="line grand"><span>Skupaj (${sorted.length} ${sorted.length===1?'vstopnica':'vstopnic'})</span><span>${total} €</span></div>
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

      <button type="submit" class="btn btn--primary" style="width:100%; justify-content:center;">Potrdi nakup · ${total} €</button>
    </form>
  `;
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
}

// ---------- SUBMIT ----------
function submitCheckout(e) {
  e.preventDefault();
  const form = e.target;
  const customer = {
    firstName: form.firstName.value,
    lastName:  form.lastName.value,
    email:     form.email.value,
    phone:     form.phone.value,
  };
  const show = SHOWS.find(s => s.id === state.showId);
  const perf = show.performances.find(p => p.id === state.performanceId);
  const sorted = [...state.selected].sort((a, b) => {
    const [ar, as] = a.key.split('-').map(Number);
    const [br, bs] = b.key.split('-').map(Number);
    return ar - br || as - bs;
  });
  const total = sorted.reduce((sum, s) => sum + show.pricing[s.tier], 0);
  const orderNo = 'ZRJ-' + Date.now().toString().slice(-7);

  // Mark seats as taken in-memory (in real life this would be a server call)
  perf.taken = [...(perf.taken || []), ...sorted.map(s => s.key)];

  // Render confirmation (with simulated email)
  document.getElementById('checkoutBody').innerHTML = `
    <button class="modal__close" onclick="closeAndReset()" aria-label="Zapri">×</button>
    <div style="text-align:center; margin-bottom:1.5rem;">
      <div style="width:64px; height:64px; border-radius:50%; background:#d9f5e0; color:#1d8a3a; display:inline-flex; align-items:center; justify-content:center; font-size:2rem; margin-bottom:.8rem;">✓</div>
      <h2 style="margin-bottom:.3rem;">Nakup uspešen!</h2>
      <p class="sub">Številka naročila: <strong style="color:var(--c-ink);">${orderNo}</strong></p>
    </div>

    ${sorted.map(s => {
      const [r, num] = s.key.split('-');
      return `
        <div class="ticket">
          <div>
            <div class="ticket__brand">Gledališče Zarja Celje</div>
            <div class="ticket__title">${show.title}</div>
            <div class="ticket__meta" style="text-transform:capitalize;">${weekdayName(perf.date)}, ${formatDateShort(perf.date)} ob ${perf.time} · ${show.duration} min</div>
            <div class="ticket__seats">Vrsta ${r}, sedež ${num} · ${TIER_NAMES[s.tier].split('·')[0].trim()} · ${show.pricing[s.tier]} €</div>
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
          <span style="text-transform:capitalize;">${weekdayName(perf.date)}</span>, ${formatDate(perf.date)} ob ${perf.time}<br>
          <span style="color:var(--c-muted); font-size:.85rem;">Sedeži: ${sorted.map(s => `${s.key.split('-')[0]}/${s.key.split('-')[1]}`).join(', ')} · Skupaj: ${total} €</span>
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

function closeAndReset() {
  closeCheckout();
  state.selected = [];
  state.performanceId = null;
  state.showId = null;
  document.getElementById('bookingLayout').classList.add('hide');
  document.getElementById('performancePicker').classList.add('hide');
  document.getElementById('showPicker').classList.remove('hide');
  renderShowPicker();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function downloadTickets(orderNo) {
  // Produces a simple text "ticket" file as a download for the prototype
  const show = SHOWS.find(s => s.id === state.showId);
  const perf = show.performances.find(p => p.id === state.performanceId);
  const sorted = [...state.selected].sort((a, b) => {
    const [ar, as] = a.key.split('-').map(Number);
    const [br, bs] = b.key.split('-').map(Number);
    return ar - br || as - bs;
  });

  const lines = [
    '════════════════════════════════════════',
    '   GLEDALIŠČE ZARJA CELJE',
    '   Vstopnice / Order: ' + orderNo,
    '════════════════════════════════════════',
    '',
    'Predstava: ' + show.title,
    'Datum:     ' + formatDateShort(perf.date) + ' ob ' + perf.time,
    'Trajanje:  ' + show.duration + ' min',
    'Režija:    ' + show.director,
    '',
    '────────────────────────────────────────',
    'SEDEŽI',
    '────────────────────────────────────────',
    ...sorted.map(s => {
      const [r, num] = s.key.split('-');
      return `  Vrsta ${r}, sedež ${num.padStart(2)} — ${TIER_NAMES[s.tier].split('·')[0].trim()} — ${show.pricing[s.tier]} €`;
    }),
    '────────────────────────────────────────',
    'SKUPAJ:  ' + sorted.reduce((sum, s) => sum + show.pricing[s.tier], 0) + ' €',
    '────────────────────────────────────────',
    '',
    'Naslov: Kulturniška ulica 4, 3000 Celje',
    'Info:   031 744 654 · info@kud-zarja.si',
    '',
    'Prosimo, pridite vsaj 15 minut pred',
    'začetkom predstave.',
    '',
    '════════════════════════════════════════',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Zarja_${orderNo}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
