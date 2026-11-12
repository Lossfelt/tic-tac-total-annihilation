// Regelvarianter du kan prøve mot datamaskinen (eksperiment, se
// INVASJONSVARIANTER.md). Velges med lenken ?regler=<navn>, for eksempel
// http://localhost:3000/?regler=knipetang. Uten lenke brukes dagens regler.

export const PRESETS = {
  okkupasjon: {
    label: 'Okkupasjon + gjenerobring + immunitet',
    help:
      'En erobret celle teller for seier først ved angriperens neste tur ' +
      '(stiplet kant). Å ta den tilbake har 75 % sjanse, og en celle som er ' +
      'tatt tilbake, kan ikke angripes i neste tur (skjold).',
    rules: { invasion: 'fortify', freshRetake: 0.75, immunity: true },
  },
  knipetang: {
    label: 'Knipetang (8 naboer)',
    help:
      'Du kan bare invadere en fiendecelle når du har minst to egne naboer ' +
      'til den, også diagonalt. Celler du ikke kan angripe nå, er dempet.',
    rules: { pincer: 8 },
  },
  risk: {
    label: 'Forankring 5c (RISK)',
    help:
      'Celler har styrke 1 til 3 (prikker) og vokser med 1 hver runde de ' +
      'ikke blir angrepet. Du angriper fra en egen nabocelle. Sjansen står ' +
      'på cellen og avhenger av styrkene. Et treff senker styrken, en bom ' +
      'koster din angripende celle 1.',
    rules: { strength: 'risk' },
  },
};

export function presetFromUrl() {
  const name = new URLSearchParams(window.location.search).get('regler');
  return PRESETS[name] ? { name, ...PRESETS[name] } : null;
}
