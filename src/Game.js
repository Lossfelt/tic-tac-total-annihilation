import { INVALID_MOVE } from 'boardgame.io/dist/cjs/core.js';
import { strategicWeapons, BIO_DESTROY_CHANCE } from './weapons.js';
import {
  TOTAL_CELLS,
  GetWinningLine,
  GetDominator,
  IsRow,
  GetNeighbors,
  GetSurroundingCells,
} from './board.js';
import {
  RULES,
  INVASION_SUCCESS_CHANCE,
  REVOLT_CHANCE,
  canInvade,
  attack,
  claimCell,
  consolidate,
  countedCells,
} from './invasionRules.js';
import { runRevolts, hasUnrest, suppress } from './revoltRules.js';
import { canReinforce, reinforce } from './strengthRules.js';

// Brettgeometrien ligger i board.js. Den eksporteres også herfra, så tester
// og eldre importer fortsatt virker.
export * from './board.js';
export { RULES, INVASION_SUCCESS_CHANCE, REVOLT_CHANCE, countedCells };

export const NUM_PLAYERS = 2;
export const RAREIUM_WEAPON_CHANCE_DIVISOR = 100;
// Rareium er en sjanse i prosent, så mer enn 100 gir ingen fordel. Taket
// hindrer også at tallet vokser uten grense mens spilleren holder et våpen.
export const RAREIUM_MAX = 100;
export const RECYCLE_REFUND_RATIO = 0.7;

export { strategicWeapons, BIO_DESTROY_CHANCE };

// Loggoppføringer er objekter. Klienten lager tekst og ikon, se gameLog.js.
const logEntry = (G, entry) => G.log.unshift(entry);

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

// Klikk på egen celle: undertrykk uro (forsinket revolt) eller forsterk
// cellen (forankring). Ellers ugyldig.
function suppressRevolt(G, id, playerID) {
  const unrest = hasUnrest(G, id);
  if (!unrest && !canReinforce(G, id)) return INVALID_MOVE;
  resetBlink(G);
  if (unrest) suppress(G, id);
  else reinforce(G, id);
  G.lastCellAttacked = id;
  const type = unrest ? 'suppress' : 'reinforce';
  logEntry(G, { type, player: playerID, cell: id });
  markCell(G, id, 'claim');
  return undefined;
}

// Nullstiller blinkene fra forrige trekk og starter en ny blink-runde.
function resetBlink(G) {
  G.blink.fill(false);
  G.blinkKind?.fill(null);
  G.blinkVersion++;
}

