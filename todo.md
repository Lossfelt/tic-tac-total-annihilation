# TODO

Ting som ikke er en del av en aktiv plan, men som kan tas opp senere.

## Blokkerte / utsatte oppgaver

### Rydde opp i boardgame.io-imports (tidligere plan 1.2)

Bytte interne dypstier til de offisielle entry-points i boardgame.io:

- `boardgame.io/dist/cjs/core.js` til `boardgame.io/core` i `src/Game.js`
- `boardgame.io/dist/cjs/react.js` til `boardgame.io/react` i `src/App.js`
- `boardgame.io/dist/cjs/multiplayer.js` til `boardgame.io/multiplayer`
  i `src/App.js`
- `boardgame.io/dist/cjs/client.js` til `boardgame.io/client` i `src/App.js`
- `boardgame.io/dist/cjs/server.js` til `boardgame.io/server`
  i `src/server.mjs`

**Hvorfor det er pent:**

- Slipper å peke inn i pakkens interne mappestruktur. Hvis biblioteket
  flytter `core.js` til en annen sti i en patch-versjon, brekker
  dypstien vår.
- Matcher pakkens dokumenterte API.
- Mindre støy i imports.

**Hvorfor det er blokkert:**

`boardgame.io/server`, `boardgame.io/core` osv. er proxy-mapper under
`node_modules/boardgame.io/`. Hver har en `package.json` som peker
`"main"` til den faktiske CJS-filen:

```json
// node_modules/boardgame.io/server/package.json
{ "main": "../dist/cjs/server.js" }
```

Dette fungerer for **Vite** (resolver `main`-feltet automatisk), men
**ikke for Node ESM** med vår `"type": "module"`. Node ESM krever enten
fully-specified paths (`.js`) eller en `exports`-felt i package.json,
og boardgame.io sine proxy-mapper har ingen av delene.

Konsekvensen:

- **App.js**: kan trygt byttes til ren variant (kjører bare i Vite).
- **server.mjs**: må beholde `dist/cjs/server.js` (kjører i Node ESM).
- **Game.js**: importeres av både App.js (Vite) og server.mjs (Node ESM),
  så må også beholde `dist/cjs/core.js` for å fungere i begge.

Bare App.js kan ryddes opp uten å brekke noe. Det betyr inkonsistens i
kodebasen (noen filer bruker rene paths, andre dypstier).

**Mulige veier videre:**

- Drop `"type": "module"` i package.json. Brekker ESM-syntaks i
  `src/server.mjs`, så filen må skrives om til CommonJS.
- Vent til boardgame.io legger til `exports`-felt i en fremtidig
  versjon.
- Rydd partielt og lev med inkonsistens.

Anbefaling: la det stå inntil videre. Rent estetisk problem.

## Backlog (lavere prioritet, ta etter hvert)

- TypeScript-rewrite (kun ved en større refaktor i fremtiden).
- Persistens av matcher (databaseintegrasjon med boardgame.io
  DB-adapter).
- AI-motspiller (det finnes allerede en stub i `Game.js` under
  `ai.enumerate`).
- Lyd-effekter for trekk og våpen.
- Animasjon når et våpen utløses.
- Spectator-modus.
- Legg til Tactical Nuke, et spesialvåpen som helt ødelegger en gitt
  celle på brettet? (Dvs. man kan ikke bruke den cellen resten av
  spillet.)
- Legg til noe som knytter brettet visuelt til navnet på territoriene?
- Gjør det mulig å recycle når man får et MWD man ikke vil ha.
