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
