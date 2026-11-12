import { RULES } from './rules.js';
import { overreachChance } from './revoltRules.js';

// Viser revoltrisikoen under overstrekk (eksperiment): sjansen per celle og
// tur for deg og motstanderen. Vises ikke med andre regler.
export function RevoltRisk({ G, playerID }) {
  if (RULES.overreachFree === null) return null;
  const opponent = playerID === '0' ? '1' : '0';
  const pct = (id) => `${Math.round(overreachChance(G, id) * 100)} %`;
  return (
    <div className="revolt-risk">
      Revolt risk per cell: you {pct(playerID)}, opponent {pct(opponent)}
      <span className="rule-picker-help">
        {RULES.overreachLead
          ? ' (rises with your lead in cells)'
          : ` (safe up to ${RULES.overreachFree} cells)`}
      </span>
    </div>
  );
}
