/* =============================================================
   Calendar list renderer — chronological by month
   Fetches upcoming performances from Supabase and renders.
   ============================================================= */

async function renderCalendarList(rootId, opts = {}) {
  const root = document.getElementById(rootId);
  if (!root) return;
  root.innerHTML = '<div style="text-align:center; padding:3rem 0; color:var(--c-muted);">Nalagam koledar…</div>';

  const items = await data.listUpcomingPerformances({ limit: opts.limit || null });

  if (items.length === 0) {
    root.innerHTML = `
      <p style="text-align:center; color:var(--c-muted); padding:3rem 0;">
        Trenutno ni napovedanih predstav. Spremljajte nas za nove termine.
      </p>
    `;
    return;
  }

  // Group by month
  const groups = {};
  items.forEach(it => {
    const d = new Date(it.performance_date + 'T00:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups[key]) groups[key] = { year: d.getFullYear(), month: d.getMonth(), items: [] };
    groups[key].items.push({ ...it, _date: d });
  });

  root.innerHTML = Object.values(groups).map(g => `
    <div class="calendar-month">
      <div class="calendar-month__title">${MONTHS_SL[g.month]} ${g.year}</div>
      ${g.items.map(it => {
        const show = it.show;
        const pricing = show.pricing || {};
        const prices = Object.values(pricing).map(Number).filter(n => !isNaN(n));
        const priceRange = prices.length
          ? (Math.min(...prices) === Math.max(...prices)
              ? `${Math.min(...prices)} €`
              : `${Math.min(...prices)}–${Math.max(...prices)} €`)
          : '—';
        return `
          <div class="cal-row">
            <div class="cal-date">
              <div class="cal-date__day">${DAYS_SL[it._date.getDay()]}</div>
              <div class="cal-date__num">${it._date.getDate()}.</div>
              <div class="cal-date__month">${MONTHS_SL_SHORT[it._date.getMonth()]}</div>
              <div class="cal-date__time">${fmtTime(it.performance_time)}</div>
            </div>
            <div class="cal-info">
              <h3><a href="vstopnice.html?show=${show.id}&performance=${it.id}">${show.title}</a></h3>
              <div class="cal-info__meta">
                <span><strong>${show.type}</strong></span>
                <span>${show.duration_minutes} min</span>
                <span>Režija: ${show.director}</span>
                <span>Cena: <strong>${priceRange}</strong></span>
              </div>
            </div>
            <a class="btn btn--primary" href="vstopnice.html?show=${show.id}&performance=${it.id}">Vstopnice →</a>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');
}
