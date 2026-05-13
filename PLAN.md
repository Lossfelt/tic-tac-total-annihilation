# Implementeringsplan: Tic Tac Total Annihilation

## Om prosjektet

Et boardgame.io-basert 4x4 tic-tac-toe spill med temaet post-apokalyptisk USA.
To fraksjoner (Mexican Queendom og Pan-Canadia Inuit Alliance) kjemper om
territorier. Strategiske våpen (Artillery, Air Strike, Biological Warfare)
låses opp via ressursen Rareium.

Spillet heter **Tic Tac Total Annihilation**. Repoet het opprinnelig
`bgio-tutorial` (etter en boardgame.io-tutorial som utgangspunkt) og
endres til `tic-tac-total-annihilation` i Fase 0.

**Stack i dag:**

- Frontend: React 18 + Create React App (`react-scripts`)
- Backend: boardgame.io server med Socket.IO (Node, ESM)
- Hosting: Frontend på Vercel (planlegges flyttet til Netlify), backend på Render
- Lint/format: ESLint + Prettier

**Bevisste valg fra eier:**

- Ingen database / persistens. Server-restart kan resette matcher.
- Ingen TypeScript med mindre det skjer som del av en total re-write.
- Ingen bruk av tankestrek (em-dash) i kodebasen eller dokumenter.

## Slik bruker du planen

1. Eier sier hvilke(t) steg du skal kjøre i denne økten (ett om gangen, eller flere).
2. Når et steg er ferdig, oppdater status-emoji i listen under (`[ ]` til `[x]`).
   Legg evt. til en kort "Notat:"-linje under steget hvis noe avvek fra planen.
3. Ikke gå videre til neste steg uten at eier har bekreftet.
4. Hvis et steg blir utdatert eller endrer seg, oppdater beskrivelsen i denne filen.
5. Etter hver økt: commit endringene i koden OG i denne filen.

Status-symboler:

- `[ ]` = ikke startet
- `[~]` = pågår
- `[x]` = ferdig
- `[!]` = blokkert eller hoppet over (legg til notat)

## Rekkefølge og begrunnelse

0. **Repo-rename** først, lavrisiko, ryddig fundament.
1. **Kode-rydding** så fremtidige endringer er lettere å gjøre.
2. **Vite + Netlify-migrering** samlet, fordi begge endrer hosting-config og
   det gir mening å gjøre deploy-flyttingen i samme operasjon. CRA er
   deprecated, og brukeren har resten av prosjektene på Netlify.
3. **Tester** før refaktor, så vi har et sikkerhetsnett mot regresjoner i
   spillogikken.
4. **Refaktor** av kodelukter mens vi har tester.
5. **Visuelt løft** når koden er ren.
6. **Hosting-polish og sikkerhet** til slutt: CORS-lås og match-ID-lengde.

**Deploy-verifisering** er implisitt etter hver fase som rører prod (Fase 0,
2 og 6). Test alltid full multiplayer-flyt mot live-versjon før fasen
markeres ferdig.

---

## Fase 0: Repo-rename

### [x] 0.1 Endre repo-navnet på GitHub

- Gå til repo Settings og endre navn fra `bgio-tutorial` til
  `tic-tac-total-annihilation`.
- GitHub setter automatisk opp redirect fra gammel URL.

### [x] 0.2 Oppdater lokal git remote

I hovedmappa lokalt (ikke i worktree):

```sh
git remote set-url origin https://github.com/<user>/tic-tac-total-annihilation.git
```

Verifiser med `git remote -v` og `git fetch`.

### [x] 0.3 Oppdater package.json

I `package.json`, endre `"name": "bgio-tutorial"` til
`"name": "tic-tac-total-annihilation"`.

Notat: Oppdaterte også `name`-felt i `package-lock.json` (2 steder) for konsistens.

### [ ] 0.4 Verifiser Vercel- og Render-deploys etter rename

