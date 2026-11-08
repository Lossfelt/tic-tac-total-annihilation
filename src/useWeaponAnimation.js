import { useState, useEffect } from 'react';
import { getWeaponTiming } from './weaponAnimation.js';

const NO_EVENT = { type: null, cells: [], before: null, version: 0 };

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Styrer avspilling av våpenanimasjoner. Serveren har alt byttet brettet når
// klienten får hendelsen, så vi viser brettet fra før treffet (event.before)
// frem til treffene, og blokkerer trekk mens animasjonen går.
//
// Returnerer:
//   anim: tidslinjen for animasjonen som spilles nå, ellers null
//   animating: true mens animasjonen går (trekk skal blokkeres)
//   shown: brettet som skal tegnes ({ cells, destroyed })
//
// seenVersion starter på gjeldende versjon, så en reload eller en sen
// tilkobling spiller ikke av gamle hendelser.
export function useWeaponAnimation(G) {
  const event = G.weaponEvent ?? NO_EVENT;
  const [seenVersion, setSeenVersion] = useState(event.version);
  const [anim, setAnim] = useState(null);
  const [swapped, setSwapped] = useState(false);
  const [hitIds, setHitIds] = useState([]);

  if (event.version !== seenVersion) {
    setSeenVersion(event.version);
    const timing =
      event.before && !prefersReducedMotion() ? getWeaponTiming(event) : null;
    setAnim(timing && { ...timing, event });
    setSwapped(false);
    setHitIds([]);
  }

  useEffect(() => {
    if (!anim) return undefined;
    const timers = [
      setTimeout(() => setSwapped(true), anim.impactMs),
      setTimeout(() => setAnim(null), anim.durationMs),
      ...anim.hits.map(({ id, t }) =>
        setTimeout(() => setHitIds((ids) => [...ids, id]), t),
      ),
    ];
    return () => timers.forEach(clearTimeout);
  }, [anim]);

  const showBefore = anim && !swapped;
  const shown = showBefore
    ? {
        cells: anim.event.before.cells.map((c, i) =>
          hitIds.includes(i) ? null : c,
        ),
        destroyed: anim.event.before.destroyed,
      }
    : G;

  return { anim, animating: anim !== null, shown };
}
