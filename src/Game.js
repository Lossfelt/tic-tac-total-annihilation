import { INVALID_MOVE } from 'boardgame.io/dist/cjs/core.js';
import { strategicWeapons, BIO_DESTROY_CHANCE } from './weapons.js';

export const BOARD_SIZE = 4;
export const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;
export const NUM_PLAYERS = 2;
export const REVOLT_CHANCE = 0.05;
export const INVASION_SUCCESS_CHANCE = 0.2;
export const RAREIUM_WEAPON_CHANCE_DIVISOR = 100;
export const RECYCLE_REFUND_RATIO = 0.7;

export const territories = [
  'the Salt Marches',
  'the Corn Belt Desert',
  "Hudson's Pit",
  'Port Orchard',
  'Port Crater',
  'the Savannah Fragments',
  'the Ash Plains',
  'the Rust Belt Ruins',
  "Angels' Remnants",
  'Oklahoma Rift',
  'the Dusty Delta',
  'the Shining Desert',
  'the Shattered Mountains',
  'the Plains of Iron',
  'the Confederate Shards',
  'the Sunset Swamps',
];

export { strategicWeapons, BIO_DESTROY_CHANCE };

const positions = [
  // Horizontal lines
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  // Vertical lines
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  // Diagonal lines
  [0, 5, 10, 15],
  [3, 6, 9, 12],
];

// Returnerer cellene som utgjør den vinnende linjen, eller null hvis det
// ikke finnes noen. Brukes både til seier-sjekk og til å fremheve vinneren
// sine celler på brettet.
export function GetWinningLine(cells) {
  for (const row of positions) {
    const symbols = row.map((i) => cells[i]);
    if (symbols.every((i) => i !== null && i === symbols[0])) {
      return row;
    }
  }
  return null;
}

export function IsVictory(cells) {
  return GetWinningLine(cells) !== null;
}

// Returnerer playerID hvis én spiller eier samtlige ikke-destroyed celler
// (og minst én celle er eid). Returnerer null ellers - inkludert hvis det
// fortsatt finnes tomme, ikke-destroyed celler.
export function GetDominator(G) {
  let dominator = null;
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (G.destroyed[i]) continue;
    if (G.cells[i] === null) return null;
    if (dominator === null) {
      dominator = G.cells[i];
    } else if (dominator !== G.cells[i]) {
      return null;
    }
  }
  return dominator;
}

// Sjekker om tre celle-IDer ligger på rad (horisontalt, vertikalt eller
// diagonalt) - brukes til Air Strike-validering.
export function IsRow(input) {
  if (input.length !== 3) return false;

  const sortedInput = [...input].sort((a, b) => a - b);
  const [first, second, third] = sortedInput;

  const isHorizontal =
    Math.floor(first / BOARD_SIZE) === Math.floor(second / BOARD_SIZE) &&
    Math.floor(second / BOARD_SIZE) === Math.floor(third / BOARD_SIZE) &&
    second - first === 1 &&
    third - second === 1;

  const isVertical =
    second - first === BOARD_SIZE && third - second === BOARD_SIZE;

  const isDiagonal =
    (second - first === BOARD_SIZE + 1 && third - second === BOARD_SIZE + 1) ||
    (second - first === BOARD_SIZE - 1 && third - second === BOARD_SIZE - 1);

  return isHorizontal || isVertical || isDiagonal;
}

// Ortogonale naboer til en celle - brukes til Artillery.
export function GetNeighbors(id, boardSize = BOARD_SIZE) {
  const neighbors = [];
  const row = Math.floor(id / boardSize);
  const col = id % boardSize;

  if (row > 0) neighbors.push(id - boardSize);
  if (row < boardSize - 1) neighbors.push(id + boardSize);
  if (col > 0) neighbors.push(id - 1);
  if (col < boardSize - 1) neighbors.push(id + 1);

  return neighbors;
}

// 3x3-blokken rundt en celle (inkludert cellen selv) - brukes til
// Biological Warfare.
export function GetSurroundingCells(id, boardSize = BOARD_SIZE) {
  const neighbors = [];
  const row = Math.floor(id / boardSize);
  const col = id % boardSize;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (
        newRow >= 0 &&
        newRow < boardSize &&
        newCol >= 0 &&
        newCol < boardSize
      ) {
        neighbors.push(newRow * boardSize + newCol);
      }
    }
  }

  return neighbors;
}

