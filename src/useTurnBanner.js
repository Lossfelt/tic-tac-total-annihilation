import { useState, useEffect } from 'react';

export const TURN_BANNER_MS = 1400;

// Viser et banner når turen skifter. Banneret venter til en eventuell
// våpenanimasjon er ferdig, vises ikke ved første visning (reload, sen
// tilkobling) og ikke etter at spillet er over. `handled` er siste tur som
// har fått (eller hoppet over) sitt banner.
export function useTurnBanner(turn, { animating, gameover }) {
  const [handled, setHandled] = useState(turn);
  const visible = !gameover && !animating && turn !== handled;

  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(() => setHandled(turn), TURN_BANNER_MS);
    return () => clearTimeout(timer);
  }, [visible, turn]);

  return visible;
}