- Vercel: trigger en redeploy og bekreft at GitHub-koblingen følger automatisk.
- Render: samme verifisering.
- Begge plattformer bruker repo-ID, ikke navn, så det skal bare fungere,
  men sjekk for sikkerhets skyld.
- Hvis project-navnene i Vercel/Render fortsatt sier `bgio-tutorial` er det
  bare kosmetisk, kan endres manuelt i deres dashboards hvis ønsket.

### [ ] 0.5 Sjekk worktree etter rename

Hvis hovedmappa lokalt også omdøpes (`bgio-tutorial/` til
`tic-tac-total-annihilation/`), kjør `git worktree list` og verifiser at
eventuelle aktive worktrees fortsatt fungerer. Reparér med
`git worktree repair` hvis nødvendig.

## Fase 1: Kode-rydding

### [ ] 1.1 Døp om App2.js til App.js

- Endre filnavn `src/App2.js` til `src/App.js`.
- Oppdater importen i `src/index.js`.
- Verifiser at `npm start` fortsatt fungerer.

### [ ] 1.2 Rydd opp i boardgame.io-imports

Erstatt CJS-stier med offisielle entry points:

- `boardgame.io/dist/cjs/core.js` til `boardgame.io/core` i `src/Game.js`
- `boardgame.io/dist/cjs/react.js` til `boardgame.io/react` i `src/App.js`
- `boardgame.io/dist/cjs/multiplayer.js` til `boardgame.io/multiplayer`
  i `src/App.js`
- `boardgame.io/dist/cjs/client.js` til `boardgame.io/client` i `src/App.js`
- `boardgame.io/dist/cjs/server.js` til `boardgame.io/server`
  i `src/server.mjs`

Verifiser at både klient og server starter uten feil etter endring.

### [ ] 1.3 Oppdater README

- Skriv en kort README som beskriver:
  - Hva spillet er (1 til 2 setninger), inkludert nytt navn
    "Tic Tac Total Annihilation"
  - Hvordan kjøre lokalt (`npm install`, `npm start`, `npm run serve`)
  - Hvordan deploye (Netlify for frontend etter Fase 2, Render for backend)
  - Lenke til live-versjon hvis relevant

## Fase 2: Migrering til Vite + Netlify

Disse to henger sammen fordi Vite endrer build-output og env-var-prefix,
og vi vil bare oppdatere hosting-config én gang. Frontend flyttes fra
Vercel til Netlify samtidig.

### [ ] 2.1 Sett opp Vite-prosjekt parallelt

- Installer Vite og `@vitejs/plugin-react`.
- Lag `vite.config.js` med React-plugin og evt. dev-proxy mot
  `localhost:8000`.
- Lag ny `index.html` i prosjektroten (eller flytt fra `public/`).
- Erstatt `process.env.REACT_APP_BACKEND_URL` med `import.meta.env.VITE_BACKEND_URL`.
  Husk å oppdatere både `src/App.js` og evt. andre steder.
- Erstatt `process.env.PUBLIC_URL` med tom string eller bruk `/` direkte
  (Vite serverer `public/` som rot).

### [ ] 2.2 Oppdater package.json

- Endre scripts:
  - `start` til `vite`
  - `build` til `vite build`
  - `preview` til `vite preview` (ny)
- Fjern `react-scripts` fra dependencies.
- Fjern eslintConfig (`react-app`) og evt. browserslist-felt som ikke trengs lenger.
- Behold `nodemon` og `eslint`/`prettier`-oppsettet.

### [ ] 2.3 Test og verifiser

- Kjør `npm run build` og `npm run preview`. Sjekk at multiplayer fungerer
  mot lokal server.
- Sjekk at favicon, bilder under `public/` og manifest fortsatt lastes.

### [ ] 2.4 Migrer frontend fra Vercel til Netlify

- Opprett ny Netlify-site og koble til GitHub-repoet.
- Sett byggeinnstillinger:
  - Build command: `vite build` (eller la Netlify autodetektere)
  - Publish directory: `dist`
