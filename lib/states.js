// US states laid out as a tile-grid map (row/col) so we can render an
// interactive, lightweight "map" without heavy geographic SVG paths.
// Grid is 8 rows x 11 cols; (0,0) is top-left (north-west).

export const GRID_ROWS = 8;
export const GRID_COLS = 11;

export const STATES = [
  { abbr: "ME", name: "Maine", row: 0, col: 10 },
  { abbr: "VT", name: "Vermont", row: 1, col: 9 },
  { abbr: "NH", name: "New Hampshire", row: 1, col: 10 },
  { abbr: "WA", name: "Washington", row: 2, col: 0 },
  { abbr: "ID", name: "Idaho", row: 2, col: 1 },
  { abbr: "MT", name: "Montana", row: 2, col: 2 },
  { abbr: "ND", name: "North Dakota", row: 2, col: 3 },
  { abbr: "MN", name: "Minnesota", row: 2, col: 4 },
  { abbr: "WI", name: "Wisconsin", row: 2, col: 5 },
  { abbr: "MI", name: "Michigan", row: 2, col: 6 },
  { abbr: "NY", name: "New York", row: 2, col: 8 },
  { abbr: "MA", name: "Massachusetts", row: 2, col: 9 },
  { abbr: "OR", name: "Oregon", row: 3, col: 0 },
  { abbr: "NV", name: "Nevada", row: 3, col: 1 },
  { abbr: "WY", name: "Wyoming", row: 3, col: 2 },
  { abbr: "SD", name: "South Dakota", row: 3, col: 3 },
  { abbr: "IA", name: "Iowa", row: 3, col: 4 },
  { abbr: "IL", name: "Illinois", row: 3, col: 5 },
  { abbr: "IN", name: "Indiana", row: 3, col: 6 },
  { abbr: "OH", name: "Ohio", row: 3, col: 7 },
  { abbr: "PA", name: "Pennsylvania", row: 3, col: 8 },
  { abbr: "NJ", name: "New Jersey", row: 3, col: 9 },
  { abbr: "CT", name: "Connecticut", row: 3, col: 10 },
  { abbr: "CA", name: "California", row: 4, col: 0 },
  { abbr: "UT", name: "Utah", row: 4, col: 1 },
  { abbr: "CO", name: "Colorado", row: 4, col: 2 },
  { abbr: "NE", name: "Nebraska", row: 4, col: 3 },
  { abbr: "MO", name: "Missouri", row: 4, col: 4 },
  { abbr: "KY", name: "Kentucky", row: 4, col: 5 },
  { abbr: "WV", name: "West Virginia", row: 4, col: 6 },
  { abbr: "VA", name: "Virginia", row: 4, col: 7 },
  { abbr: "MD", name: "Maryland", row: 4, col: 8 },
  { abbr: "DE", name: "Delaware", row: 4, col: 9 },
  { abbr: "RI", name: "Rhode Island", row: 4, col: 10 },
  { abbr: "AZ", name: "Arizona", row: 5, col: 1 },
  { abbr: "NM", name: "New Mexico", row: 5, col: 2 },
  { abbr: "KS", name: "Kansas", row: 5, col: 3 },
  { abbr: "AR", name: "Arkansas", row: 5, col: 4 },
  { abbr: "TN", name: "Tennessee", row: 5, col: 5 },
  { abbr: "NC", name: "North Carolina", row: 5, col: 6 },
  { abbr: "SC", name: "South Carolina", row: 5, col: 7 },
  { abbr: "DC", name: "Washington, D.C.", row: 5, col: 8 },
  { abbr: "TX", name: "Texas", row: 6, col: 2 },
  { abbr: "OK", name: "Oklahoma", row: 6, col: 3 },
  { abbr: "LA", name: "Louisiana", row: 6, col: 4 },
  { abbr: "MS", name: "Mississippi", row: 6, col: 5 },
  { abbr: "AL", name: "Alabama", row: 6, col: 6 },
  { abbr: "GA", name: "Georgia", row: 6, col: 7 },
  { abbr: "HI", name: "Hawaii", row: 7, col: 0 },
  { abbr: "AK", name: "Alaska", row: 7, col: 1 },
  { abbr: "FL", name: "Florida", row: 7, col: 8 },
];

const BY_ABBR = Object.fromEntries(STATES.map((s) => [s.abbr, s]));

export function stateName(abbr) {
  return BY_ABBR[abbr]?.name || abbr;
}

export function isStateAbbr(abbr) {
  return !!BY_ABBR[(abbr || "").toUpperCase()];
}

/** Extract a 2-letter state code from a free-text location like "Dallas, TX". */
export function stateFromLocation(loc) {
  if (!loc) return null;
  const text = String(loc).trim();
  const tail = text.split(",").pop().trim();
  const up = tail.toUpperCase();
  if (BY_ABBR[up]) return up;
  const byName = STATES.find(
    (s) => s.name.toLowerCase() === tail.toLowerCase() || s.name.toLowerCase() === text.toLowerCase()
  );
  return byName ? byName.abbr : null;
}
