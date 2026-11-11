# Invasjonsvarianter

Arbeidsnotat om invasjonsregelen: hva som er problemet, hva vi har prøvd,
hva vi målte, og hvilke idéer som står igjen. Oppdateres etter hvert som vi
tester mer. Startet 10. november 2026.

## Problemet

I dag kan en spiller klikke på motstanderens celle og overta den med 50 %
sjanse (`INVASION_SUCCESS_CHANCE`). Konseptet passer temaet godt, men det
undergraver blokkering:

- Har spiller A tre på rad, blokkerer B den fjerde cellen. A kan likevel
  invadere blokkeringscellen og vinne i samme trekk med 50 % sjanse.
- I praksis må en linje ha to ledige eller blokkerte celler for at
  forsvareren skal ha én tur på seg hvis noe skjer.
- Seier føles derfor plutselig og tilfeldig.

## Hvordan vi måler

Datamotspilleren (`src/botStrategy.js`) spiller mot seg selv i
`scripts/simulate.mjs`. Botten vinner når én celle mangler (også ved
invasjon), blokkerer trusler, slår tilbake mot en fersk okkupasjon som
fullfører en linje, bruker våpen når forventet gevinst er klar, og tar
ellers cellen med høyest linjeverdi. Den regner med riktig invasjonssjanse
for hver regelvariant og angriper ikke immune celler.

```bash
node scripts/simulate.mjs 1000 bot0=1 bot1=1 invasion=fortify freshRetake=0.75 immunity=1
```

Parameterne er beskrevet øverst i `simulate.mjs`. Reglene ligger i
`src/rules.js` (`RULES`), og finnes bare på grenen
`eksperiment/invasjon`, der også dette dokumentet ligger.

Måltall:

- **Invasjonsseier:** andel seire der den siste cellen i vinnerlinjen ble
  tatt ved invasjon. Hovedmålet. Merk at under fortify har forsvareren alltid
  hatt én tur til å svare før en slik seier teller, så tallet er ikke like
  "plutselig" som under flip.
- **Frem og tilbake:** andel partier der samme celle ble invadert tre ganger
  eller mer.
- Balanse mellom spillerne, partilengde, uavgjort (400 trekk), antall
  invasjoner og revolt per parti, og hvor ofte lederen etter 12 trekk vinner
  (snøballeffekt).

Forbehold: botten er heuristisk og ikke optimal. Tallene egner seg til å
sammenligne regler, ikke som fasit for hvordan mennesker spiller. Variasjon
mellom kjøringer er et par prosentpoeng.

## Runde 1: tre grunnvarianter

- **flip (dagens regel):** vellykket invasjon gir angriperen cellen.
- **fortify (okkupasjon):** angriperen får cellen, men den teller ikke for
  seier før angriperens neste tur begynner. Forsvareren får alltid én tur til
  å svare med motinvasjon eller våpen.
- **raze (raséring):** vellykket invasjon tømmer cellen. Angriperen må ta
  den i en senere tur.

Bot mot bot, 1000 partier per variant:

| | flip | fortify | raze |
|---|---|---|---|
| Invasjonsseier | 85 % | 55 % | 0 % |
| Startspiller / andre spiller vinner | 58 / 42 % | 53 / 47 % | 39 / 44 % |
| Uavgjort | 0 % | 0,5 % | 18 % |
| Trekk per parti, median (90. persentil) | 14 (30) | 20 (45) | 48 (400) |
| Vellykkede invasjoner per parti | 2,0 | 4,1 | 18 |
| Frem og tilbake | 6,5 % | 31 % | 51 % |
| Lederen etter 12 trekk vant | 66 % | 61 % | 47 % |

- Problemet er reelt: med dagens regel avgjøres 85 % av seirene ved
  invasjon.
- **fortify** halverer nesten problemet og jevner ut fordelen for den som
  starter, men gir mer frem og tilbake.
- **raze** forkastes: linjer blir nesten aldri ferdige, og mange partier
  ender uten vinner.

## Runde 2: tiltak på okkupasjon, opprinnelig eier og revolt

Kjørt 10. november 2026, bot mot bot, 1000 partier per variant. A og B er
runde 1 kjørt på nytt som referanse.

- **retake75:** 75 % sjanse for å ta tilbake en fersk okkupasjon (i stedet
  for 50 %). Gjenerobringen gjenoppretter cellen, den blir ikke fersk igjen.
- **imm:** en fersk okkupasjon som er tatt tilbake, kan ikke invaderes i
  angriperens neste tur.
- **origin75:** cellen husker hvem som tok den først, og den opprinnelige
  eieren har 75 % sjanse når den invaderer cellen.
