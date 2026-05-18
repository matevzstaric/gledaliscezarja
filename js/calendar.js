/* =============================================================
   Calendar list renderer — chronological by month with "Danes" marker
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

  // Today reference (start-of-day, local time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Format today for display
  const todayStr = `${today.getDate()}. ${MONTHS_SL[today.getMonth()].toLowerCase()} ${today.getFullYear()}`;

  // Group items by month, attach Date object
  const groups = {};
  items.forEach(it => {
    const d = new Date(it.performance_date + 'T00:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups[key]) groups[key] = { year: d.getFullYear(), month: d.getMonth(), items: [] };
    groups[key].items.push({ ...it, _date: d });
  });

  // Identify the very next performance (first item chronologically)
  const firstItem = items[0];
  const firstDate = new Date(firstItem.performance_date + 'T00:00:00');
  const isFirstToday = firstDate.getTime() === today.getTime();

  // The "Danes" marker is rendered at the top of the calendar
  const todayMarker = `
    <div class="today-marker">
      <span class="today-marker__pill">Danes</span>
      <span class="today-marker__date">${todayStr}</span>
      <span class="today-marker__line"></span>
    </div>
  `;

  let html = todayMarker;

  // Whether we've already passed the "today" line while rendering
  // (since all items are in the future, the marker stays at top
  //  and the FIRST item gets a special highlight as "naslednja")
  let nextHighlighted = false;

  Object.values(groups).forEach(g => {
    html += `<div class="calendar-month">`;
    html += `<div class="calendar-month__title">${MONTHS_SL[g.month]} ${g.year}</div>`;
    g.items.forEach(it => {
      const show = it.show;
      const pricing = show.pricing || {};
      const redna = pricing.redna;
      const otroska = pricing.otroska;
      const priceLabel = redna && otroska && otroska < redna
        ? `${redna} € <span style="color:var(--c-muted);">(otroška ${otroska} €)</span>`
        : (redna ? `${redna} €` : '—');

      const isToday = it._date.getTime() === today.getTime();
      const isNext = !nextHighlighted;
      if (isNext) nextHighlighted = true;

      const rowClass = isNext ? 'cal-row cal-row--next' : 'cal-row';

      // Special "Today" inline badge if this performance is today
      const todayBadge = isToday
        ? '<span style="display:inline-block; background:var(--c-red); color:#fff; padding:.15rem .55rem; border-radius:3px; font-size:.7rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; margin-right:.5rem;">Danes</span>'
        : (isNext ? '<span style="display:inline-block; background:rgba(205,27,57,.15); color:var(--c-red); padding:.15rem .55rem; border-radius:3px; font-size:.7rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; margin-right:.5rem;">Naslednja</span>' : '');

      html += `
        <div class="${rowClass}">
          <div class="cal-date">
            <div class="cal-date__day">${DAYS_SL[it._date.getDay()]}</div>
            <div class="cal-date__num">${it._date.getDate()}.</div>
            <div class="cal-date__month">${MONTHS_SL_SHORT[it._date.getMonth()]}</div>
            <div class="cal-date__time">${fmtTime(it.performance_time)}</div>
          </div>
          <div class="cal-info">
            <h3>${todayBadge}<a href="vstopnice.html?show=${show.id}&performance=${it.id}">${show.title}</a></h3>
            <div class="cal-info__meta">
              <span><strong>${show.type}</strong></span>
              <span>${show.duration_minutes} min</span>
              <span>Režija: ${show.director}</span>
              <span>Cena: <strong>${priceLabel}</strong></span>
            </div>
          </div>
          <a class="btn btn--primary" href="vstopnice.html?show=${show.id}&performance=${it.id}">Vstopnice →</a>
        </div>
      `;
    });
    html += `</div>`;
  });

  root.innerHTML = html;
}