- Sett env-variabel `VITE_BACKEND_URL` til Render-backend-URL.
- Verifiser at Netlify-deploy fungerer mot Render.
- Hvis du har et custom domene på Vercel: flytt DNS til Netlify når
  Netlify-versjonen er bekreftet å fungere.
- Slett (eller "pause") Vercel-prosjektet etter at Netlify er bekreftet
  stabil i noen dager.

## Fase 3: Tester

### [ ] 3.1 Sett opp Vitest

- Installer `vitest` og evt. `@testing-library/react` hvis du vil teste
  komponenter senere.
- Legg til `"test": "vitest"` i package.json scripts.

### [ ] 3.2 Skriv tester for ren spillogikk

Test funksjonene i `src/Game.js`:

- `IsVictory`: alle vinnende rader, kolonner, diagonaler, samt ingen vinner.
- `IsRow`: gyldige horisontale, vertikale, diagonale tre på rad. Ugyldige
  kombinasjoner. Feil lengde input.
- `GetNeighbors`: hjørne, kant, midtcelle.
- `GetSurroundingCells`: hjørne, kant, midtcelle (forventet 4, 6 eller 9 celler).

Disse er rene funksjoner uten state, ideelt utgangspunkt.

Merk: Dette krever at du eksporterer hjelpefunksjonene fra `Game.js`.

## Fase 4: Refaktor

### [ ] 4.1 Trekk ut konstanter

I `src/Game.js`, opprett navngitte konstanter øverst:

- `BOARD_SIZE = 4`
- `TOTAL_CELLS = 16`
- `REVOLT_CHANCE = 0.05`
- `INVASION_SUCCESS_CHANCE = 0.2`
- `BIO_DESTROY_CHANCE = 0.5`
- `RAREIUM_WEAPON_CHANCE_DIVISOR = 100`

Bruk dem i stedet for magic numbers.

### [ ] 4.2 Fjern duplikat blink-state i Board.js

- Fjern `useState(G.blink)`, `useEffect`, `deepEqual` og `previousGRef`.
- Les `G.blink[id]` direkte i render. boardgame.io rerendrer ved state-endring uansett.
- Behold `onAnimationEnd`-callback bare hvis det faktisk trengs (vurder å la
  CSS-animasjonen kjøre seg ferdig basert kun på G.blink-flagget).

### [ ] 4.3 Kollaps spesialvåpen-handlere

I `src/Board.js`, erstatt de tre nesten identiske `useEffect`-blokkene med
en konfig:

```js
const WEAPON_TARGET_COUNT = {
  'Air Strike': 3,
  Artillery: 1,
  'Biological Warfare': 1,
};
```

Og en useEffect som leser fra denne tabellen.

### [ ] 4.4 Rename MWD til strategicWeapon

- I `src/Game.js`: `G.MWD` til `G.strategicWeapon`, move `MWD` til
  `useStrategicWeapon`.
- Oppdater alle referanser i `src/Board.js`.
- Behold `strategic_weapons`-arrayen, men gi den camelCase: `strategicWeapons`.

### [ ] 4.5 Server slår opp spillernavn

I dag sender klienten `matchData` som move-argument, så klienten kan lyve.

- Fjern `matchData` fra move-argumentene i `clickCell` og `useStrategicWeapon`.
- Bruk `ctx.playerID` til å slå opp navn server-side via boardgame.io sin
  innebygde `players`-context, eller lagre navn i `G.playerNames` ved første
  trekk fra hver spiller (utledet fra match join).

Hvis dette viser seg å være tungt, kan vi nøye oss med å dokumentere det
som kjent svakhet og hoppe over.

### [ ] 4.6 Kommentar-rydd

Fjern kommentarer som beskriver hva neste linje gjør (eks. `// Lokal state for å lagre G.blink`).
Behold kommentarer som forklarer hvorfor noe er gjort på en uventet måte.

## Fase 5: Visuelt løft

### [ ] 5.1 Tematisk palett og fonter

