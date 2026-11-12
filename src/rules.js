// Regelinnstillinger for invasjon og revolt. Standardverdiene er dagens
// regler. Eksperimentene (se INVASJONSVARIANTER.md) endrer RULES fra
// simuleringen.

export const INVASION_SUCCESS_CHANCE = 0.5;
export const REVOLT_CHANCE = 0.05;
// Høyeste styrke en celle kan få under forankring.
export const MAX_STRENGTH = 3;

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
  // Knipetang: null, 4 eller 8. Krever minst to egne naboer (rett ut eller
  // også diagonalt) for å invadere.
  pincer: null,
  // Knipetang gjelder ikke når en fersk okkupasjon tas tilbake (fortify).
  pincerFreshExempt: false,
  // Forankring: null, 'click', 'attrition' eller 'risk'. Celler har styrke
  // 1 til MAX_STRENGTH, se strengthRules.js.
  strength: null,
  // Styrken en ny (tom) celle får når den tas.
  claimStrength: 1,
  // Under forankring: en erobret celle kan ikke angripes i motstanderens
  // neste tur, så den ikke tas tilbake med en gang.
  conquestImmunity: false,
  // Under forankring: klikk på egen celle gir +1 styrke (overlapper med
  // befesting).
  reinforce: false,
  // all: alle eide celler kan gjøre opprør. occupied: bare celler der eieren
  // ikke tok cellen først. delayed: opprøret varsles og kan undertrykkes.
  revolt: 'all',
  revoltChance: REVOLT_CHANCE,
  // Isolasjon: null, 4 eller 8. Bare celler uten egne naboer kan gjøre
  // opprør.
  revoltIsolated: null,
  // Uro fra erobring: null, 'lose' (erobret celle går tapt hvis uroen ikke
  // undertrykkes i erobrerens neste tur) eller 'nocount' (som lose, og
  // cellen teller ikke for seier mens den er urolig).
  conquestUnrest: null,
  // Overstrekk: null eller antall celler du kan eie uten risiko for revolt.
  // Over det får hver celle overreachStep høyere sjanse per ekstra celle.
  overreachFree: null,
  overreachStep: 0.02,
  // Overstrekk etter forsprang: sjansen regnes av hvor mange flere celler du
  // har enn motstanderen, ikke av hvor mange du har.
  overreachLead: false,
};

export const RULES = { ...DEFAULT_RULES };

export function resetRules(overrides = {}) {
  Object.assign(RULES, DEFAULT_RULES, overrides);
}
