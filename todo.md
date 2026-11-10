# TODO

Ting som ikke er en del av en aktiv plan, men som kan tas opp senere.
Ferdig arbeid ligger i git-historikken og PR-ene, ikke her.

## Jevnlig oppfølging

### Sjekk om boardgame.io har innført `exports`

Sjekk jevnlig (f.eks. sammen med revurderingen rundt februar 2027) om
boardgame.io har fått et `exports`-felt i `package.json`, og om det peker
på ESM-byggene. Siste sjekk 8. november 2026: nyeste versjon på npm er
fortsatt 0.50.2, uten `exports`, og `boardgame.io/server/package.json` har
`"main": "../dist/cjs/server.js"`.

Sjekk i tillegg:

- Har 0.51 landet på npm? (Vedlikehold ligger på master, men uten ny
  release. Se boardgameio/boardgame.io#1236 og #1255.)
- Er `svelte` gjort valgfri peer-dependency i en utgitt versjon? Det
  fjerner de gjenstående sikkerhetsvarslene.

Kommando:

```bash
npm view boardgame.io version
node -e "console.log(require('boardgame.io/package.json').exports)"
```

Hvis `exports` finnes og peker på ESM: vurder å gjenåpne importopprydding
(se "Avvist" under). Hvis ikke: gjør ingenting.

## Backlog

- Gi de strategiske våpnene ulik sannsynlighet. I dag plukkes ett av
  våpnene med lik sjanse via `random.Die(strategicWeapons.length)` i
  `Game.js`. Innfør en vekttabell og velg med `random.Number()`
  (deterministisk i tester). Kraftigere våpen skal være sjeldnere.
- Vis territorienavnet på mobil. I dag finnes navnet bare som
  `title`-tooltip (og i `aria-label`). Vis det i en infolinje under brettet
  ved trykk eller hover.
- Revolt i loggen: oppføringen husker forrige eier (`player`), men teksten
  viser ikke hvem som mistet cellen.
- En server-restart midt i en kamp (ikke ved reload) fanges ikke opp. Ved
  reload sjekker `App.jsx` matchen med `getMatch` og sender spilleren til
  lobbyen med en melding.
- Tilgjengelighet som ikke er sjekket: kontrast på andre farger enn
  tekstfargene (f.eks. rust-tekst på mørk bakgrunn), at fokusringen ikke
  klippes på celler, og bruk med skjermleser.
- TypeScript-rewrite (kun ved en større refaktor i fremtiden, jf. PLAN.md).

## Balanse (målt 8. november 2026)

Målt med `npm run simulate` (600 partier per kjøring, våpen siktes grådig,
cellevalg ellers tilfeldig). Tallene er andel seiere for spiller 0 mot 1.
Enkle bots, ikke optimalt spill, så bruk tallene til å sammenligne
regelendringer, ikke som fasit.

- Hamstring lønnet seg ikke (63 mot 37 for å bruke våpen). Rareium er nå
  kappet ved 100 (`RAREIUM_MAX`).
- Recycle er ikke en for sterk reroll (39 mot 61 for den som resirkulerer
  90 % av gangene). Ingen endring.
- Invasjon var for svak ved 20 %. Økt til 50 %: aggressiv mot passiv ble
  46 mot 53. Spill mer for å se om 50 % gjør spillet for aggressivt.
- Snøballeffekten er moderat: lederen etter 12 trekk vinner 56 til 60 %.
- Første spiller har en liten fordel: 52 mot 47 % (resten uavgjort).
- Lengde: median ca. 53 trekk, 90. persentil ca. 200, og 0,5 til 1 % når
  400-trekksgrensen.

## Avvist

### Rydde opp i boardgame.io-imports (tidligere plan 1.2)

Planen var å bytte dypstiene (`boardgame.io/dist/cjs/core.js` osv.) til
de offisielle entry-points. Avvist, ikke bare utsatt:

- Proxy-mappene har `"main"` som peker på CJS-bygg, og pakken har ingen
  `exports`. Node ESM (`server.mjs`, og `Game.js` som deles med serveren)
  kan derfor ikke bruke dem.
- `App.jsx` bruker bevisst `dist/esm/...`. Rolldown i Vite 8 klarer ikke
  å tree-shake det Svelte-baserte debug-panelet fra CJS-byggene, som
  gir ca. 80 kB større produksjonsbundle.
- Gjenstående gevinst er rent estetisk.

Se README under "Avhengigheter og sikkerhet". Gjenåpnes bare hvis
oppfølgingspunktet over viser at `exports` peker på ESM-byggene.

### Annet

- Persistens av matcher (database). Strider mot det bevisste valget i
  PLAN.md: ingen database, server-restart kan resette matcher.
- Spectator-modus. Droppet 8. november 2026, ikke behov.