- **revoltOcc:** revolt skjer bare i celler der eieren ikke er den som tok
  cellen først. revoltOcc15 hever samtidig revoltsjansen fra 5 til 15 %.

| Variant | Invasjons-seier | Start / andre vinner | Uavgjort | Trekk median (90.) | Invasjoner | Revolt | Frem og tilbake | Leder vant |
|---|---|---|---|---|---|---|---|---|
| A flip | 87 % | 58 / 42 % | 0 % | 14 (31) | 2,0 | 3,7 | 4 % | 71 % |
| B fortify | 56 % | 56 / 43 % | 0,8 % | 20 (48) | 4,3 | 7,5 | 30 % | 64 % |
| C fortify + retake75 | 42 % | 52 / 47 % | 1,3 % | 23 (67) | 6,9 | 10,1 | 48 % | 59 % |
| **D fortify + retake75 + imm** | **37 %** | **47 / 51 %** | 2,1 % | 26 (71) | 7,1 | 11,9 | 36 % | 61 % |
| E flip + origin75 | 88 % | 62 / 38 % | 0,2 % | 15 (31) | 3,0 | 3,9 | 16 % | 69 % |
| F fortify + origin75 | 49 % | 51 / 47 % | 1,2 % | 24 (64) | 7,5 | 9,3 | 50 % | 59 % |
| G D + origin75 | 41 % | 49 / 48 % | 3,1 % | 27 (80) | 10,4 | 13,5 | 45 % | 57 % |
| H flip + revoltOcc | 81 % | 65 / 35 % | 0 % | 12 (18) | 1,7 | 0,2 | 5 % | 75 % |
| I flip + revoltOcc15 | 83 % | 64 / 36 % | 0 % | 12 (20) | 1,7 | 0,5 | 4 % | 76 % |
| J D + revoltOcc15 | 46 % | 46 / 53 % | 0,3 % | 18 (40) | 4,6 | 1,4 | 36 % | 64 % |

### Konklusjoner etter runde 2

- **Lettere gjenerobring (C)** senker invasjonsseire fra 56 til 42 %, men
  frem og tilbake øker til nesten halvparten av partiene.
- **Immunitet i tillegg (D)** er den beste kombinasjonen så langt:
  invasjonsseire ned til 37 %, frem og tilbake tilbake til 36 %, og jevn
  balanse mellom spillerne (startfordelen forsvinner, andre spiller har til
  og med en liten fordel). Partiene blir lengre (median 26 mot 14 trekk).
- **Opprinnelig eier med høyere gjenerobringssjanse (E, F, G)** hjelper ikke
  mot plutselige seire. Det gir flere invasjoner og mer frem og tilbake i
  alle kombinasjoner, og under flip øker startfordelen. Som mekanikk for
  sjanse virker den mot hensikten. Merkingen kan likevel være nyttig for
  revolt (under) og for tematikken.
- **Revolt bare i okkuperte celler (H, I, J)** fjerner nesten all revolt
  (fra 3,7 til 0,2 per parti under flip). Det gjør spillet kortere og mer
  forutsigbart, men øker snøballeffekten (lederen vinner 75 %) og
  startfordelen (65 / 35 %). Revolt er altså i dag en viktig utjevner. Å
  heve sjansen til 15 % hjelper lite, fordi det er få okkuperte celler.
  Sammen med D (J) blir partiene kortere, men invasjonsseire øker igjen (46
  mot 37 %).
- Revolt øker kraftig når partiene blir lengre (fra 3,7 under flip til 11,9
  under D), siden hver eid celle har 5 % sjanse hver tur. Det bør vurderes
  sammen med en eventuell ny invasjonsregel.

## Runde 3: knipetang, forankring og forsinket revolt

Idéene kom fra en ny idérunde 11. november 2026, der målet var at
motspilleren skal kunne se faren komme i stedet for å tape plutselig.
Kjørt samme dag, bot mot bot, 1000 partier per variant (200 for click).

- **Knipetang (K4, K8):** en fiendecelle kan bare invaderes når angriperen
  har minst to egne naboer til den, rett ut (4) eller også diagonalt (8).
  Sjansen er fortsatt 50 %.
- **Forankring (S):** eide celler har styrke 1 til 3. En celle vokser med 1
  når eierens tur begynner, hvis den ikke ble angrepet siden sist. Et treff
  senker styrken med 1, og cellen faller ved 0. Tre angrepsformer:
  - **click:** angrip hvilken som helst fiendecelle, treffer alltid.
  - **attrition:** angrip fra en egen nabocelle (8 naboer), treffer alltid,
    men den angripende cellen mister også 1.
  - **risk:** angrip fra en egen nabocelle, sjansen er 50 % pluss 15
    prosentpoeng per styrkeforskjell (20 til 80 %), og en bom koster den
    angripende cellen 1. Dette er RISK-elementet og bakslaget fra forslag
    6.
