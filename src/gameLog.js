// Loggoppføringer er objekter fra serveren, så klienten kan velge tekst og
// ikon selv og serveren aldri trenger en klient-sendt navneliste (som ville
// vært spoofbar). Formene:
//   { type: 'claim' | 'conquer' | 'fail', player, cell }
//   { type: 'revolt', player, cell }   (player er forrige eier)
//   { type: 'recycle', player, weapon, refund }
//   { type: <våpennavn>, player, cells }
import { territories } from './Game.js';
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

const LOG_ICONS = {
  recycle: '♻',
  revolt: '✊',
  conquer: '⚔️',
  fail: '🛡️',
  claim: '🚩',
};

export const logIcon = (entry) =>
  WEAPONS[entry.type]?.icon ?? LOG_ICONS[entry.type] ?? '•';
