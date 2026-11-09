import { useState } from 'react';

// Teller hvor mange ganger spilleren har fått et nytt våpen siden komponenten
// ble vist. Starter på 0, så et våpen som allerede finnes ved første visning
// (reload, sen tilkobling) ikke gir effekt. Brukes som `key` på våpenknappen,
// slik at CSS-animasjonen starter på nytt hver gang et våpen mottas.
export function useJustArmed(weapon) {
  const [previous, setPrevious] = useState(weapon);
  const [count, setCount] = useState(0);
  if (weapon !== previous) {
    setPrevious(weapon);
    if (weapon && !previous) setCount((c) => c + 1);
  }
  return count;
}
