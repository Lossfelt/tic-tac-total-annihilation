// Bottens vurdering av invasjon og revolt under regelvariantene i rules.js
// (se INVASJONSVARIANTER.md). Skilt ut fra botStrategy.js.

import { RULES } from './rules.js';
import { canInvade, invasionChance } from './invasionRules.js';
import { attackerCell, canReinforce } from './strengthRules.js';
import { LINES } from './board.js';
import { hasUnrest } from './revoltRules.js';

// Minste verdi (ownerStake) for at botten bruker turen på å undertrykke uro.
const SUPPRESS_THRESHOLD = 3;

// Tar ett angrep cellen nå (hvis det lykkes)? Under forankring må styrken
// være 1.
export function invadeTakesCell(G, id, me) {
  if (!canInvade(G, id, me)) return false;
  return !RULES.strength || G.strength[id] <= 1;
}

// Forventet verdi av å angripe cellen, eller null hvis det ikke er lov.
// `gain` er verdien av å eie cellen, `stake` gir verdien av en egen celle.
export function invasionScore(G, id, me, gain, stake) {
  if (!canInvade(G, id, me)) return null;
  const p = invasionChance(G, id, me);
  if (!RULES.strength) return p * gain;
  const progress = G.strength[id] <= 1 ? 1 : 0.6 / G.strength[id];
  return p * gain * progress - attackCost(G, id, me, p, stake);
}

// Hva angrepet kan koste den angripende cellen (attrition og risk).
function attackCost(G, id, me, p, stake) {
  if (RULES.strength === 'click') return 0;
  const from = attackerCell(G, id, me);
  const lossValue = G.strength[from] <= 1 ? 2 + stake(G, from) : 0.5;
  const lossChance = RULES.strength === 'attrition' ? 1 : 1 - p;
  return lossChance * lossValue;
}

// Undertrykk uro i den viktigste egne cellen, hvis den er verdt et trekk.
export function suppressMove(G, me, stake) {
  let best = null;
  for (let id = 0; id < G.cells.length; id++) {
    if (G.cells[id] !== me || !hasUnrest(G, id)) continue;
    const value = stake(G, id);
    if (!best || value > best.value) best = { id, value };
  }
  if (!best || best.value < SUPPRESS_THRESHOLD) return null;
  return { move: 'clickCell', args: [best.id] };
}

// Forsterk den svakeste egne cellen som blokkerer en linje der motstanderen
// har tre, hvis motstanderen kan angripe den (forankring med forsterkning).
export function reinforceMove(G, me, opponent) {
  let best = null;
  for (const line of LINES) {
    if (line.filter((id) => G.cells[id] === opponent).length !== 3) continue;
    const gap = line.find((id) => G.cells[id] !== opponent);
    if (G.cells[gap] !== me || G.destroyed[gap]) continue;
    if (!canReinforce(G, gap) || !canInvade(G, gap, opponent)) continue;
    if (!best || G.strength[gap] < G.strength[best]) best = gap;
  }
  return best === null ? null : { move: 'clickCell', args: [best] };
}
