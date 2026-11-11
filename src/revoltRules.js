// Revolt på slutten av hver tur. Med RULES.revolt = 'delayed' varsles
// opprøret først (uro). Eieren kan bruke sin neste tur på å undertrykke det
// (klikke på cellen). Ellers går cellen tapt på slutten av den turen.

import { RULES } from './rules.js';

// Kan cellen gjøre opprør (all og occupied)?
export function mayRevolt(G, id) {
  const owner = G.cells[id];
  if (owner === null) return false;
  if (RULES.revolt !== 'occupied') return true;
  const origin = G.origin?.[id];
  return origin !== null && origin !== undefined && origin !== owner;
}

export const hasUnrest = (G, id) =>
  G.unrest?.[id] !== null && G.unrest?.[id] !== undefined;

export function suppress(G, id) {
  G.unrest[id] = null;
}

// Kjøres i turn.onEnd. `hooks.lost(id)` og `hooks.unrest(id)` lar Game.js
// logge og vise hendelsene. Returnerer true hvis noe skjedde.
export function runRevolts(G, ctx, random, hooks) {
  return RULES.revolt === 'delayed'
    ? delayedRevolts(G, ctx, random, hooks)
    : instantRevolts(G, random, hooks);
}

function instantRevolts(G, random, hooks) {
  let any = false;
  for (let i = 0; i < G.cells.length; i++) {
    if (i === G.lastCellAttacked || !mayRevolt(G, i)) continue;
    if (random.Number() >= RULES.revoltChance) continue;
    hooks.lost(i);
    any = true;
  }
  return any;
}

function delayedRevolts(G, ctx, random, hooks) {
  let any = false;
  // Uro som eieren ikke undertrykte i sin tur, blir til opprør.
  for (let i = 0; i < G.cells.length; i++) {
    if (!hasUnrest(G, i)) continue;
    if (G.cells[i] === null) G.unrest[i] = null;
    else if (G.cells[i] === ctx.currentPlayer && G.unrest[i] < ctx.turn) {
      G.unrest[i] = null;
      hooks.lost(i);
      any = true;
    }
  }
  for (let i = 0; i < G.cells.length; i++) {
    if (G.cells[i] === null || hasUnrest(G, i) || i === G.lastCellAttacked) {
      continue;
    }
    if (random.Number() >= RULES.revoltChance) continue;
    G.unrest[i] = ctx.turn;
    hooks.unrest(i);
    any = true;
  }
  return any;
}
