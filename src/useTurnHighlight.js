import { useState, useEffect } from 'react';

export const TURN_HIGHLIGHT_MS = 1400;

// Sier om turindikatoren midlertidig skal fremheves etter et turbytte. Venter
// til en eventuell våpenanimasjon er ferdig, vises ikke ved første visning
// (reload, sen tilkobling) og ikke etter at spillet er over. `handled` er
// siste tur som har fått (eller hoppet over) sin fremheving.
export function useTurnHighlight(turn, { animating, gameover }) {
  const [handled, setHandled] = useState(turn);
  const visible = !gameover && !animating && turn !== handled;

  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(() => setHandled(turn), TURN_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [visible, turn]);

  return visible;
}
