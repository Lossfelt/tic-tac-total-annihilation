// Revolt på slutten av hver tur (eksperiment, se INVASJONSVARIANTER.md).
//
// Hvilke celler som kan gjøre opprør:
//   RULES.revolt = 'occupied': bare celler der eieren ikke tok cellen først
//   RULES.revoltIsolated = 4 eller 8: bare celler uten egne naboer (rett ut,
//   eller også diagonalt)
//   RULES.overreachFree: revoltsjansen øker med hvor mye eieren har
//   (overstrekk), i stedet for fast sjanse
// Hvordan:
//   RULES.revolt = 'delayed': opprøret varsles først som uro. Eieren kan bruke
//   sin neste tur på å undertrykke det (klikke på cellen). Ellers går cellen
//   tapt på slutten av den turen.
// Uro fra erobring (RULES.conquestUnrest): en celle som tas ved invasjon, får
// uro med en gang og går tapt etter erobrerens neste tur hvis den ikke
// undertrykkes. Med 'nocount' teller den heller ikke for seier så lenge den
// er urolig.

import { GetNeighbors, GetSurroundingCells } from './board.js';
import { RULES } from './rules.js';

const ownNeighbors = (G, id, kind) => {
  const near =
    kind === 4
      ? GetNeighbors(id)
      : GetSurroundingCells(id).filter((n) => n !== id);
  return near.filter((n) => G.cells[n] === G.cells[id]).length;
};

// Er cellen isolert (ingen egne naboer)? Uten isolasjonsregel: alltid true.
export function isIsolated(G, id) {
  if (!RULES.revoltIsolated) return true;
  return ownNeighbors(G, id, RULES.revoltIsolated) === 0;
}

// Kan cellen gjøre opprør etter gjeldende regel?
export function mayRevolt(G, id) {
  const owner = G.cells[id];
  if (owner === null || !isIsolated(G, id)) return false;
  if (RULES.revolt !== 'occupied') return true;
  const origin = G.origin?.[id];
  return origin !== null && origin !== undefined && origin !== owner;
}

// Sjansen for at én celle gjør opprør denne turen. Under overstrekk øker den
// med hvor mange celler eieren har.
export function revoltChanceFor(G, id) {
  if (RULES.overreachFree === null) return RULES.revoltChance;
  return overreachChance(G, G.cells[id]);
}

export function overreachChance(G, playerID) {
  const count = (p) => G.cells.filter((c) => c === p).length;
  const opponent = playerID === '0' ? '1' : '0';
  const owned = RULES.overreachLead
    ? count(playerID) - count(opponent)
    : count(playerID);
  return Math.max(0, owned - RULES.overreachFree) * RULES.overreachStep;
}

export const hasUnrest = (G, id) =>
  G.unrest?.[id] !== null && G.unrest?.[id] !== undefined;

export function suppress(G, id) {
  G.unrest[id] = null;
}

// Uro fra erobring: markeres i turen erobringen skjer.
export function markConquestUnrest(G, id, turn) {
  if (RULES.conquestUnrest && G.unrest) G.unrest[id] = turn;
}

// Kjøres i turn.onEnd. `hooks.lost(id)` og `hooks.unrest(id)` lar Game.js
// logge og vise hendelsene. Returnerer true hvis noe skjedde.
export function runRevolts(G, ctx, random, hooks) {
  const lost = loseUnrest(G, ctx, hooks);
  const fresh =
    RULES.revolt === 'delayed'
      ? newUnrest(G, ctx, random, hooks)
      : instantRevolts(G, random, hooks);
  return lost || fresh;
}

// Uro som eieren ikke undertrykte i sin tur, blir til opprør.
function loseUnrest(G, ctx, hooks) {
  if (!G.unrest) return false;
  let any = false;
  for (let i = 0; i < G.cells.length; i++) {
    if (!hasUnrest(G, i)) continue;
    if (G.cells[i] === null) G.unrest[i] = null;
    else if (G.cells[i] === ctx.currentPlayer && G.unrest[i] < ctx.turn) {
      G.unrest[i] = null;
      hooks.lost(i);
      any = true;
    }
  }
  return any;
}

function newUnrest(G, ctx, random, hooks) {
  let any = false;
  for (let i = 0; i < G.cells.length; i++) {
    if (hasUnrest(G, i) || i === G.lastCellAttacked || !mayRevolt(G, i)) {
      continue;
    }
    if (random.Number() >= revoltChanceFor(G, i)) continue;
    G.unrest[i] = ctx.turn;
    hooks.unrest(i);
    any = true;
  }
  return any;
}

function instantRevolts(G, random, hooks) {
  let any = false;
  for (let i = 0; i < G.cells.length; i++) {
    if (i === G.lastCellAttacked || !mayRevolt(G, i)) continue;
    if (random.Number() >= revoltChanceFor(G, i)) continue;
    hooks.lost(i);
    any = true;
  }
  return any;
}
