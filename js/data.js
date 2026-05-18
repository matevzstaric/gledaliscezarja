/* =============================================================
   Data layer — wraps Supabase queries for the public site
   All functions return promises and never throw — they return
   empty arrays/null on failure so the UI degrades gracefully.
   ============================================================= */

const data = {

  /* ---- SHOWS ---- */
  async listShows({ season = null, status = null } = {}) {
    let q = sb.from('shows').select('*').order('display_order', { ascending: true });
    if (season) q = q.eq('season', season);
    if (status) q = q.eq('status', status);
    const { data: rows, error } = await q;
    if (error) { console.error('listShows', error); return []; }
    return rows;
  },

  async getShow(id) {
    const { data: row, error } = await sb.from('shows').select('*').eq('id', id).single();
    if (error) { console.error('getShow', error); return null; }
    return row;
  },

  /* ---- PERFORMANCES ---- */
  async listUpcomingPerformances({ limit = null } = {}) {
    const today = new Date().toISOString().slice(0, 10);
    let q = sb.from('performances')
      .select('*, show:shows(*)')
      .gte('performance_date', today)
      .eq('status', 'scheduled')
      .order('performance_date', { ascending: true })
      .order('performance_time', { ascending: true });
    if (limit) q = q.limit(limit);
    const { data: rows, error } = await q;
    if (error) { console.error('listUpcomingPerformances', error); return []; }
    return rows;
  },

  async listPerformancesForShow(showId) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: rows, error } = await sb.from('performances')
      .select('*')
      .eq('show_id', showId)
      .gte('performance_date', today)
      .eq('status', 'scheduled')
      .order('performance_date', { ascending: true });
    if (error) { console.error('listPerformancesForShow', error); return []; }
    return rows;
  },

  /* ---- BOOKED SEATS (for the seat picker) ---- */
  async listBookedSeatsForPerformance(performanceId) {
    const { data: rows, error } = await sb.from('booking_seats')
      .select('row_num, seat_num')
      .eq('performance_id', performanceId);
    if (error) { console.error('listBookedSeats', error); return []; }
    return rows.map(r => `${r.row_num}-${r.seat_num}`);
  },

  /* ---- ENSEMBLE ---- */
  async listEnsemble({ group = null } = {}) {
    let q = sb.from('ensemble_members').select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });
    if (group) q = q.eq('group_name', group);
    const { data: rows, error } = await q;
    if (error) { console.error('listEnsemble', error); return []; }
    return rows;
  },

  /* ---- AWARDS ---- */
  async listAwards() {
    const { data: rows, error } = await sb.from('awards').select('*')
      .order('display_order', { ascending: true });
    if (error) { console.error('listAwards', error); return []; }
    return rows;
  },

  async getHighlightAward() {
    const { data: rows, error } = await sb.from('awards').select('*')
      .eq('is_highlight', true)
      .order('year', { ascending: false })
      .limit(1);
    if (error || !rows || rows.length === 0) return null;
    return rows[0];
  },

  /* ---- SPONSORS ---- */
  async listSponsors() {
    const { data: rows, error } = await sb.from('sponsors').select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });
    if (error) { console.error('listSponsors', error); return []; }
    return rows;
  },

  /* ---- SITE SETTINGS ---- */
  async getSettings() {
    const { data: rows, error } = await sb.from('site_settings').select('*');
    if (error) { console.error('getSettings', error); return {}; }
    // turn array of {key,value} into a {key: value} map
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  },

  async getSetting(key) {
    const { data: row, error } = await sb.from('site_settings').select('value').eq('key', key).single();
    if (error) return null;
    return row.value;
  },
};

/* =============================================================
   Helpers for formatting (Slovenian)
   ============================================================= */
const MONTHS_SL = ['JANUAR','FEBRUAR','MAREC','APRIL','MAJ','JUNIJ','JULIJ','AVGUST','SEPTEMBER','OKTOBER','NOVEMBER','DECEMBER'];
const MONTHS_SL_SHORT = ['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AVG','SEP','OKT','NOV','DEC'];
const DAYS_SL = ['NED','PON','TOR','SRE','ČET','PET','SOB'];
const WEEKDAYS_FULL_SL = ['nedelja','ponedeljek','torek','sreda','četrtek','petek','sobota'];

function fmtDateLong(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}. ${MONTHS_SL[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
}
function fmtDateShort(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}. ${d.getMonth()+1}. ${d.getFullYear()}`;
}
function fmtTime(timeStr) {
  // "20:00:00" → "20:00"
  return timeStr ? timeStr.slice(0, 5) : '';
}
function fmtWeekday(iso) {
  const d = new Date(iso + 'T00:00:00');
  return WEEKDAYS_FULL_SL[d.getDay()];
}
