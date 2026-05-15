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

### [x] 0.4 Verifiser Vercel- og Render-deploys etter rename

- Vercel: trigger en redeploy og bekreft at GitHub-koblingen følger automatisk.
- Render: samme verifisering.
- Begge plattformer bruker repo-ID, ikke navn, så det skal bare fungere,
  men sjekk for sikkerhets skyld.
- Hvis project-navnene i Vercel/Render fortsatt sier `bgio-tutorial` er det
  bare kosmetisk, kan endres manuelt i deres dashboards hvis ønsket.

### [x] 0.5 Sjekk worktree etter rename

Hvis hovedmappa lokalt også omdøpes (`bgio-tutorial/` til
`tic-tac-total-annihilation/`), kjør `git worktree list` og verifiser at
eventuelle aktive worktrees fortsatt fungerer. Reparér med
`git worktree repair` hvis nødvendig.

Notat: Lokal mappe ble først ikke omdøpt (Windows nektet pga. låste
filer). Prunable worktree under `.claude/worktrees/` ble fjernet med
`git worktree prune`. Mappa ble senere omdøpt fra `bgio-tutorial/` til
`tic-tac-total-annihilation/`; `git worktree list` viser at hovedworktree
peker korrekt på den nye stien, ingen `git worktree repair` nødvendig.

## Fase 1: Kode-rydding

### [x] 1.1 Døp om App2.js til App.js

- Endre filnavn `src/App2.js` til `src/App.js`.
- Oppdater importen i `src/index.js`.
- Verifiser at `npm start` fortsatt fungerer.

Notat: Brukte `git mv` så historikken bevares.

### [!] 1.2 Rydd opp i boardgame.io-imports

Erstatt CJS-stier med offisielle entry points:

- `boardgame.io/dist/cjs/core.js` til `boardgame.io/core` i `src/Game.js`
- `boardgame.io/dist/cjs/react.js` til `boardgame.io/react` i `src/App.js`
- `boardgame.io/dist/cjs/multiplayer.js` til `boardgame.io/multiplayer`
  i `src/App.js`
- `boardgame.io/dist/cjs/client.js` til `boardgame.io/client` i `src/App.js`
- `boardgame.io/dist/cjs/server.js` til `boardgame.io/server`
  i `src/server.mjs`

Verifiser at både klient og server starter uten feil etter endring.

Notat (blokkert, utsatt til Fase 2): De offisielle entry points er
proxy-directories som kun fungerer med CommonJS dir-resolution. Dagens
setup har `"type": "module"` i `package.json`, som tvinger strict ESM
fully-specified paths både i webpack (CRA) og Node ESM (server.mjs).
Begge feiler med `boardgame.io/core` etc. Vite (Fase 2) håndterer disse
proxy-stiene korrekt, så stegget tas der.

### [x] 1.3 Oppdater README

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

### [x] 2.1 Sett opp Vite-prosjekt parallelt

- Installer Vite og `@vitejs/plugin-react`.
- Lag `vite.config.js` med React-plugin og evt. dev-proxy mot
  `localhost:8000`.
- Lag ny `index.html` i prosjektroten (eller flytt fra `public/`).
- Erstatt `process.env.REACT_APP_BACKEND_URL` med `import.meta.env.VITE_BACKEND_URL`.
  Husk å oppdatere både `src/App.js` og evt. andre steder.
- Erstatt `process.env.PUBLIC_URL` med tom string eller bruk `/` direkte
  (Vite serverer `public/` som rot).

Notat: Lagt opp slik at JSX i `.js`-filer tolkes via `plugin-react`-include
og esbuild-loader (slipper å rename filer). Ingen dev-proxy konfigurert,
fordi `import.meta.env.VITE_BACKEND_URL` og `window.location.hostname`-fallbacken
allerede dekker både dev og prod. `public/index.html` slettet, ny
`index.html` ligger i prosjektrot med `<script type="module" src="/src/index.js">`.
`PUBLIC_URL`-prefiksene i `AboutPopup.js` byttet til rotrelative stier
(`/Mexican_Queendom.jpg` osv.).

### [x] 2.2 Oppdater package.json

- Endre scripts:
  - `start` til `vite`
  - `build` til `vite build`
  - `preview` til `vite preview` (ny)
- Fjern `react-scripts` fra dependencies.
- Fjern eslintConfig (`react-app`) og evt. browserslist-felt som ikke trengs lenger.
- Behold `nodemon` og `eslint`/`prettier`-oppsettet.