- Justeringer som ble nødvendige underveis (se funn under):
  - **claim2:** en ny celle starter med styrke 2 i stedet for 1.
  - **forsterk:** klikk på egen celle gir +1 styrke. Overlapper med
    befesting, som ellers venter.
  - **conqImm:** en erobret celle kan ikke angripes i motstanderens neste
    tur.
- **Forsinket revolt (R):** opprøret varsles som uro. Eieren kan bruke sin
  neste tur på å undertrykke det (klikke på cellen). Ellers går cellen tapt
  på slutten av den turen.

"Låst" betyr at spilleren som har turen, ikke har noe lovlig trekk (fullt
brett og ingen fiendecelle som kan angripes). Det telles som uavgjort.

| Variant | Invasjons-seier | Start / andre vinner | Uavgjort (låst) | Trekk median (90.) | Invasjoner | Revolt | Frem og tilbake | Leder vant |
|---|---|---|---|---|---|---|---|---|
| A flip (referanse) | 86 % | 56 / 44 % | 0 % | 15 (31) | 2,0 | 3,9 | 6 % | 68 % |
| D fortify + retake75 + imm (referanse) | 40 % | 49 / 49 % | 2,3 % | 27 (74) | 7,7 | 12,9 | 36 % | 57 % |
| K4 knipetang, 4 naboer | 78 % | 57 / 43 % | 0,4 % (0,4 %) | 17 (36) | 1,0 | 5,8 | 0,2 % | 67 % |
| K8 knipetang, 8 naboer | 82 % | 60 / 40 % | 0 % | 16 (33) | 1,0 | 4,9 | 0,2 % | 67 % |
| S1 click | 0 % | 0 / 0 % | 100 % | 400 | 399 | 0 | 100 % | |
| S2 attrition | 97 % | 57 / 42 % | 0,4 % | 13 (47) | 7,4 | 4,5 | 35 % | 65 % |
| S3 risk | 93 % | 62 / 38 % | 0 % | 13 (31) | 2,3 | 3,9 | 11 % | 72 % |
| S4 attrition + claim2 | 5 % | 54 / 44 % | 2,5 % | 35 (97) | 0,3 | 22,2 | 2 % | 59 % |
| S5 risk + claim2 | 3 % | 55 / 41 % | 3,7 % | 37 (116) | 0,5 | 24,2 | 3 % | 59 % |
| S6 attrition + claim2 + forsterk | 0 % | 52 / 45 % | 3,2 % | 36 (105) | 0,3 | 24,1 | 2 % | 60 % |
| S7 risk + claim2 + forsterk | 0 % | 53 / 44 % | 3,8 % | 37 (106) | 0,6 | 24,6 | 3 % | 58 % |
| S8 risk + forsterk | 92 % | 62 / 38 % | 0,4 % | 14 (33) | 2,5 | 5,1 | 11 % | 75 % |
| S9 click + claim2 + conqImm (200) | 7 % | 48 / 47 % | 5,5 % | 36 (235) | 0,6 | 27,1 | 3 % | 54 % |
| R1 flip + forsinket revolt | 86 % | 58 / 42 % | 0 % | 13 (24) | 1,7 | 2,0 | 4 % | 73 % |
| R2 D + forsinket revolt | 37 % | 49 / 50 % | 1,2 % | 22 (54) | 5,6 | 7,3 | 32 % | 57 % |
| S4 + forsinket revolt | 1 % | 53 / 47 % | 0,3 % | 26 (55) | 0,05 | 9,6 | 0,2 % | 64 % |
| S6 + forsinket revolt | 0 % | 56 / 44 % | 0,4 % | 27 (58) | 0,03 | 10,3 | 0,3 % | 63 % |

Erobringer per celle og parti, hjørne / kant / midt: flip 0,17 / 0,09 /
0,16, K4 0,02 / 0,08 / 0,06, K8 0,03 / 0,08 / 0,07.

Under forsinket revolt ble det varslet 2,9 (R1) til 12 uroer per parti, men
botten undertrykte bare 0,3 til 0,9 av dem.

### Konklusjoner etter runde 3

- **Knipetang** fjerner nesten all frem og tilbake (0,2 %) og halverer
  antall invasjoner. Som ventet blir hjørnene festninger (erobret 6 til 8
  ganger sjeldnere). Men den løser ikke hovedproblemet: 78 til 82 % av
  seirene kommer fortsatt ved invasjon. Blokkeringscellen i enden av en
  linje har nesten alltid to av angriperens celler som naboer, siden
  linjen selv ligger ved siden av den. Knipetang gir mer strategi i
  rekkefølgen celler tas i, men trenger et tillegg for å beskytte
  blokkering.
