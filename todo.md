# TODO

Ting som ikke er en del av en aktiv plan, men som kan tas opp senere.

## Jevnlig oppfølging

### Sjekk om boardgame.io har innført `exports`

Sjekk jevnlig (f.eks. sammen med revurderingen rundt februar 2027, se
under) om boardgame.io har fått et `exports`-felt i `package.json`, og
om det peker på ESM-byggene. Siste sjekk 8. november 2026: nyeste
versjon på npm er fortsatt 0.50.2, uten `exports`, og
`boardgame.io/server/package.json` har `"main": "../dist/cjs/server.js"`.

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

## Avvist

### Rydde opp i boardgame.io-imports (tidligere plan 1.2)

Planen var å bytte dypstiene (`boardgame.io/dist/cjs/core.js` osv.) til
de offisielle entry-points (`boardgame.io/core`, `/react`, `/multiplayer`,
`/client`, `/server`). Avvist, ikke bare utsatt:

- Proxy-mappene har `"main"` som peker på CJS-bygg, og pakken har ingen
  `exports`. Node ESM (`server.mjs`, og `Game.js` som deles med serveren)
  kan derfor ikke bruke dem.
- `App.jsx` bruker bevisst `dist/esm/...`. Rolldown i Vite 8 klarer ikke
  å tree-shake det Svelte-baserte debug-panelet fra CJS-byggene, som
  gir ca. 80 kB større produksjonsbundle. Rene entry-points ville trukket
  CJS inn igjen.
- Gjenstående gevinst er rent estetisk.

Se README under "Avhengigheter og sikkerhet". Gjenåpnes bare hvis
oppfølgingspunktet over viser at `exports` peker på ESM-byggene.

## Backlog (lavere prioritet, ta etter hvert)

- Gi de strategiske våpnene ulik sannsynlighet. I dag plukkes ett av
  våpnene med lik sjanse via `random.Die(strategicWeapons.length)` i
  `Game.js`. Innfør en vekttabell og en liten funksjon som velger med
  vekter via `random.Number()` (deterministisk i tester). Kraftigere
  våpen skal være sjeldnere (f.eks. Dirty Nuke sjelden, Artillery vanlig).
- Knytt brettet tydeligere til territorienavnene. I dag finnes navnet
  bare som `title`-tooltip, som ikke virker på mobil. Vis navnet i en fast
  infolinje under brettet ved trykk eller hover, og legg til `aria-label`.
- AI-motspiller. Det finnes en stub i `Game.js` under `ai.enumerate`, men
  den foreslår bare `clickCell` på tomme celler og ignorerer invasjon,
  våpen og recycle. Krever også en lokal modus (uten server) i `App.jsx`.
  Start med en enkel heuristikk.
- Lyd-effekter for våpen og trekk. Våpenanimasjonene er ferdige (PR 42), så
  lyden kan legges på tidspunktene i `weaponAnimation.js`.
- TypeScript-rewrite (kun ved en større refaktor i fremtiden, jf.
  PLAN.md).

## Funn fra gjennomgang av spillet (8. november 2026)

Bekreftet i koden, grovt prioritert. Balanse er antakelser og bør måles med
en simulering før noe endres.

**Robusthet**

Ferdig 8. november 2026: Air Strike kan angre enkeltvalg og viser melding ved
ugyldig valg, `handleLeave` og `handlePlayAgain` håndterer feil, `endIf` bruker
linjens eier, credentials logges ikke, `playerView` skjuler motstanderens
Rareium og våpen, og en reload gjenopptar matchen via `sessionStorage`.

- Gjenstår: en lagret økt kan peke på en match som er borte (serveren
  restartet). Da må spilleren trykke Leave. Vurder å sjekke matchen ved
  gjenopptakelse.

**Tester**

Ferdig 8. november 2026: tester for `clickCell`, revolt i `onEnd`, `onBegin`
(Rareium og våpentildeling), `playerView` og `endIf`. Balansesimulering ligger
i `scripts/simulate.mjs` (`npm run simulate`).

Første kjøring, 1000 partier med tilfeldige spillere som bruker våpen med 50 %
sjanse: spiller 0 vant 52 %, spiller 1 vant 47 %, 1 % uavgjort etter 400
trekk, 8 % seier ved dominans, median 53 trekk per parti, 90. persentil 201.
Våpnene brukes jevnt. Tilfeldige spillere sier lite om strategi, så bruk
tallene til å sammenligne regelendringer, ikke som fasit.

**Balanse (målt 8. november 2026)**