Notat: `react-scripts`, `eslintConfig` og `browserslist` fjernet. La
til `vite` og `@vitejs/plugin-react` som devDeps. Beholdt
`@babel/plugin-proposal-private-property-in-object` fordi
`.eslintrc.json` fortsatt extender `react-app` og preset-pipelinen
krever den (transient avhengighet). `@babel/plugin-transform-private-property-in-object`
fjernet (kun arv fra CRA-warning-fix). `.gitignore` utvidet med `/dist`.

### [x] 2.3 Test og verifiser

- Kjør `npm run build` og `npm run preview`. Sjekk at multiplayer fungerer
  mot lokal server.
- Sjekk at favicon, bilder under `public/` og manifest fortsatt lastes.

Notat: `npm install`, `npm run build`, `npm run preview` og `npm run dev`
kjører rent (sistnevnte starter både backend og frontend via
`concurrently`). Preview serverer `index.html`, `/favicon.png`,
`/manifest.json` og fraksjonsbildene med status 200. `npm run lint`
passerer. Full multiplayer-flyt og About-popup verifisert manuelt i
nettleser av eier. Scripts senere ryddet til Vite-konvensjon:
`dev` (kombinert), `client` (kun frontend), `serve` (kun backend);
gammel `start` fjernet.

### [~] 2.4 Migrer frontend fra Vercel til Netlify

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

Notat: `netlify.toml` lagt til med `command = "npm run build"`,
`publish = "dist"` og en SPA-fallback-redirect (`/* -> /index.html 200`).
**Parkert til etter omskrivningen** (eiers ønske): vi committer endringene
lokalt men holder igjen `git push` til hele omskrivningen er ferdig. Først
da settes Netlify opp manuelt (opprette site, koble GitHub, sette
`VITE_BACKEND_URL`-env til samme backend-URL som ligger i Vercel i dag,
verifisere deploy, evt. DNS-flytt, pause/slette Vercel). Frem til push
kjører Vercel uforstyrret på gammel CRA-versjon fra `origin/main`.

## Fase 3: Tester

### [x] 3.1 Sett opp Vitest

- Installer `vitest` og evt. `@testing-library/react` hvis du vil teste
  komponenter senere.
- Legg til `"test": "vitest"` i package.json scripts.

Notat: `vitest@^3` installert (ikke v4, fordi v4 drar inn Vite 8 internt
og gir deprecation-warnings mot esbuild-konfigen vår i `vite.config.js`).
`@testing-library/react` ikke installert enda - vente til vi faktisk skal
teste komponenter. `"test": "vitest"` lagt til i scripts.

### [x] 3.2 Skriv tester for ren spillogikk

Test funksjonene i `src/Game.js`:

- `IsVictory`: alle vinnende rader, kolonner, diagonaler, samt ingen vinner.
- `IsRow`: gyldige horisontale, vertikale, diagonale tre på rad. Ugyldige
  kombinasjoner. Feil lengde input.
- `GetNeighbors`: hjørne, kant, midtcelle.
- `GetSurroundingCells`: hjørne, kant, midtcelle (forventet 4, 6 eller 9 celler).

Disse er rene funksjoner uten state, ideelt utgangspunkt.

Merk: Dette krever at du eksporterer hjelpefunksjonene fra `Game.js`.

Notat: 70 tester i `src/Game.test.js`, alle passerer. Funksjonene
`IsVictory`, `IsRow`, `GetNeighbors`, `GetSurroundingCells` eksportert
fra `Game.js`. Bruker `it.each` for å holde testene kompakte. Dekker
alle vinnerlinjer (4 horisontale + 4 vertikale + 2 diagonale), partial
rows, blandede spillere, usortert input til `IsRow`, og alle posisjons-
kategorier (hjørner, kanter, midtceller) for nabofunksjonene.

## Fase 4: Refaktor

### [x] 4.1 Trekk ut konstanter

I `src/Game.js`, opprett navngitte konstanter øverst:

- `BOARD_SIZE = 4`
- `TOTAL_CELLS = 16`
- `REVOLT_CHANCE = 0.05`
- `INVASION_SUCCESS_CHANCE = 0.2`
- `BIO_DESTROY_CHANCE = 0.5`
- `RAREIUM_WEAPON_CHANCE_DIVISOR = 100`

