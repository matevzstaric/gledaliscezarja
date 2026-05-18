/* =============================================================
   Gledališče Zarja Celje — dvorana layout
   =============================================================
   Real layout from the architectural floorplan.
   Row 1 = nearest stage (front), Row 10 = back (near entrance).
   Each row is split by a center aisle into LEFT and RIGHT halves.
   Seat numbers count outward-to-inward: 1 = outer wall, N = aisle.
   ============================================================= */

const DVORANA = {
  // `centerAisle: true` puts a visual gap between L and R halves
  // (used for rows 9–10 because of the staircase landing).
  // Rows 1–8 are continuous: no gap, seats numbered as L 1..N | R N..1 but rendered as one block.
  sections: [
    {
      id: 'main',
      label: 'Spredaj (pri odru)',
      rows: [
        { num: 1, leftSeats: 7, rightSeats: 7, centerAisle: false },
        { num: 2, leftSeats: 7, rightSeats: 7, centerAisle: false },
        { num: 3, leftSeats: 8, rightSeats: 8, centerAisle: false },
        { num: 4, leftSeats: 8, rightSeats: 8, centerAisle: false },
        { num: 5, leftSeats: 8, rightSeats: 8, centerAisle: false },
        { num: 6, leftSeats: 8, rightSeats: 8, centerAisle: false },
        { num: 7, leftSeats: 8, rightSeats: 8, centerAisle: false },
        { num: 8, leftSeats: 8, rightSeats: 8, centerAisle: false },
      ],
    },
    {
      id: 'back',
      label: 'Zadaj (pri vhodu)',
      rows: [
        { num: 9, leftSeats: 8, rightSeats: 8, centerAisle: true },
        { num: 10, leftSeats: 9, rightSeats: 9, centerAisle: true },
      ],
    },
  ],
};

// Total seat count for reference
const DVORANA_TOTAL_SEATS = DVORANA.sections.reduce((sum, sec) =>
  sum + sec.rows.reduce((rs, r) => rs + r.leftSeats + r.rightSeats, 0), 0);

// Build a seat key in the canonical format: "{row}-{side}-{num}"  e.g. "5-L-3"
function seatKey(row, side, num) { return `${row}-${side}-${num}`; }
function parseSeatKey(key) {
  const [row, side, num] = key.split('-');
  return { row: +row, side, num: +num };
}

// Discount ticket types (labels are loaded from site_settings at runtime)
const TICKET_TYPES = ['redna', 'studentska', 'upokojenska', 'otroska'];
const TICKET_LABEL_FALLBACK = {
  redna:        'Redna cena',
  studentska:   'Študentska / dijaška',
  upokojenska:  'Upokojenska',
  otroska:      'Otroška (do 12 let)',
};