- Definer CSS-variabler (`--color-bg`, `--color-rust`, `--color-sand`,
  `--color-military-green`, `--color-text`) i `Board.css` eller en ny
  `theme.css`.
- Bruk en post-apokalyptisk palett, mørk bakgrunn.
- Importer en passende Google Font (forslag: Special Elite for overskrifter,
  Inter eller IBM Plex Sans for body).
- Sett font og bakgrunn globalt.

### [ ] 5.2 Vis territorienavn på brettet

- Vis territorienavnet under eller over hver celle, eller som tooltip ved
  hover.
- Gjør at `territories`-arrayen i `Game.js` deles med Board.js (flytt til
  egen modul `src/territories.js` eller eksporter fra Game.js).

### [ ] 5.3 Bedre cellefeedback

- Hover-effekt på ledige celler.
- Tydeligere `selected`-tilstand for spesialvåpen-mål (glød/pulserende
  ramme i fraksjonsfarge i stedet for `2px solid red`).
- Vis hvilken fraksjon som eier en celle med en bakgrunnsfarge i tillegg
  til ikonet.

### [ ] 5.4 Strategisk våpen-UI

- Bruk ikon eller emoji per våpen i stedet for kun tekst.
- Tooltip eller liten boks som forklarer hva våpenet gjør.
- Når aktivt: vis instruksjon ("Velg 1 målcelle" / "Velg 3 celler på rad").
- Vis antall valgte mål så langt (eks. "1 / 3 valgt").

### [ ] 5.5 Rareium som progress bar

- Erstatt `Rareium: {n}` tekstvisning med en progress bar fra 0 til 100.
- Tooltip eller liten tekst som forklarer at Rareium er sjansen for våpen
  ved tur-start.

### [ ] 5.6 Forbedret game log

- Fast høyde med scroll på loggen.
- Litt mindre skriftstørrelse.
- Vurder ikoner per hendelsestype (sverd for invasjon, flagg for
  erobring, knyttneve for opprør, eksplosjon for våpen).
- Subtil fade-in animasjon for nye loggoppføringer.

### [ ] 5.7 Lobby-skjerm

- Bakgrunnsbilde eller flagg fra begge fraksjoner.
- Bedre styling på input-felter og knapper.
- Liten tekst som forklarer at match-ID deles med motspiller.

### [ ] 5.8 Responsivitet

- Erstatt `10vh` celle-størrelse med `clamp(60px, 10vmin, 120px)` eller
  tilsvarende.
- Sjekk at brettet ikke blir kuttet i landskapsmodus på mobil.
- Sjekk at popupen er lesbar på små skjermer.

## Fase 6: Hosting og sikkerhet

### [ ] 6.1 Match-ID-kollisjoner

I `src/server.mjs`: 4-sifret ID gir bare 9000 mulige verdier og ingen
kollisjonsjekk. Endre til 6-sifret, eller bruk nanoid med en alfa-numerisk
shortform (f.eks. `nanoid(6)`).

### [ ] 6.2 Lås CORS til frontend-domenet

I `src/server.mjs`, konfigurer cors slik:

```js
server.app.middleware.unshift(
  cors({ origin: process.env.FRONTEND_URL || '*' }),
);
```

Sett `FRONTEND_URL` på Render til Netlify-URL-en.

### [ ] 6.3 Verifiser env-vars og deploys

- Netlify: `VITE_BACKEND_URL` peker på Render-URL.
- Render: `FRONTEND_URL` peker på Netlify-URL.
- Test full multiplayer-flyt mot prod en siste gang.

## Backlog (lavere prioritet, ta etter hvert)

- TypeScript-rewrite (kun ved en større refaktor i fremtiden).
- Persistens av matcher (databaseintegrasjon med boardgame.io DB-adapter).
- AI-motspiller (det finnes allerede en stub i `Game.js` under `ai.enumerate`).
- Lyd-effekter for trekk og våpen.
- Animasjon når et våpen utløses.
- Spectator-modus.