Bruk dem i stedet for magic numbers.

Notat: Alle konstanter eksportert. La også til `NUM_PLAYERS = 2` for
`Array(NUM_PLAYERS).fill(...)` og `minPlayers`/`maxPlayers`. `IsRow`
bruker nå `BOARD_SIZE` i alle aritmetiske uttrykk (`BOARD_SIZE + 1`,
`BOARD_SIZE - 1`) slik at koden tåler endring av brettstørrelse.

### [x] 4.2 Fjern duplikat blink-state i Board.js

- Fjern `useState(G.blink)`, `useEffect`, `deepEqual` og `previousGRef`.
- Les `G.blink[id]` direkte i render. boardgame.io rerendrer ved state-endring uansett.
- Behold `onAnimationEnd`-callback bare hvis det faktisk trengs (vurder å la
  CSS-animasjonen kjøre seg ferdig basert kun på G.blink-flagget).

Notat: Hele blink-mirror-laget fjernet. Render leser `G.blink[id]`
direkte. `onAnimationEnd` og `handleAnimationEnd` fjernet.

Etter første runde med manuell testing oppdaget eier en
re-trigger-bug: en celle som nettopp hadde blinket, blinket ikke ved
neste hendelse (claim/invasjon/opprør) fordi React batchet
`G.blink[id]` false→true i samme commit, DOM beholdt klassen `.blink`,
og CSS-animasjonen var allerede ferdig (én iterasjon, ingen restart).
Fikset ved å legge til `G.blinkVersion` (monotonisk counter,
inkrementeres i `clickCell`, `useStrategicWeapon`, og i `onEnd` ved
opprør). Board.js inkluderer denne i React `key` for blinkende celler
(`cell-${id}-blink-${blinkVersion}`), som tvinger remount og restarter
animasjonen.

Samtidig forsterket `.blink`-animasjonen i `Board.css` for bedre
synlighet ved opprør (og generelt): legger til skalering (1.05x),
oransje bakgrunnsfarge-puls og box-shadow-glow, to iterasjoner à 0.45s.

### [x] 4.3 Kollaps spesialvåpen-handlere

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

Notat: Implementert. Én `useEffect` leser `WEAPON_TARGET_COUNT` og kaller
`moves.useStrategicWeapon` når riktig antall mål er valgt. Air Strike får
hele arrayen som argument, de andre får første element (server forventer
ulik signatur per våpen).

### [x] 4.4 Rename MWD til strategicWeapon

- I `src/Game.js`: `G.MWD` til `G.strategicWeapon`, move `MWD` til
  `useStrategicWeapon`.
- Oppdater alle referanser i `src/Board.js`.
- Behold `strategic_weapons`-arrayen, men gi den camelCase: `strategicWeapons`.

Notat: Gjort. Alle tre rename gjennomført konsistent.

### [x] 4.5 Server slår opp spillernavn

I dag sender klienten `matchData` som move-argument, så klienten kan lyve.

- Fjern `matchData` fra move-argumentene i `clickCell` og `useStrategicWeapon`.
- Bruk `ctx.playerID` til å slå opp navn server-side via boardgame.io sin
  innebygde `players`-context, eller lagre navn i `G.playerNames` ved første
  trekk fra hver spiller (utledet fra match join).

Hvis dette viser seg å være tungt, kan vi nøye oss med å dokumentere det
som kjent svakhet og hoppe over.

Notat: Løst ved placeholder-tokens i stedet for klient-sendt navneliste:

- Moves tar ikke lenger imot `matchData`. Server skriver `__P0__` / `__P1__`
  i loggoppføringer.
- Ny eksport `formatLogEntry(entry, matchData)` i Game.js substituerer
  tokens med navn fra `matchData` (som boardgame.io selv synker fra
  server-side metadata satt ved `lobbyClient.joinMatch`).
- Board.js render kjører hver loggoppføring gjennom `formatLogEntry`.
- Resultat: serveren stoler aldri på klient-sendt navneliste, og spoofing
  via move-argumenter er ikke lenger mulig. Fallback til "Player N" hvis
  matchData mangler/uventet shape.
- 5 nye tester for `formatLogEntry` i `Game.test.js`.
  **Bør testes manuelt:** at navn vises korrekt i loggen for begge spillere,
  inkludert opprør-meldinger (som ikke inneholder placeholder).

