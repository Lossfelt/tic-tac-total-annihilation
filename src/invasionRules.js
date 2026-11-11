// Invasjon, med eksperimentelle regelvarianter som styres fra simuleringen
// (se INVASJONSVARIANTER.md). Innstillingene ligger i rules.js, knipetang og
// forankring i strengthRules.js og revolt i revoltRules.js.

import { RULES, INVASION_SUCCESS_CHANCE } from './rules.js';
import {
  shapeAllows,
  strengthChance,
  strengthAttack,
  growStrength,
} from './strengthRules.js';

export {
  RULES,
  resetRules,
  INVASION_SUCCESS_CHANCE,
  REVOLT_CHANCE,
  MAX_STRENGTH,
} from './rules.js';
export { mayRevolt } from './revoltRules.js';

export const isImmune = (G, id) => Boolean(G.immune?.[id]);

// Er det lov for `attacker` å invadere cellen nå?
export function canInvade(G, id, attacker) {
  return !isImmune(G, id) && shapeAllows(G, id, attacker);
}

// Sjansen for at `attacker` lykkes med ett angrep på cellen.
export function invasionChance(G, id, attacker) {
  const strength = strengthChance(G, id, attacker);
  if (strength !== null) return strength;
  if (RULES.originRetake !== null && G.origin?.[id] === attacker) {
    return RULES.originRetake;
  }
  if (RULES.freshRetake !== null && G.fresh?.[id]) return RULES.freshRetake;
  return INVASION_SUCCESS_CHANCE;
}

// Ett angrep på en fiendecelle. `roll` er et tall mellom 0 og 1. Returnerer
// 'conquer', 'hit' (bare forankring: styrken sank) eller 'fail'.
export function attack(G, id, playerID, roll) {
  if (RULES.strength) {
    return clearOnChange(G, id, strengthAttack(G, id, playerID, roll));
  }
  if (roll >= invasionChance(G, id, playerID)) return 'fail';
  applyInvasion(G, id, playerID);
  return clearOnChange(G, id, 'conquer');
}

// Uro følger ikke med når cellen skifter eier.
function clearOnChange(G, id, result) {
  if (result === 'conquer' && G.unrest) G.unrest[id] = null;
  return result;
}

// Vellykket invasjon. Å ta tilbake en fersk okkupasjon gjenoppretter cellen:
// den blir ikke fersk igjen, men kan få immunitet.
export function applyInvasion(G, id, playerID) {
  const wasFresh = Boolean(G.fresh?.[id]);
  if (RULES.invasion === 'raze') {
    G.cells[id] = null;
    if (G.fresh) G.fresh[id] = false;
    return;
  }
  G.cells[id] = playerID;
  if (G.fresh) G.fresh[id] = RULES.invasion === 'fortify' && !wasFresh;
  if (G.immune && wasFresh && RULES.immunity) G.immune[id] = true;
}

// En tom celle tas. Første spiller som tar den, blir opprinnelig eier.
export function claimCell(G, id, playerID) {
  G.cells[id] = playerID;
  if (G.fresh) G.fresh[id] = false;
  if (G.strength) G.strength[id] = RULES.claimStrength;
  if (G.unrest) G.unrest[id] = null;
  markOrigin(G, id, playerID);
}

export function markOrigin(G, id, playerID) {
  if (G.origin && G.origin[id] === null) G.origin[id] = playerID;
}

// Når en spillers tur begynner: ferske okkupasjoner befestes, motstanderens
// immunitet er brukt opp, og spillerens celler vokser (forankring).
export function consolidate(G, playerID) {
  const keep = (flag, i) =>
    flag && G.cells[i] !== null && G.cells[i] !== playerID;
  if (G.fresh) G.fresh = G.fresh.map(keep);
  if (G.immune) G.immune = G.immune.map(keep);
  growStrength(G, playerID);
}

// Cellene slik de teller for seier: ferske okkupasjoner regnes som tomme.
export function countedCells(G) {
  if (!G.fresh) return G.cells;
  return G.cells.map((owner, i) => (G.fresh[i] ? null : owner));
}
