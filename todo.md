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

**Oppdatering 13. august 2026: delvis avvist, ikke bare utsatt.**

Konklusjonen over var at `App.js` trygt kunne ryddes til ren variant siden den
bare kjører i Vite. Det stemmer ikke lenger. `App.jsx` importerer nå bevisst
`boardgame.io/dist/esm/...`, fordi rolldown i Vite 8 ikke klarer å tree-shake
bort det Svelte-baserte debug-panelet fra CJS-byggene. Med CJS vokser
produksjonsbundelen med rundt 80 kB.

Proxy-mappene (`boardgame.io/react` osv.) peker `main` til `dist/cjs/`, så å
bytte til dem ville trekke inn CJS igjen og gjøre bundelen større. Den delen av
oppgaven bør altså ikke gjøres, selv om boardgame.io skulle legge til et
`exports`-felt, med mindre det feltet peker på ESM-byggene.

`Game.js` og `server.mjs` er uendret: begge må fortsatt bruke `dist/cjs/`, av
grunnen beskrevet over. Se README under "Avhengigheter og sikkerhet".

## Backlog (lavere prioritet, ta etter hvert)

- TypeScript-rewrite (kun ved en større refaktor i fremtiden).
- Persistens av matcher (databaseintegrasjon med boardgame.io
  DB-adapter).
- AI-motspiller (det finnes allerede en stub i `Game.js` under
  `ai.enumerate`).
- Lyd-effekter for trekk og våpen.
- Animasjon når et våpen utløses.
- Spectator-modus.
- Legg til noe som knytter brettet visuelt til navnet på territoriene?
- Gi de strategiske våpnene ulik sannsynlighet. I dag plukkes ett av
  våpnene med lik sjanse via `random.Die(strategicWeapons.length)` i
  `Game.js`. Vekting bør gjøre kraftigere våpen sjeldnere (f.eks. Dirty
  Nuke sjelden, Artillery vanlig).
