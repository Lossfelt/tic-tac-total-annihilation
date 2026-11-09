// Lagrer plassen i en match i sessionStorage, slik at en reload gjenopptar
// matchen i stedet for å sende spilleren tilbake til lobbyen. sessionStorage
// følger fanen og forsvinner når den lukkes. Alle kall tåler at lagringen er
// blokkert (privat modus, blokkerte data).

const KEY = 'ttta-session';

export function loadSession() {
  try {
    const data = JSON.parse(sessionStorage.getItem(KEY));
    if (data?.matchID && data.playerID !== undefined && data.credentials) {
      return {
        name: String(data.name ?? ''),
        matchID: String(data.matchID),
        playerID: String(data.playerID),
        credentials: String(data.credentials),
      };
    }
  } catch {
    // Ingen lagret økt, eller ugyldig innhold.
  }
  return null;
}

export function saveSession(session) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Lagring er valgfri.
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Lagring er valgfri.
  }
}