### [x] 4.6 Kommentar-rydd

Fjern kommentarer som beskriver hva neste linje gjør (eks. `// Lokal state for å lagre G.blink`).
Behold kommentarer som forklarer hvorfor noe er gjort på en uventet måte.

Notat: Gjort underveis i 4.1-4.5. Fjernet WHAT-kommentarer som
"Lokal state for å lagre G.blink", "Funksjon for å håndtere ...",
"Destroy targeted cells" osv. Beholdt WHY-kommentarer (f.eks. om Air
Strike-validering, placeholder-token-strategien) og strukturmarkører i
`positions`-arrayen.

## Fase 5: Visuelt løft

Valgt stilretning: **Brutalist post-apocalypse** (mørk varm bakgrunn,
sand-tekst, rust og militærgrønn som aksenter, stencil-headings).

### [x] 5.1 Tematisk palett og fonter

- Definer CSS-variabler (`--color-bg`, `--color-rust`, `--color-sand`,
  `--color-military-green`, `--color-text`) i `Board.css` eller en ny
  `theme.css`.
- Bruk en post-apokalyptisk palett, mørk bakgrunn.
- Importer en passende Google Font (forslag: Special Elite for overskrifter,
  Inter eller IBM Plex Sans for body).
- Sett font og bakgrunn globalt.

Notat: `src/theme.css` lagt til med full variabel-palett (bg, sand, rust,
militærgrønn, fraksjonsfarger, danger, borders), font-stack (Special
Elite for headings, IBM Plex Sans for body, IBM Plex Mono for tall/ID),
globale resets, samt grunnstil for `button` og `input`. Google Fonts
preconnect og link lagt til i `index.html`. `theme.css` importeres
øverst i `src/index.js`. CSS-variabel `--cell-size: clamp(60px, 12vmin, 110px)`
brukes som basis for responsivitet.

### [x] 5.2 Vis territorienavn på brettet

- Vis territorienavnet under eller over hver celle, eller som tooltip ved
  hover.
- Gjør at `territories`-arrayen i `Game.js` deles med Board.js (flytt til
  egen modul `src/territories.js` eller eksporter fra Game.js).

Notat: `territories` eksportert fra `Game.js`. Hver celle har
`title={territories[id]}` for native browser-tooltip ved hover, som er
det reneste med tanke på visuell støy på et tett 4x4-brett.

### [x] 5.3 Bedre cellefeedback

- Hover-effekt på ledige celler.
- Tydeligere `selected`-tilstand for spesialvåpen-mål (glød/pulserende
  ramme i fraksjonsfarge i stedet for `2px solid red`).
- Vis hvilken fraksjon som eier en celle med en bakgrunnsfarge i tillegg
  til ikonet.

Notat: Hover på ledige celler gir rust-tonet bakgrunn og rust-farget
border. `.selected` har nå box-shadow-glow + pulserende `target-pulse`-
animasjon i rust-tonen. Eide celler har subtil tint-bakgrunn
(`--color-queendom-tint` / `--color-canadia-tint`) i tillegg til ikonet.

### [x] 5.4 Strategisk våpen-UI

- Bruk ikon eller emoji per våpen i stedet for kun tekst.
- Tooltip eller liten boks som forklarer hva våpenet gjør.
- Når aktivt: vis instruksjon ("Velg 1 målcelle" / "Velg 3 celler på rad").
- Vis antall valgte mål så langt (eks. "1 / 3 valgt").

Notat: `WEAPON_META`-tabell i Board.js kobler hvert våpen til emoji
(💥 Artillery, ✈️ Air Strike, ☣️ Biological Warfare), beskrivelse
(`title`-tooltip på knappen) og instruksjon. Aktiv knapp får
`.weapon-button.active`-style. Instruksjonsboks under knappen viser
"Select X target(s)" og "N / X selected"-teller.

### [x] 5.5 Rareium som progress bar

- Erstatt `Rareium: {n}` tekstvisning med en progress bar fra 0 til 100.
- Tooltip eller liten tekst som forklarer at Rareium er sjansen for våpen
  ved tur-start.

Notat: Progress bar med gradient (militærgrønn → rust) over mørk
bakgrunn. Tooltip på containeren forklarer at Rareium er prosent-sjansen
for å få våpen ved tur-start. Visningen capper på 100% (Math.min)
selv om underliggende verdi kan gå høyere.

### [x] 5.6 Forbedret game log