// Hvert våpen returnerer false hvis trekket er ugyldig. Loggføringen gjøres
// av useStrategicWeapon.
const WEAPON_HANDLERS = {
  Artillery: ({ G, input }) => {
    [input, ...GetNeighbors(input)].forEach((target) => {
      G.cells[target] = null;
      G.blink[target] = true;
    });
    G.lastCellAttacked = input;
    return true;
  },
  'Air Strike': ({ G, input }) => {
    input.forEach((id) => {
      G.cells[id] = null;
      G.blink[id] = true;
    });
    G.lastCellAttacked = input[2];
    return true;
  },
  'Biological Warfare': ({ G, input, random, affected }) => {
    GetSurroundingCells(input).forEach((target) => {
      if (random.Number() < BIO_DESTROY_CHANCE) {
        G.cells[target] = null;
        G.blink[target] = true;
        affected.push(target);
      }
    });
    G.lastCellAttacked = input;
    return true;
  },
  'Dirty Nuke': ({ G, input }) => {
    if (G.destroyed[input]) return false;
    G.cells[input] = null;
    G.destroyed[input] = true;
    G.blink[input] = true;
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
    // Celler tatt ved invasjon som ennå ikke teller for seier (fortify).
    fresh: Array(TOTAL_CELLS).fill(false),
    // Spilleren som tok cellen først (eksperiment, se invasionRules.js).
    origin: Array(TOTAL_CELLS).fill(null),
    // Gjenerobrede celler som ikke kan invaderes i neste tur (eksperiment).
    immune: Array(TOTAL_CELLS).fill(false),
    // Forankring (eksperiment): styrke per celle, og om cellen ble angrepet
    // siden eierens forrige tur.
    strength: Array(TOTAL_CELLS).fill(0),
    attacked: Array(TOTAL_CELLS).fill(false),
    // Forsinket revolt (eksperiment): turen uroen startet, ellers null.
    unrest: Array(TOTAL_CELLS).fill(null),
  }),

  turn: {
    minMoves: 1,
    maxMoves: 1,
    onBegin: ({ G, ctx, random }) => {
      G.lastCellAttacked = null;
      consolidate(G, ctx.currentPlayer);

      const ownedCells = G.cells.filter(
        (cell) => cell === ctx.currentPlayer,
      ).length;
      G.Rareium[ctx.currentPlayer] = Math.min(
        RAREIUM_MAX,
        G.Rareium[ctx.currentPlayer] + ownedCells,
      );

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
    onEnd: ({ G, ctx, random }) => {
      const any = runRevolts(G, ctx, random, {
        lost: (i) => {
          logEntry(G, { type: 'revolt', player: G.cells[i], cell: i });
          G.cells[i] = null;
          markCell(G, i, 'revolt');
        },
        unrest: (i) =>
          logEntry(G, { type: 'unrest', player: G.cells[i], cell: i }),
      });
      if (any) G.blinkVersion++;
    },
  },

  moves: {
    clickCell: ({ G, playerID, random }, id) => {
      if (!isCellId(id) || G.destroyed[id]) return INVALID_MOVE;
      if (G.cells[id] === playerID) return suppressRevolt(G, id, playerID);
      if (G.cells[id] !== null && !canInvade(G, id, playerID)) {
        return INVALID_MOVE;
      }
      resetBlink(G);
      G.lastCellAttacked = id;
      if (G.cells[id] === null) {
        claimCell(G, id, playerID);
        logEntry(G, { type: 'claim', player: playerID, cell: id });
        markCell(G, id, 'claim');
        return undefined;
      }
      const result = attack(G, id, playerID, random.Number());
      logEntry(G, { type: result, player: playerID, cell: id });
      markCell(G, id, result === 'hit' ? 'fail' : result);
      return undefined;
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
        G.Rareium[playerID] = Math.min(
          RAREIUM_MAX,
          G.Rareium[playerID] + refund,
        );
        G.strategicWeapon[playerID] = null;
        G.rareiumAtWeapon[playerID] = 0;
        logEntry(G, { type: 'recycle', player: playerID, weapon, refund });
      },
    },
    useStrategicWeapon: ({ G, playerID, random }, input) => {
      const weapon = G.strategicWeapon[playerID];
      if (!weapon || !isValidWeaponTarget(weapon, input)) return INVALID_MOVE;

      const before = { cells: [...G.cells], destroyed: [...G.destroyed] };
      resetBlink(G);
      const affected = [];
      const ok = WEAPON_HANDLERS[weapon]({
        G,
        input,
        random,
        affected,
      });
      if (!ok) return INVALID_MOVE;

      G.strategicWeapon[playerID] = null;
      const cells = Array.isArray(input) ? [...input] : [input];
      logEntry(G, { type: weapon, player: playerID, cells });
      recordWeaponEvent(G, weapon, cells, before, affected);
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
    // Ferske okkupasjoner (fortify) teller ikke ennå.
    const cells = countedCells(G);
    const winningLine = GetWinningLine(cells);
    if (winningLine) {
      // Vinneren er eieren av linjen, ikke nødvendigvis den som har turen.
      return { winner: cells[winningLine[0]], winningLine };
    }
    // Domination: hvis alle ikke-destroyed celler er eid av samme spiller, og
    // ingen tomme celler er igjen, vinner den spilleren. Dekker edge-casen
    // der nok celler er nuket til at ingen 4-på-rad er mulig.
    const dominator = GetDominator({ ...G, cells });
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
