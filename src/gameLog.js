// Loggoppføringer er objekter fra serveren, så klienten kan velge tekst og
// ikon selv og serveren aldri trenger en klient-sendt navneliste (som ville
// vært spoofbar). Formene:
//   { type: 'claim' | 'conquer' | 'fail', player, cell }
//   { type: 'revolt', player, cell }   (player er forrige eier)
//   { type: 'recycle', player, weapon, refund }
//   { type: <våpennavn>, player, cells }
import { territories } from './board.js';
import { WEAPONS } from './weapons.js';

const playerName = (id, matchData) => matchData?.[id]?.name || `Player ${id}`;

const place = (id) => territories[id];

const WEAPON_TEXT = {
  Artillery: (cells) =>
    `launches an Artillery Strike at ${place(cells[0])} and its neighbors!`,
  'Air Strike': (cells) =>
    `launches an Air Strike at ${cells.map(place).join(', ')}`,
  'Biological Warfare': (cells) =>
    `releases a Biological Weapon at ${place(cells[0])} and its surroundings!`,
  'Dirty Nuke': (cells) =>
    `detonates a Dirty Nuke at ${place(cells[0])}, leaving it uninhabitable`,
};

export function formatLogEntry(entry, matchData) {
  const who = playerName(entry.player, matchData);
  switch (entry.type) {
    case 'claim':
      return `${who} claims ${place(entry.cell)}`;
    case 'conquer':
      return `${who} conquers ${place(entry.cell)}`;
    case 'fail':
      return `${who} attempts to invade ${place(entry.cell)}, but fails`;
    case 'revolt':
      return `The people of ${place(entry.cell)} revolt against foreign rule`;
    case 'recycle':
      return `${who} recycles ${entry.weapon} and recovers ${entry.refund}% Rareium`;
    default:
      return `${who} ${WEAPON_TEXT[entry.type]?.(entry.cells) ?? entry.type}`;
  }
}

// Kort stensilmerke for hva som skjedde. Fargen velges i CSS etter typen.
const LOG_TAGS = {
  claim: 'CLAIM',
  conquer: 'CONQUER',
  fail: 'FAIL',
  revolt: 'REVOLT',
  recycle: 'RECYCLE',
  Artillery: 'ART',
  'Air Strike': 'AIR',
  'Biological Warfare': 'BIO',
  'Dirty Nuke': 'NUKE',
};

export const logTag = (entry) => LOG_TAGS[entry.type] ?? entry.type;

// Klassen styrer fargen: fraksjonsfarge for å ta og erobre, ellers etter type.
export const logTagClass = (entry) => {
  if (entry.type === 'claim' || entry.type === 'conquer') {
    return `log-tag log-tag-faction-${entry.player}`;
  }
  return WEAPONS[entry.type]
    ? 'log-tag log-tag-weapon'
    : `log-tag log-tag-${entry.type}`;
};
