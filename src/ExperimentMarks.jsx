// Visning av regelvariantene på brettet (eksperiment, se rulePresets.js):
// fersk okkupasjon, immunitet, styrke, og hvilke fiendeceller du kan angripe
// og med hvilken sjanse. Med dagens regler viser den ingenting.

import { RULES } from './rules.js';
import { canInvade, invasionChance } from './invasionRules.js';
import { presetFromUrl } from './rulePresets.js';

// Sjansen vises bare når en regelvariant er valgt med lenken.
const SHOW_CHANCE = presetFromUrl() !== null;

const other = (playerID) => (playerID === '0' ? '1' : '0');

// Klassene og innholdet for én celle. `myTurn` er true når spilleren kan
// angripe nå.
export function experimentMarks(G, id, owner, playerID, myTurn) {
  const classes = [];
  if (G.fresh?.[id]) classes.push('cell-fresh');
  if (G.immune?.[id]) classes.push('cell-immune');
  let isProtected = false;
  let chance = null;
  if (myTurn && owner !== null && owner === other(playerID)) {
    if (!canInvade(G, id, playerID)) isProtected = true;
    else if (SHOW_CHANCE) chance = invasionChance(G, id, playerID);
  }
  if (isProtected) classes.push('cell-protected');
  const content = (
    <>
      {RULES.strength && owner !== null && (
        <span
          className="cell-strength"
          aria-label={`strength ${G.strength[id]}`}
        >
          {'●'.repeat(Math.max(0, G.strength[id]))}
        </span>
      )}
      {G.immune?.[id] && (
        <svg className="cell-shield" viewBox="0 0 20 24" aria-hidden="true">
          <path d="M10 1 19 4.5V11c0 6-4 10-9 12C5 21 1 17 1 11V4.5z" />
        </svg>
      )}
      {chance !== null && (
        <span className="cell-chance">{Math.round(chance * 100)}%</span>
      )}
    </>
  );
  return { classes, content, isProtected };
}
