// Knipetang og forankring (eksperiment, se INVASJONSVARIANTER.md).
//
// Knipetang: en celle kan bare invaderes når angriperen har minst to egne
// naboer til den (RULES.pincer = 4 eller 8 naboer).
//
// Forankring: hver eid celle har styrke 1 til MAX_STRENGTH. En ny celle har
// styrke 1 og vokser med 1 når eierens tur begynner, hvis den ikke ble
// angrepet siden forrige gang. Et angrep som treffer, senker styrken med 1,
// og cellen faller når styrken når 0. Variantene (RULES.strength):
//   click:     angrip hvilken som helst fiendecelle, treffer alltid
//   attrition: angrip fra en egen nabocelle, treffer alltid, men den
//              angripende cellen mister også 1
//   risk:      angrip fra en egen nabocelle, sjansen avhenger av styrkene,
//              og en bom koster den angripende cellen 1

import { GetNeighbors, GetSurroundingCells } from './board.js';
import { RULES, MAX_STRENGTH } from './rules.js';

const PINCER_MIN = 2;

const neighbors8 = (id) => GetSurroundingCells(id).filter((n) => n !== id);
const neighborsOf = (id, kind) =>
  kind === 4 ? GetNeighbors(id) : neighbors8(id);

const needsAttacker = () =>
  RULES.strength === 'attrition' || RULES.strength === 'risk';

// Den sterkeste egne nabocellen, som angrepet går ut fra, eller null.
export function attackerCell(G, id, playerID) {
  let best = null;
  for (const n of neighbors8(id)) {
    if (G.cells[n] !== playerID) continue;
    if (best === null || G.strength[n] > G.strength[best]) best = n;
  }
  return best;
}

// Oppfyller angrepet kravene til knipetang og angrepscelle?
export function shapeAllows(G, id, playerID) {
  if (RULES.pincer) {
    const own = neighborsOf(id, RULES.pincer).filter(
      (n) => G.cells[n] === playerID,
    );
    if (own.length < PINCER_MIN) return false;
  }
  return !needsAttacker() || attackerCell(G, id, playerID) !== null;
}

// Sjansen for at ett angrep treffer under forankring, eller null hvis
// forankring ikke er i bruk.
export function strengthChance(G, id, playerID) {
  if (!RULES.strength) return null;
  if (RULES.strength !== 'risk') return 1;
  const from = attackerCell(G, id, playerID);
  const diff = (from === null ? 0 : G.strength[from]) - G.strength[id];
  return Math.min(0.8, Math.max(0.2, 0.5 + 0.15 * diff));
}

// Senker styrken til en celle med 1. Ved 0 blir cellen tom.
function weaken(G, id) {
  if (id === null) return;
  G.strength[id] -= 1;
  if (G.strength[id] <= 0) {
    G.cells[id] = null;
    G.strength[id] = 0;
  }
}

// Ett angrep under forankring. `roll` er et tall mellom 0 og 1. Returnerer
// 'conquer' (cellen falt), 'hit' (styrken sank) eller 'fail'.
export function strengthAttack(G, id, playerID, roll) {
  const from = needsAttacker() ? attackerCell(G, id, playerID) : null;
  const hit = roll < strengthChance(G, id, playerID);
  G.attacked[id] = true;
  if (!hit || RULES.strength === 'attrition') weaken(G, from);
  if (!hit) return 'fail';
  G.strength[id] -= 1;
  if (G.strength[id] > 0) return 'hit';
  G.cells[id] = playerID;
  G.strength[id] = 1;
  if (RULES.conquestImmunity && G.immune) G.immune[id] = true;
  return 'conquer';
}

// Kan spilleren forsterke sin egen celle (+1 styrke)?
export const canReinforce = (G, id) =>
  Boolean(RULES.strength && RULES.reinforce) && G.strength[id] < MAX_STRENGTH;

export function reinforce(G, id) {
  G.strength[id] += 1;
}

// Når en spillers tur begynner, vokser spillerens uangrepne celler.
export function growStrength(G, playerID) {
  if (!RULES.strength || !G.strength) return;
  for (let i = 0; i < G.cells.length; i++) {
    if (G.cells[i] !== playerID) continue;
    if (!G.attacked[i]) {
      G.strength[i] = Math.min(MAX_STRENGTH, G.strength[i] + 1);
    }
    G.attacked[i] = false;
  }
}
