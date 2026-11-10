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
`src/invasionRules.js` (`RULES`), og finnes bare på grenen
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

## Idéer som ikke er testet

Prinsipp: endre én ting om gangen og måle mot flip og D.

1. **Befest en celle:** et eget trekk som gjør en celle i stand til å tåle
   ett angrep uten å bli mistet. Gir forsvareren et aktivt valg i stedet for
   bare å blokkere. Koster et trekk, så det er en reell avveining.
2. **Omringing gjør angrep lettere:** sjansen for en vellykket invasjon øker
   når cellen er omringet av angriperens celler (f.eks. per nabo), og synker
   kanskje når den har egne naboer.
3. **Lavere sjanse** (25 til 35 %). Enklest, men gjør bare plutselige seire
   sjeldnere, fjerner dem ikke. Nyttig som referanse.
4. **Revolt etter okkupasjon, men mildere:** i stedet for bare okkuperte
   celler, la okkuperte celler ha høyere revoltsjanse enn egne (f.eks. 8 mot
   3 %). Beholder utjevningen og gir opprinnelig eier en mening.
5. **Justere revolt under D**, f.eks. lavere sjanse når partiene blir
   lengre, så revolt ikke dominerer.

Konseptuelt: begge fraksjonene invaderer og okkuperer allerede et annet
land, så "okkupasjon" blir en okkupasjon av en okkupasjon. Navnet og
forklaringen bør derfor velges med omhu, men mekanikken er interessant.

## Kode

Grenen `eksperiment/invasjon`:

- `src/invasionRules.js`: `RULES` med standardverdier lik dagens regler,
  `invasionChance`, `applyInvasion`, `consolidate`, `countedCells`,
  `markOrigin`, `mayRevolt` og `isImmune`. Testet i
  `invasionRules.test.js`.
- `Game.js`: feltene `fresh`, `origin` og `immune`, og bruk av reglene i
  `clickCell`, `onBegin`, revolt og `endIf`.
- `botStrategy.js`: riktig invasjonssjanse, ingen angrep på immune celler,
  og svar på fersk okkupasjon (`pendingWin`).
- `simulate.mjs`: parameterne og måltallene over.

Grenen holdes oppdatert mot main, og merges først når vi har valgt en regel.
Spillet på main bruker dagens regel.
