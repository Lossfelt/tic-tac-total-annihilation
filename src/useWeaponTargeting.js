import { useState } from 'react';
import { IsRow } from './board.js';
import { WEAPONS } from './weapons.js';

// Målvalg for strategiske våpen: hvilket våpen som er aktivt, hvilke celler
// som er valgt, og feilmelding ved ugyldig valg. `pick(id)` håndterer et
// celleklikk mens et våpen er aktivt og sender trekket når målet er fullt.
export function useWeaponTargeting(moves, myWeapon) {
  const [active, setActive] = useState(false);
  const [targets, setTargets] = useState([]);
  const [error, setError] = useState('');

  const toggle = () => {
    if (!active) {
      if (myWeapon) setActive(myWeapon);
    } else {
      setActive(false);
      setTargets([]);
      setError('');
    }
  };

  // Avfyrer våpenet i samme klikk som fullfører målutvalget. Dette lå
  // tidligere i en useEffect som reagerte på at listen ble full, men å sende
  // et trekk som bieffekt av en render er skjørt: kjører effekten på nytt,
  // sendes trekket to ganger.
  const pick = (id) => {
    const requiredCount = WEAPONS[active].targetCount;
    setError('');
    // Klikk på et valgt mål fjerner det igjen.
    if (requiredCount > 1 && targets.includes(id)) {
      setTargets(targets.filter((t) => t !== id));
      return;
    }
    // Et ugyldig fullt valg står igjen til spilleren fjerner en celle.
    if (requiredCount > 1 && targets.length >= requiredCount) {
      setError('Deselect a cell first, then pick another.');
      return;
    }
    const next = [...targets, id];
    if (next.length < requiredCount) {
      setTargets(next);
      return;
    }
    // Air Strike vil ha tre på rad. Er valget ugyldig beholdes det, så
    // spilleren kan rette det i stedet for å miste våpenmodusen.
    if (requiredCount > 1 && !IsRow(next)) {
      setTargets(next);
      setError('The three cells must be in a straight line.');
      return;
    }
    // Air Strike vil ha hele array-en som mål; de andre tar en enkelt celle.
    moves.useStrategicWeapon(requiredCount === 1 ? next[0] : next);
    setTargets([]);
    setActive(false);
  };

  return {
    active,
    targets,
    error,
    count: active ? WEAPONS[active].targetCount : 0,
    toggle,
    pick,
  };
}
