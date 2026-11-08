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

**Balanse (mål først)**

- Rareium akkumuleres også mens spilleren holder et våpen, og er ubegrenset.
  Det gir hamstring og nytt våpen rett etter bruk.
- Recycle er gratis og teller ikke som trekk, så det er en billig reroll.
- Invasjon (20 %) lønner seg nesten aldri, så spillet kan bli defensivt.
- Snøballeffekt: lederen får mest Rareium og dermed våpen først. Vurder
  comeback-bonus.
- Ingen sudden death. Spillet kan ikke låse seg, men kan bli veldig langt.

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

- To kolonner fra ca. 900 px og kompakt mobil, slik at tur, våpen og Rareium
  ikke ligger under brettet. Grupper Rareium og våpen som ett panel.
- Lobbyen mangler "venter på motstander", kopier-knapp, `?match=`-lenke og
  frakoblet-varsel (`matchData[i].isConnected` brukes ikke).

**Tilgjengelighet og visuelt**

- Ingen `:focus-visible`, og ingen `prefers-reduced-motion` for blink og puls
  utenfor våpenanimasjonene.
- Celler mister territorienavnet som tilgjengelig navn når de er okkupert
  (bilde-alt vinner). Legg til `aria-label`.
- Ingen `aria-live` for turbytte, logg eller seier. `AboutPopup` mangler
  fokusfelle og fokus-retur.
- `--color-text-dim` på bakgrunnen har kontrast på ca. 2,4:1.
- Emoji-ikoner (våpen, logg) passer dårlig med stilen. Bytt til SVG.

**Flere animasjoner**

- Gjort (PR 42): revolt, invasjon (erobret og mislyktes), seierslinje, våpen
  mottatt og stempel når et territorium tas.
- Gjenstår: banner ved turbytte og drivende aske i lobbyen.
- Alle animasjoner er sett som enkeltframes, men ikke prøvd i ekte
  multiplayer med to klienter.

## Avvist (backlog)

- Persistens av matcher (databaseintegrasjon). Strider mot det bevisste
  valget i PLAN.md: ingen database, server-restart kan resette matcher.
- Spectator-modus. Droppet 8. november 2026, ikke behov.