// Loggen lagres med __P<playerID>__ som placeholder for spillernavn.
// Klienten formaterer dette mot matchData ved render, slik at serveren
// aldri trenger en klient-sendt navneliste (som ville vært spoofbar).
const playerToken = (playerID) => `__P${playerID}__`;

function isCellId(id) {
  return Number.isInteger(id) && id >= 0 && id < TOTAL_CELLS;
}

// Server-side validering av målet. UI-et sender alltid gyldige mål, men
// serveren skal ikke stole på klienten.
function isValidWeaponTarget(weapon, input) {
  if (weapon === 'Air Strike') {
    return (
      Array.isArray(input) &&
      input.length === 3 &&
      input.every(isCellId) &&
      new Set(input).size === 3 &&
      IsRow(input)
    );
  }
  return isCellId(input);
}

// Hendelsen klienten spiller av som animasjon. `before` er brettet slik det
// så ut før våpenet traff, så alle klienter kan vise det frem til treffpunktet.
// `version` økes for hver hendelse og er det klienten reagerer på.
// `affected` er cellene våpenet faktisk rammet, når det avhenger av tilfeldighet
// (Biological Warfare), så alle klienter animerer samme utfall.
function recordWeaponEvent(G, type, cells, before, affected = []) {
  G.weaponEvent = {
    type,
    cells,
    before,
    affected,
    version: (G.weaponEvent?.version ?? 0) + 1,
  };
}

// Merker en celle for animasjon på klienten. `kind` sier hva som skjedde.
function markCell(G, id, kind = null) {
  G.blink[id] = true;
  if (G.blinkKind) G.blinkKind[id] = kind;
}

// Nullstiller blinkene fra forrige trekk og starter en ny blink-runde.
function resetBlink(G) {
  G.blink.fill(false);
  G.blinkKind?.fill(null);
  G.blinkVersion++;
}

// Hvert våpen returnerer false hvis trekket er ugyldig.
const WEAPON_HANDLERS = {
  Artillery: ({ G, name, input }) => {
    [input, ...GetNeighbors(input)].forEach((target) => {
      G.cells[target] = null;
      G.blink[target] = true;
    });
    G.log.unshift(
      `${name} launches an Artillery Strike at ${territories[input]} and its neighbors!`,
    );
    G.lastCellAttacked = input;
    return true;
  },
  'Air Strike': ({ G, name, input }) => {
    G.log.unshift(
      `${name} launches an Air Strike at ${input
        .map((id) => territories[id])
        .join(', ')}`,
    );
    input.forEach((id) => {
      G.cells[id] = null;
      G.blink[id] = true;
    });
    G.lastCellAttacked = input[2];
    return true;
  },
  'Biological Warfare': ({ G, name, input, random, affected }) => {
    GetSurroundingCells(input).forEach((target) => {
      if (random.Number() < BIO_DESTROY_CHANCE) {
        G.cells[target] = null;
        G.blink[target] = true;
        affected.push(target);
      }
    });
    G.log.unshift(
      `${name} releases a Biological Weapon at ${territories[input]} and its surroundings!`,
    );
    G.lastCellAttacked = input;
    return true;
  },
  'Dirty Nuke': ({ G, name, input }) => {
    if (G.destroyed[input]) return false;
    G.cells[input] = null;
    G.destroyed[input] = true;
    G.blink[input] = true;
    G.log.unshift(
      `${name} detonates a Dirty Nuke at ${territories[input]}, leaving it uninhabitable`,
    );
    G.lastCellAttacked = input;
    return true;
  },
};

// Testtrekk som bare finnes når serveren startes med DEBUG_MOVES=1. I
// nettleseren finnes ikke `process`, og på produksjonsserveren er variabelen
// ikke satt, så trekket avvises der.
const DEBUG_MOVES =
  typeof process !== 'undefined' && process.env?.DEBUG_MOVES === '1';

