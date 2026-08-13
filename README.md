# Tic Tac Total Annihilation

Et post-apokalyptisk 4x4 tic-tac-toe-spill der to fraksjoner (Mexican
Queendom og Pan-Canadia Inuit Alliance) kjemper om territorier i USAs
ruiner, med strategiske våpen som låses opp via ressursen Rareium.

Bygget på [boardgame.io](https://boardgame.io/) med React frontend og en
egen multiplayer-server.

## Kjøre lokalt

Krever **Node 22 eller nyere**. Kravet kommer fra utviklingsverktøyene
(`concurrently` 10 og Vite 7), ikke fra serveren, så det er ikke satt som
`engines` i package.json. CI og Netlify er pinnet til Node 22.

```sh
npm install
npm run dev     # starter backend (port 8000) og frontend (port 3000) samtidig
```

Hvis du vil ha dem i hver sin terminal i stedet:

```sh
npm run serve    # backend på port 8000
npm run client   # frontend på port 3000
```

Andre nyttige kommandoer: `npm run build` (prod-bygg av frontend),
`npm run preview` (kjør prod-bygget lokalt), `npm test`
(Vitest), `npm run lint` (ESLint).

## Tester

- `Game.test.js` dekker spillreglene. Ren logikk, kjører i node-miljø.
- `Board.component.test.jsx` dekker interaksjonslogikken i brettet, altså
  målvalget for strategiske våpen og recycle-bekreftelsen. Kjører i jsdom via
  en `@vitest-environment`-docblock øverst i fila. Her er `moves` mocket, så
  testene sier hva brettet ber serveren om, ikke hva serveren gjør med det.
- `App.smoke.test.jsx` importerer bare `App.jsx` og sjekker at det går. Filen
  setter opp boardgame.io-klienten på modulnivå, så en ødelagt import slår ut
  her i stedet for i nettleseren.

Presentasjon og layout er bevisst ikke testet. GitHub Actions kjører lint,
tester og build på hver push og PR, se `.github/workflows/ci.yml`.

## Deploy

- Frontend: Vercel (planlegges flyttet til Netlify, se PLAN.md Fase 2)
- Backend: Render

Frontend leser backend-URL fra `VITE_BACKEND_URL`. Sett denne i
hosting-plattformens env-vars.

## Avhengigheter og sikkerhet

`boardgame.io` 0.50.2 låser flere transitive pakker på gamle, sårbare
versjoner. Vi løser dette med `overrides` i `package.json` i stedet for å bytte
ut selve rammeverket:

- `socket.io` / `socket.io-parser` / `ws`: `koa-socket-2` drar med seg
  `socket.io@3.1.2` med utdatert `engine.io`, `ws` og `cookie`. Vi tvinger
  `socket.io@4`, som `boardgame.io` uansett bruker for klienten. Verifisert med
  en manuell røyktest (opprett match, join, socket-sync).
- `@koa/cors@5`: fjerner varselet om for åpen origin-policy. `boardgame.io`
  setter uansett `origin` eksplisitt, så oppførselen er uendret.
- `cookie@0.7` under `react-cookies`.

`svelte@3` (via `boardgame.io`) har åpne varsler vi bevisst lar stå: de gjelder
XSS ved server-side rendering, og Svelte-koden brukes kun av boardgame.io sitt
debug-panel, som er slått av (`debug: false` i `src/App.jsx`). Å tvinge
`svelte@5` vil bryte den forhåndskompilerte koden.

### Hvorfor App.jsx importerer fra `boardgame.io/dist/esm/`

`App.jsx` importerer `Client`, `SocketIO` og `LobbyClient` fra ESM-byggene,
ikke CJS. Det er et bevisst valg, ikke en tilfeldighet: rolldown, som Vite 8
bygger på, klarer ikke å tree-shake bort det Svelte-baserte debug-panelet fra
CJS-byggene. Med CJS vokser produksjonsbundelen med rundt 80 kB død kode,
selv med `debug: false`.

`Game.js` importerer fortsatt `dist/cjs/core.js`, og må gjøre det, fordi
`server.mjs` laster den i Node. ESM-filene i boardgame.io har `.js`-endelse
uten at pakken er merket som ESM, så Node tolker dem som CommonJS.

`App.smoke.test.jsx` finnes for å fange det hvis noen bytter tilbake:
`App.jsx` kaller alle tre importene på modulnivå, så testen feiler med én gang
en import ikke løser seg.

## Status og videre arbeid

Se [PLAN.md](PLAN.md) for prosjektets utviklingsplan og pågående
forbedringer.