Målt med `npm run simulate` (600 partier per kjøring, våpen siktes grådig,
cellevalg ellers tilfeldig). Tallene er andel seiere for spiller 0 mot 1 når
de to bruker ulike enkle strategier. Dette er enkle bots, ikke optimalt spill.

- Hamstring lønner seg ikke. Å bruke våpen med 95 % sjanse slo å spare dem
  (5 %) med 63 mot 37. Gjort: Rareium er kappet ved 100 (`RAREIUM_MAX`), så
  tallet vokser ikke lenger uten grense mens man holder et våpen.
- Recycle er ikke en for sterk reroll. Å resirkulere 90 % av gangene ga 6,2
  våpen per parti mot 3,5, men tapte 39 mot 61 fordi våpnene sjelden brukes.
  Ingen endring nødvendig.
- Invasjon var for svak. Med 20 % vant en spiller som angriper i 90 % av
  trekkene 0,5 % mot en som aldri angriper. Gjort: økt til 50 %. Ny måling
  (600 partier): aggressiv mot passiv ble 46 mot 53, altså omtrent jevnt, og
  to tilfeldige spillere gir 52 mot 47. Median ca. 55 trekk. Spill litt for å se
  om 50 % gjør spillet for aggressivt.
- Snøballeffekt er moderat. Lederen etter 12 trekk vinner 56 til 60 % av
  partiene. Ingen comeback-bonus nødvendig nå.
- Første spiller har en liten fordel: 52 mot 47 % (resten uavgjort).
- Lengde: median ca. 53 trekk, 90. persentil ca. 200, og 0,5 til 1 % av
  partiene når 400-trekksgrensen. Sudden death er lavt prioritert.

**Struktur**

Ferdig 8. november 2026: `Board.jsx` er delt (433 til 134 linjer) i
`BoardGrid`, `WeaponPanel`, `RareiumBar`, `GameLog`, `FactionMark` og hooken
`useWeaponTargeting`. `App.jsx` har fått `Lobby.jsx` (286 til 199 linjer).
`Board.css` er et samleløp over syv filer i `src/styles`. Våpenmetadata
ligger i `weapons.js`, og loggen er strukturerte objekter (`gameLog.js`).

- Gjenstår: revolt-oppføringen husker nå forrige eier (`player`), men loggteksten
  viser det ikke ennå ("hvem mistet cellen").
- Gjenstår: `Game.js` er ca. 460 linjer. Vurder å skille ut brettgeometrien
  (`IsRow`, `GetNeighbors`, `GetSurroundingCells`, vinnerlinjer) i
  `board.js`.

**Layout og lobby**

Ferdig 9. november 2026: to kolonner fra 900 px (brett til venstre, tur,
våpen, Rareium og logg til høyre), "venter på motstander" med kopier-lenke,
`?match=`-invitasjon som fyller ut match-ID, frakoblet-varsel, og kontroll av
at den lagrede matchen finnes før gjenopptakelse. Sett i nettleseren på 1200 px
og 375 px, ikke prøvd med to ekte spillere.

- Gjenstår: på mobil ligger tur og våpen under brettet. Vurder en kompakt rad
  rett under brettet, og å skjule loggen bak en knapp.

**Tilgjengelighet og visuelt**

Ferdig 8. november 2026: `:focus-visible`, global `prefers-reduced-motion`,
`aria-label` på celler (territorium og status), `aria-live` for turbytte, logg
og seier, fokusfelle og fokus-retur i `AboutPopup`, og tekstfargene
`--color-text-muted` og `--color-text-dim` er lysnet til minst 4,5:1 mot
bakgrunnene. Ikke prøvd med skjermleser.

- Emoji-ikoner (våpen, logg) passer dårlig med stilen. Bytt til SVG.
- Gjenstår å sjekke: kontrast på andre farger enn tekstfargene (f.eks.
  rust-tekst på mørk bakgrunn), og at fokusringen ikke klippes på celler.

**Flere animasjoner**

- Gjort: revolt, invasjon (erobret og mislyktes), seierslinje, våpen mottatt,
  stempel når et territorium tas, soppsky v3 for Dirty Nuke, banner ved
  fremheving av turindikatoren når det blir din tur (`useTurnHighlight`, erstattet et banner) og drivende aske i lobbyen (`LobbyAsh`).
- Alle animasjoner er sett som enkeltframes i nettleseren, men ikke prøvd i
  ekte multiplayer med to klienter.

## Avvist (backlog)

- Persistens av matcher (databaseintegrasjon). Strider mot det bevisste
  valget i PLAN.md: ingen database, server-restart kan resette matcher.
- Spectator-modus. Droppet 8. november 2026, ikke behov.
