/* =============================================================
   SHOWS data — per-show custom pricing & seat layout
   =============================================================
   Each show defines:
     - pricing: tier letter → price in EUR
     - seatLayout: 10 rows × 15 seats, each cell = tier letter or '.' (aisle/missing)
       Default theatre is 10 rows × 15 seats with an aisle gap visualised
       between seats 7 and 8 (handled by booking.js renderer).
     - performances: list of dates/times for this show
     - For each performance you can pre-fill `taken` seats (sold/reserved)

   To add a new show, copy a block, give it a unique id, and edit values.
   To change pricing for a show, edit its `pricing` object.
   To change which seats are tier A/B/C for a show, edit `seatLayout`.
   ============================================================= */

// Default layout: rows 1-3 premium (A), rows 4-7 standard (B), rows 8-10 economy (C)
const DEFAULT_LAYOUT = [
  'AAAAAAAAAAAAAAA', // row 1 (closest to stage)
  'AAAAAAAAAAAAAAA', // row 2
  'AAAAAAAAAAAAAAA', // row 3
  'BBBBBBBBBBBBBBB', // row 4
  'BBBBBBBBBBBBBBB', // row 5
  'BBBBBBBBBBBBBBB', // row 6
  'BBBBBBBBBBBBBBB', // row 7
  'CCCCCCCCCCCCCCC', // row 8
  'CCCCCCCCCCCCCCC', // row 9
  'CCCCCCCCCCCCCCC', // row 10 (back row)
];

// Tier names shown to the user
const TIER_NAMES = {
  A: 'Premium · Sprednje vrste',
  B: 'Standard · Sredinske vrste',
  C: 'Ekonomično · Zadnje vrste',
};

const SHOWS = [
  {
    id: 'lepotica-in-zver',
    title: 'Lepotica in zver',
    director: 'Urška Majcen',
    duration: 40,
    type: 'Otroška',
    description: 'Letošnja pravljica nagovarja predvsem pojem lepote v današnjem svetu — kako jo najdemo in prepoznamo znotraj sebe, ne le zunaj.',
    pricing: { A: 10, B: 8, C: 6 }, // children's show — lower prices
    seatLayout: DEFAULT_LAYOUT,
    performances: [
      { id: 'lz-2026-12-03-1700', date: '2026-12-03', time: '17:00', taken: ['1-7','1-8','4-3','4-4','7-12'] },
      { id: 'lz-2026-12-04-1700', date: '2026-12-04', time: '17:00', taken: ['2-1','2-2','3-15'] },
      { id: 'lz-2026-12-05-1100', date: '2026-12-05', time: '11:00', taken: ['1-1','1-2','1-3','1-4','5-7','5-8','5-9','9-10','9-11'] },
    ],
  },
  {
    id: 'skrivni-strahovi',
    title: 'Skrivni strahovi na javnih krajih',
    director: 'Jaša Jamnik',
    duration: 90,
    type: 'Odrasla',
    description: 'Predstava v nastajanju — odrasel projekt sezone 2025/2026.',
    pricing: { A: 15, B: 12, C: 9 },
    seatLayout: DEFAULT_LAYOUT,
    performances: [
      { id: 'ss-2026-10-09-2000', date: '2026-10-09', time: '20:00', taken: ['1-7','1-8','1-9','2-7','2-8'] },
      { id: 'ss-2026-10-23-2000', date: '2026-10-23', time: '20:00', taken: [] },
      { id: 'ss-2026-11-06-2000', date: '2026-11-06', time: '20:00', taken: ['3-5','3-6'] },
    ],
  },
  {
    id: 'goli-pianist',
    title: 'Goli pianist',
    director: 'Jaša Jamnik',
    duration: 70,
    type: 'Komedija',
    description: 'Absurdna komedija o stanovanjskem bloku, kjer vsak posega v intimo drugega. Skozi komične zaplete nastavi družbi zrcalo.',
    pricing: { A: 18, B: 14, C: 10 }, // award-winning show — premium pricing
    seatLayout: DEFAULT_LAYOUT,
    performances: [
      { id: 'gp-2026-05-22-2000', date: '2026-05-22', time: '20:00', taken: ['1-1','1-2','1-3','1-4','1-5','1-6','1-7','1-8','2-7','2-8','4-1','4-15'] },
      { id: 'gp-2026-06-05-2000', date: '2026-06-05', time: '20:00', taken: ['3-7','3-8','3-9'] },
    ],
  },
  {
    id: 'ekskurzija',
    title: 'Ekskurzija',
    director: 'Žiga Medvešek',
    duration: 60,
    type: 'Socialna komedija',
    description: 'Po motivih romana »Očarljivi skupinski samomor«. Skupina neznancev se odpravi na potovanje, ki jim za vedno spremeni življenje na bolje.',
    pricing: { A: 14, B: 11, C: 8 },
    seatLayout: DEFAULT_LAYOUT,
    performances: [
      { id: 'ek-2026-06-12-2000', date: '2026-06-12', time: '20:00', taken: ['2-5','2-6','7-3','7-4'] },
      { id: 'ek-2026-06-13-2000', date: '2026-06-13', time: '20:00', taken: [] },
    ],
  },
  {
    id: 'sneguljcica',
    title: 'Sneguljčica',
    director: 'Žiga Medvešek',
    duration: 30,
    type: 'Otroška',
    description: 'Kultna otroška pravljica o premoči dobrega nad zlim — o složnosti, različnosti in sožitju vseh drugačnosti.',
    pricing: { A: 9, B: 7, C: 5 },
    seatLayout: DEFAULT_LAYOUT,
    performances: [
      { id: 'sn-2026-05-30-1100', date: '2026-05-30', time: '11:00', taken: ['1-1','1-2','3-3','3-4'] },
    ],
  },
  {
    id: 'pepelka',
    title: 'Pepelka',
    director: 'Urška Majcen',
    duration: 40,
    type: 'Otroška',
    description: 'Klasična pravljica o moči iskrene ljubezni, družbeni razslojenosti in povezanosti najbolj iskrenih bitij.',
    pricing: { A: 10, B: 8, C: 6 },
    seatLayout: DEFAULT_LAYOUT,
    performances: [
      { id: 'pe-2026-05-23-1100', date: '2026-05-23', time: '11:00', taken: ['1-7','1-8','4-7','4-8'] },
    ],
  },
];

// Helper: format date for Slovenian display
function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  const months = ['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
}
function formatDateShort(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}. ${d.getMonth()+1}. ${d.getFullYear()}`;
}
function weekdayName(iso) {
  const d = new Date(iso + 'T00:00:00');
  const days = ['nedelja','ponedeljek','torek','sreda','četrtek','petek','sobota'];
  return days[d.getDay()];
}
