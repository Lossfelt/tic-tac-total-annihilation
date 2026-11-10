// Invasjon og revolt, med eksperimentelle regelvarianter som styres fra
// simuleringen (se INVASJONSVARIANTER.md). Spillet bruker standardverdiene i
// DEFAULT_RULES, som er dagens regler.

export const INVASION_SUCCESS_CHANCE = 0.5;
export const REVOLT_CHANCE = 0.05;

const DEFAULT_RULES = {
  // flip: angriperen får cellen. fortify: cellen teller for seier først når
  // angriperens neste tur begynner. raze: cellen tømmes.
  invasion: 'flip',
  // Sjanse for å ta tilbake en fersk okkupasjon (fortify). null = vanlig.
  freshRetake: null,
  // En fersk okkupasjon som er tatt tilbake, kan ikke invaderes i neste tur.
  immunity: false,
  // Sjanse når angriperen er cellens opprinnelige eier. null = vanlig.
  originRetake: null,
  // all: alle eide celler kan gjøre opprør. occupied: bare celler der eieren
  // ikke er den som tok cellen først.
  revolt: 'all',
  revoltChance: REVOLT_CHANCE,
};

export const RULES = { ...DEFAULT_RULES };

export function resetRules(overrides = {}) {
  Object.assign(RULES, DEFAULT_RULES, overrides);
}

// Sjansen for at `attacker` lykkes med å invadere cellen.
export function invasionChance(G, id, attacker) {
  if (RULES.originRetake !== null && G.origin?.[id] === attacker) {
    return RULES.originRetake;
  }
  if (RULES.freshRetake !== null && G.fresh?.[id]) return RULES.freshRetake;
  return INVASION_SUCCESS_CHANCE;
}

export const isImmune = (G, id) => Boolean(G.immune?.[id]);

// Vellykket invasjon. Å ta tilbake en fersk okkupasjon gjenoppretter cellen:
// den blir ikke fersk igjen, men kan få immunitet.
export function applyInvasion(G, id, playerID) {
  const wasFresh = Boolean(G.fresh?.[id]);
  if (RULES.invasion === 'raze') {
    G.cells[id] = null;
    if (G.fresh) G.fresh[id] = false;
    return;
  }
  G.cells[id] = playerID;
  if (G.fresh) G.fresh[id] = RULES.invasion === 'fortify' && !wasFresh;
  if (G.immune && wasFresh && RULES.immunity) G.immune[id] = true;
}

// Første spiller som tar en tom celle, blir dens opprinnelige eier.
export function markOrigin(G, id, playerID) {
  if (G.origin && G.origin[id] === null) G.origin[id] = playerID;
}

// Når en spillers tur begynner, er spillerens ferske okkupasjoner befestet,
// og motstanderens immunitet er brukt opp. Tømte celler mister begge.
export function consolidate(G, playerID) {
  const keep = (flag, i) =>
    flag && G.cells[i] !== null && G.cells[i] !== playerID;
  if (G.fresh) G.fresh = G.fresh.map(keep);
  if (G.immune) G.immune = G.immune.map(keep);
}

// Cellene slik de teller for seier: ferske okkupasjoner regnes som tomme.
export function countedCells(G) {
  if (!G.fresh) return G.cells;
  return G.cells.map((owner, i) => (G.fresh[i] ? null : owner));
}

// Kan cellen gjøre opprør etter gjeldende regel?
export function mayRevolt(G, id) {
  const owner = G.cells[id];
  if (owner === null) return false;
  if (RULES.revolt !== 'occupied') return true;
  const origin = G.origin?.[id];
  return origin !== null && origin !== undefined && origin !== owner;
}
