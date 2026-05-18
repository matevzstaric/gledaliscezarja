/* =============================================================
   Calendar list renderer — chronological by month
   Used on the home page. Reads SHOWS from shows.js.
   ============================================================= */

const MONTHS_SL = [
  'JANUAR', 'FEBRUAR', 'MAREC', 'APRIL', 'MAJ', 'JUNIJ',
  'JULIJ', 'AVGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER',
];
const MONTHS_SL_SHORT = ['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AVG','SEP','OKT','NOV','DEC'];
const DAYS_SL = ['NED','PON','TOR','SRE','ČET','PET','SOB'];

function renderCalendarList(rootId, opts = {}) {
  const root = document.getElementById(rootId);
  if (!root) return;
  const limit = opts.limit || null; // optional max number of performances to show

  // Collect all upcoming performances across shows
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const items = [];
  SHOWS.forEach(show => {
    show.performances.forEach(p => {
      const d = new Date(p.date + 'T00:00:00');
      if (d >= today) {
        items.push({ show, perf: p, date: d });
      }
    });
  });

  // Sort chronologically
  items.sort((a, b) => a.date - b.date || a.perf.time.localeCompare(b.perf.time));

  const list = limit ? items.slice(0, limit) : items;

  if (list.length === 0) {
    root.innerHTML = `
      <p style="text-align:center; color:var(--c-muted); padding:3rem 0;">
        Trenutno ni napovedanih predstav. Spremljajte nas za nove termine.
      </p>
    `;
    return;
  }

  // Group by month
  const groups = {};
  list.forEach(it => {
    const key = `${it.date.getFullYear()}-${it.date.getMonth()}`;
    if (!groups[key]) groups[key] = { year: it.date.getFullYear(), month: it.date.getMonth(), items: [] };
    groups[key].items.push(it);
  });

  root.innerHTML = Object.values(groups).map(g => `
    <div class="calendar-month">
      <div class="calendar-month__title">${MONTHS_SL[g.month]} ${g.year}</div>
      ${g.items.map(({ show, perf, date }) => `
        <div class="cal-row">
          <div class="cal-date">
            <div class="cal-date__day">${DAYS_SL[date.getDay()]}</div>
            <div class="cal-date__num">${date.getDate()}.</div>
            <div class="cal-date__month">${MONTHS_SL_SHORT[date.getMonth()]}</div>
            <div class="cal-date__time">${perf.time}</div>
          </div>
          <div class="cal-info">
            <h3><a href="vstopnice.html?show=${show.id}">${show.title}</a></h3>
            <div class="cal-info__meta">
              <span><strong>${show.type}</strong></span>
              <span>${show.duration} min</span>
              <span>Režija: ${show.director}</span>
              <span>Cena: <strong>${Math.min(...Object.values(show.pricing))}–${Math.max(...Object.values(show.pricing))} €</strong></span>
            </div>
          </div>
          <a class="btn btn--primary" href="vstopnice.html?show=${show.id}">Vstopnice →</a>
        </div>
      `).join('')}
    </div>
  `).join('');
}