- Fast høyde med scroll på loggen.
- Litt mindre skriftstørrelse.
- Vurder ikoner per hendelsestype (sverd for invasjon, flagg for
  erobring, knyttneve for opprør, eksplosjon for våpen).
- Subtil fade-in animasjon for nye loggoppføringer.

Notat: `max-height: 180px` med overflow-scroll og custom scrollbar.
Skriftstørrelse 0.85rem. Ikoner via `logIcon()`-keyword-matching:
⚔️ conquers, 🚩 claims, ✊ revolt, 💥 Artillery, ✈️ Air Strike,
☣️ Biological Weapon, 🛡️ failed invasion. `@keyframes log-fade-in`
gir 0.35s slide-in fra venstre.

### [x] 5.7 Lobby-skjerm

- Bakgrunnsbilde eller flagg fra begge fraksjoner.
- Bedre styling på input-felter og knapper.
- Liten tekst som forklarer at match-ID deles med motspiller.

Notat: Ny lobby-struktur i App.js med `.lobby`-wrapper, faction-cards
ved siden av hverandre som viser Mexican Queendom og Pan-Canadia,
tematisk-styled `lobby-form` / `lobby-actions` med radial gradient i
bakgrunnen, og forklarende hint om match-ID-deling. About-knappen
ble flyttet til samme posisjon men fikk konsistent stil.

### [x] 5.8 Responsivitet

- Erstatt `10vh` celle-størrelse med `clamp(60px, 10vmin, 120px)` eller
  tilsvarende.
- Sjekk at brettet ikke blir kuttet i landskapsmodus på mobil.
- Sjekk at popupen er lesbar på små skjermer.

Notat: `--cell-size: clamp(60px, 12vmin, 110px)` globalt. Media queries
for `max-width: 480px` (mindre celler, smal våpenknapp, kortere
loggvindu) og `orientation: landscape and max-height: 520px` (enda
mindre celler, mer kompakt layout). About-popup bruker `width: min(90%, 640px)`
og `max-height: 90vh` med scroll for lesbarhet på små skjermer.

## Tillegg etter Fase 5 (utenfor opprinnelig plan)

### [x] Stil-justeringer nærmere mockup

Etter at eier delte en ChatGPT-generert mockup (mørkt grunge-brett med
sprukne stenfliser og "ANNIHILATION" i ildgul-oransje), gjorde vi seks
CSS-bare justeringer for å treffe nærmere:

1. Heading-font byttet fra Special Elite (typewriter) til Black Ops One
   (bold militær display). Special Elite beholdt som `--font-stencil`
   for evt. senere bruk.
2. Lobby-tittelen splittet: "Tic Tac Total" (sand) + "Annihilation"
   (rust-oransje med glow).
3. Rust-palett justert mot ildgul: `--color-rust` `#c75d3a` → `#dd6a35`,
   `--color-rust-bright` `#e07a4f` → `#f5934d`.
4. Paneler (brett, våpenknapp, log, lobby-paneler, faction-cards) fikk
   gradient (elevated → deep), inset highlight på toppen og dypere drop
   shadows.
5. Subtil grunge-overlay via inline SVG `feTurbulence`-noise på body,
   `opacity: 0.07`, `mix-blend-mode: overlay`.
6. Brettet ble innfelt med inset shadow (`inset 0 6px 14px rgba(0,0,0,0.75)`),
   cellene fikk topp-highlight og gradient så de føles fysiske.

### [x] About-popup forbedret

- Lukkes ved Escape-tasten og klikk på backdrop, ikke bare "Close"-knappen.
- X-ikon i øvre høyre hjørne i stedet for "Close"-tekst.
- Backdrop får mørk radial gradient og fade-in.
- Innholdet restrukturert i `<section>`-blokker. Fraksjons-flaggene er
  egne `.faction-flag`-bilder med ikon + heading over. Våpenliste fikk
  ikoner og strukturerte rader.
- ARIA: `role="dialog"`, `aria-modal`, `aria-labelledby`.

### [x] Play Again-knapp

Når `ctx.gameover` er satt, vises en "Play Again"-knapp rett under
brettet. Knappen kaller `onPlayAgain`-prop som forlater matchen og
oppretter en ny via `lobbyClient`. Spilleren ender opp i en ny match
og må dele match-ID med motspilleren manuelt.

### [x] Vinneroverlay og fremhevede vinnerceller