- **Forankring med styrke 1 for nye celler** gjør problemet verre (93 til
  97 % invasjonsseire). En blokkering er alltid en ny celle, så den er
  svakest akkurat når den trengs. **click** låser seg helt: angrep uten
  kostnad gjør at hver erobring tas tilbake med en gang.
- **Forankring med styrke 2 for nye celler** fjerner plutselige
  invasjonsseire (0 til 5 %), og en celle må angripes to ganger før den
  faller, så faren synes. Men botten slutter nesten å invadere (0,03 til
  0,6 per parti), og partiene blir lange (median 35 til 37). Da avgjøres
  partiene i stedet av revolt, med 22 til 27 opprør per parti.
- **Forsinket revolt** demper revolt i alle varianter: under D fra 12,9 til
  7,3 per parti, og sammen med forankring fra 22 til 10. Partiene blir
  kortere, og balansen holder seg. Under dagens regel (R1) øker
  snøballeffekten litt (lederen vinner 73 mot 68 %), fordi revolt i dag
  er en utjevner.
- **Beste kandidater så langt:**
  - **R2 (okkupasjon + gjenerobring + immunitet + forsinket revolt):** 37 %
    invasjonsseire, helt jevnt mellom spillerne, median 22 trekk, men 32 %
    frem og tilbake.
  - **S4 med forsinket revolt (attrition, styrke 2, forsinket revolt):**
    1 % invasjonsseire, ingen frem og tilbake, median 26 trekk, men
    invasjon blir nesten borte som mekanikk.

### Forbehold for runde 3

- Botten planlegger ikke angrep over flere turer. Under forankring med
  styrke 2 ser den bare én tur frem og velger nesten aldri å angripe. Lave
  invasjonstall der betyr derfor trolig at **botten** ikke invaderer, ikke
  nødvendigvis at regelen gjør invasjon uinteressant for mennesker.
- Botten undertrykker uro bare når cellen er del av en linje med minst to
  egne celler. Mennesker vil trolig undertrykke oftere, så forsinket revolt
  kan virke enda mildere i praksis.
- Forankring trenger en visning av styrke (f.eks. 1 til 3 prikker) og en
  forklaring. Knipetang trenger at lovlige angrepsmål vises på brettet.

## Idéer som ikke er testet

- **Befesting** og **omringing** (fra runde 1) venter fortsatt. Forsterk i
  runde 3 er en enkel form for befesting.
- **Knipetang sammen med D:** knipetang fjerner frem og tilbake, D fjerner
  plutselige seire. Kombinasjonen kan få det beste fra begge.
- **Bedre bot for forankring:** la botten planlegge et angrep over to turer
  (fortsette å angripe en svekket celle), så tallene for styrke 2 blir til
  å stole på.
- **Revolt som svekker:** uro senker cellens styrke (forankring) eller øker
  sjansen for invasjon, med mindre eieren undertrykker den. Testet bare
  som forsinket tap.
- Fra runde 1 og 2: lavere sjanse (25 til 35 %) som referanse, revolt med
  høyere sjanse i okkuperte celler enn i egne.

Konseptuelt: begge fraksjonene invaderer og okkuperer allerede et annet
land, så "okkupasjon" blir en okkupasjon av en okkupasjon. Navnet og
forklaringen bør derfor velges med omhu, men mekanikken er interessant.

## Kode

Grenen `eksperiment/invasjon`:

- `src/rules.js`: `RULES` med standardverdier lik dagens regler, og alle
  innstillingene over.
- `src/invasionRules.js`: invasjon (`canInvade`, `invasionChance`,
  `attack`, `applyInvasion`, `claimCell`, `consolidate`, `countedCells`).
- `src/strengthRules.js`: knipetang og forankring.
- `src/revoltRules.js`: revolt, også forsinket med undertrykking.
- `Game.js`: feltene `fresh`, `origin`, `immune`, `strength`, `attacked`
  og `unrest`. Klikk på egen celle undertrykker uro eller forsterker.
- `botStrategy.js` og `botInvasion.js`: botten bruker riktig sjanse og
  lovlige mål, svarer på fersk okkupasjon, forsterker truede blokkeringer
  og undertrykker uro i viktige celler.
- `simulate.mjs`: parameterne er beskrevet øverst i filen.
- Tester: `invasionRules.test.js` og `strengthRules.test.js`.

Grenen holdes oppdatert mot main, og merges først når vi har valgt en regel.
Spillet på main bruker dagens regel. Loggen i spillet kan ikke vise de nye
hendelsestypene (`hit`, `unrest`, `suppress`, `reinforce`) ennå.
