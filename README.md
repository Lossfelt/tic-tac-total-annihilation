# Tic Tac Total Annihilation

Et post-apokalyptisk 4x4 tic-tac-toe-spill der to fraksjoner (Mexican
Queendom og Pan-Canadia Inuit Alliance) kjemper om territorier i USAs
ruiner, med strategiske våpen som låses opp via ressursen Rareium.

Bygget på [boardgame.io](https://boardgame.io/) med React frontend og en
egen multiplayer-server.

## Kjøre lokalt

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
debug-panel, som er slått av (`debug: false` i `src/App.js`). Å tvinge
`svelte@5` vil bryte den forhåndskompilerte koden.

## Status og videre arbeid

Se [PLAN.md](PLAN.md) for prosjektets utviklingsplan og pågående
forbedringer.