export const TicTacToe = {
  name: 'TicTacToe',

  setup: () => ({
    cells: Array(TOTAL_CELLS).fill(null),
    // Permanent ødelagte celler (etter Dirty Nuke). Holdes adskilt fra
    // cells slik at win-, revolt- og invasjonslogikken ser dem som
    // tomme (null) uten ekstra spesialtilfeller.
    destroyed: Array(TOTAL_CELLS).fill(false),
    log: [],
    blink: Array(TOTAL_CELLS).fill(false),
    // Hva som skjedde med en blinkende celle: 'claim', 'conquer', 'fail' eller
    // 'revolt'. Null for våpentreff. Klienten velger effekt etter dette.
    blinkKind: Array(TOTAL_CELLS).fill(null),
    // Inkrementeres ved hver blink-hendelse. Klienten bruker dette i React
    // `key` slik at en celle som blinker to ganger etter hverandre faktisk
    // får CSS-animasjonen restartet (uten tvinges remount beholder DOM den
    // gamle, ferdigkjørte animasjonen).
    blinkVersion: 0,
    lastCellAttacked: null,
    strategicWeapon: Array(NUM_PLAYERS).fill(null),
    Rareium: Array(NUM_PLAYERS).fill(0),
    // Rareium-nivået i det øyeblikket gjeldende våpen ble tildelt. Brukes
    // til å beregne refusjon ved recycle. Resettes når våpenet brukes opp.
    rareiumAtWeapon: Array(NUM_PLAYERS).fill(0),
    // Siste våpenhendelse, brukt av klienten til å spille av animasjon.
    weaponEvent: { type: null, cells: [], before: null, version: 0 },
  }),

  turn: {
    minMoves: 1,
    maxMoves: 1,
    onBegin: ({ G, ctx, random }) => {
      G.lastCellAttacked = null;

      const ownedCells = G.cells.filter(
        (cell) => cell === ctx.currentPlayer,
      ).length;
      G.Rareium[ctx.currentPlayer] += ownedCells;

      if (!G.strategicWeapon[ctx.currentPlayer]) {
        if (
          random.Number() * RAREIUM_WEAPON_CHANCE_DIVISOR <
          G.Rareium[ctx.currentPlayer]
        ) {
          G.strategicWeapon[ctx.currentPlayer] =
            strategicWeapons[random.Die(strategicWeapons.length) - 1];
          G.rareiumAtWeapon[ctx.currentPlayer] = G.Rareium[ctx.currentPlayer];
          G.Rareium[ctx.currentPlayer] = 0;
        }
      }
    },
    onEnd: ({ G, random }) => {
      let revolted = false;
      for (let i = 0; i < TOTAL_CELLS; i++) {
        if (
          G.cells[i] !== null &&
          random.Number() < REVOLT_CHANCE &&
          i !== G.lastCellAttacked
        ) {
          G.cells[i] = null;
          G.log.unshift(
            `The people of ${territories[i]} revolt against foreign rule`,
          );
          markCell(G, i, 'revolt');
          revolted = true;
        }
      }
      if (revolted) G.blinkVersion++;
    },
  },

  moves: {
    clickCell: ({ G, playerID, random }, id) => {
      if (!isCellId(id)) return INVALID_MOVE;
      resetBlink(G);
      const name = playerToken(playerID);
      if (G.destroyed[id]) {
        return INVALID_MOVE;
      } else if (G.cells[id] === playerID) {
        return INVALID_MOVE;
      } else if (G.cells[id] !== null) {
        const conquered = random.Number() < INVASION_SUCCESS_CHANCE;
        if (conquered) {
          G.cells[id] = playerID;
          G.log.unshift(`${name} conquers ${territories[id]}`);
        } else {
          G.log.unshift(
            `${name} attempts to invade ${territories[id]}, but fails`,
          );
        }
        markCell(G, id, conquered ? 'conquer' : 'fail');
        G.lastCellAttacked = id;
      } else {
        G.cells[id] = playerID;
        G.log.unshift(`${name} claims ${territories[id]}`);
        markCell(G, id, 'claim');
        G.lastCellAttacked = id;
      }
    },
    // Gir spilleren et våpen, for å teste animasjonene. Kjøres bare på
    // serveren (client: false) og teller ikke som turens trekk (noLimit).
    debugGiveWeapon: {
      client: false,
      noLimit: true,
      move: ({ G, playerID }, weapon) => {
        if (!DEBUG_MOVES || !strategicWeapons.includes(weapon)) {
          return INVALID_MOVE;
        }
        G.strategicWeapon[playerID] = weapon;
        G.rareiumAtWeapon[playerID] = 100;
      },
    },
    recycleStrategicWeapon: {
      // noLimit gjør at recycle ikke teller mot turens maxMoves: 1. Spilleren
      // skal fortsatt få lov til å gjøre et vanlig trekk etter resirkulering.
      noLimit: true,
      move: ({ G, playerID }) => {
        const weapon = G.strategicWeapon[playerID];
        if (!weapon) return INVALID_MOVE;
        resetBlink(G);
        const refund = Math.round(
          G.rareiumAtWeapon[playerID] * RECYCLE_REFUND_RATIO,
        );
        G.Rareium[playerID] += refund;
        G.strategicWeapon[playerID] = null;
        G.rareiumAtWeapon[playerID] = 0;
        const name = playerToken(playerID);
        G.log.unshift(
          `${name} recycles ${weapon} and recovers ${refund}% Rareium`,
        );
      },
    },
    useStrategicWeapon: ({ G, playerID, random }, input) => {
      const weapon = G.strategicWeapon[playerID];
      if (!weapon || !isValidWeaponTarget(weapon, input)) return INVALID_MOVE;

      const before = { cells: [...G.cells], destroyed: [...G.destroyed] };
      resetBlink(G);
      const name = playerToken(playerID);
      const affected = [];
      const ok = WEAPON_HANDLERS[weapon]({
        G,
        name,
        input,
        random,
        affected,
      });
      if (!ok) return INVALID_MOVE;

      G.strategicWeapon[playerID] = null;
      recordWeaponEvent(
        G,
        weapon,
        Array.isArray(input) ? [...input] : [input],
        before,
        affected,
      );
    },
  },

  minPlayers: NUM_PLAYERS,
  maxPlayers: NUM_PLAYERS,

  // Motstanderens Rareium og våpen sendes ikke til klienten. Uten dette kan
  // en spiller lese dem i nettverkstrafikken. Uten playerID (lokal modus eller
  // test) vises alt.
  playerView: ({ G, playerID }) => {
    if (playerID === null || playerID === undefined) return G;
    const mine = (list, hidden) =>
      list.map((value, id) =>
        String(id) === String(playerID) ? value : hidden,
      );
    return {
      ...G,
      Rareium: mine(G.Rareium, 0),
      rareiumAtWeapon: mine(G.rareiumAtWeapon, 0),
      strategicWeapon: mine(G.strategicWeapon, null),
    };
  },

  endIf: ({ G }) => {
    const winningLine = GetWinningLine(G.cells);
    if (winningLine) {
      // Vinneren er eieren av linjen, ikke nødvendigvis den som har turen.
      return { winner: G.cells[winningLine[0]], winningLine };
    }
    // Domination: hvis alle ikke-destroyed celler er eid av samme spiller, og
    // ingen tomme celler er igjen, vinner den spilleren. Dekker edge-casen
    // der nok celler er nuket til at ingen 4-på-rad er mulig.
    const dominator = GetDominator(G);
    if (dominator !== null) {
      return { winner: dominator };
    }
  },

  ai: {
    enumerate: (G) => {
      let moves = [];
      for (let i = 0; i < TOTAL_CELLS; i++) {
        if (G.cells[i] === null) {
          moves.push({ move: 'clickCell', args: [i] });
        }
      }
      return moves;
    },
  },
};

// Substituerer __P<id>__ placeholders i en loggstreng med spillernavn fra
// matchData. Eksportert slik at klienten kan formatere alle loggoppføringer.
export function formatLogEntry(entry, matchData) {
  return entry.replace(/__P(\d+)__/g, (_, id) => {
    const player = matchData?.[id];
    return player?.name || `Player ${id}`;
  });
}