- `GetWinningLine(cells)`-funksjon eksportert fra Game.js. Returnerer
  array med de fire cellene som dannet vinnerlinjen, eller null.
  7 nye tester. `IsVictory` er nå en thin wrapper.
- `endIf` lagrer `winningLine` i `ctx.gameover` ved seier.
- Board.js: brettet wrappet i `.board-wrapper` med posisjonert
  `.winner-overlay` på toppen som viser "NAME / WINS" i stor skrift
  med fraksjonsfarge. Bakgrunnen er en mørk radial vignett.
- Vinnercellene får `.winning`-klassen: glow, inset border i
  rust-bright og pulserende animasjon (`winning-pulse`).
- Turn-indicator, våpenpanel og rareium-bar skjules når
  `ctx.gameover` er satt, for å gi visuell ro rundt overlayen.

## Fase 6: Hosting og sikkerhet

### [x] 6.1 Match-ID-kollisjoner

I `src/server.mjs`: 4-sifret ID gir bare 9000 mulige verdier og ingen
kollisjonsjekk. Endre til 6-sifret, eller bruk nanoid med en alfa-numerisk
shortform (f.eks. `nanoid(6)`).

Notat: Endret til 6-sifret (900 000 verdier, fra 9 000). Valgte numerisk
fremfor nanoid-alfanumerisk fordi 6 sifre er enklere å dele verbalt og
fungerer godt på mobil-keypad. Boardgame.io har fortsatt ingen
innebygd kollisjonssjekk, men sannsynligheten er nå akseptabel for
hobbybruk.

### [x] 6.2 Lås CORS til frontend-domenet

I `src/server.mjs`, konfigurer cors slik:

```js
server.app.middleware.unshift(
  cors({ origin: process.env.FRONTEND_URL || '*' }),
);
```

Sett `FRONTEND_URL` på Render til Netlify-URL-en.

Notat: Gjort, men byttet til boardgame.io sin innebygde `origins`-opsjon
i stedet for den manuelle Koa-cors-middlewaren. Server-konfigen mottar
nå `origins: [Origins.LOCALHOST, ...(FRONTEND_URL?.split(','))]`.
Boardgame.io setter `apiOrigins = origins` automatisk, så samme liste
gjelder både Socket.IO-multiplayer og HTTP-API (lobby). Localhost er
alltid tillatt (for dev), FRONTEND_URL legges til når den er satt. Den
gamle "Server `origins` option is not set"-warningen i konsollen er nå
borte. `@koa/cors` fjernet fra dependencies som ubrukt.

FRONTEND_URL kan være komma-separert for å tillate flere origins (f.eks.
Netlify-preview-deploys + main).

### [~] 6.3 Verifiser env-vars og deploys

- Netlify: `VITE_BACKEND_URL` peker på Render-URL.
- Render: `FRONTEND_URL` peker på Netlify-URL.
- Test full multiplayer-flyt mot prod en siste gang.

Notat: Koden er klar. **Manuelle steg som gjenstår for eier ved push:**

1. Push alle commits til `origin/main`.
2. Sett opp Netlify-site (se notat under 2.4): koble GitHub-repo, sett
   `VITE_BACKEND_URL` env-variabel til Render-backend-URL.
3. På Render: legg til `FRONTEND_URL` env-variabel med Netlify-URL-en
   (uten trailing slash). Trigger redeploy så den blir lest inn.
4. Test full flyt: lobby → opprett match → spiller 2 joiner via match-ID
   → trekk fra begge sider → Play Again etter seier.
5. Hvis multiplayer ikke kobler til, sjekk Render-logger for
   "CORS låst til ..."-linjen og verifiser at den nevner riktig URL.

## Backlog (lavere prioritet, ta etter hvert)

- TypeScript-rewrite (kun ved en større refaktor i fremtiden).
- Persistens av matcher (databaseintegrasjon med boardgame.io DB-adapter).
- AI-motspiller (det finnes allerede en stub i `Game.js` under `ai.enumerate`).
- Lyd-effekter for trekk og våpen.
- Animasjon når et våpen utløses.
- Spectator-modus.
- Legg til Tactical Nuke, et spesialvåpen som helt ødelegger en gitt celle på brettet? (Dvs man kan ikke bruke den cellen resten av spillet.)
- Legg til noe som knytter brettet visuelt til navnet på territoriene?


