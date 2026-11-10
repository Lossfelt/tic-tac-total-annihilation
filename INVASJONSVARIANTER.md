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
invasjon), blokkerer trusler, bruker våpen når forventet gevinst er klar, og
tar ellers cellen med høyest linjeverdi.

```bash
node scripts/simulate.mjs 1000 bot0=1 bot1=1 invasion=flip
```

`invasion=` og måltallene for invasjon finnes foreløpig bare på grenen
`eksperiment/invasjon` (se under). Hovedmålet er andelen seire der den
siste cellen i vinnerlinjen ble tatt ved invasjon. I tillegg måler vi
balansen mellom spillerne, lengden på partiene, antall uavgjorte, og hvor
ofte samme celle skifter eier frem og tilbake.

Forbehold: botten er heuristisk og ikke optimal. Tallene egner seg til å
sammenligne regler, ikke som fasit for hvordan mennesker spiller.

## Testet: tre varianter

Implementert bak `RULES.invasion` i `Game.js` på grenen
`eksperiment/invasjon`. Spillet på main bruker dagens regel.

- **flip (dagens regel):** vellykket invasjon gir angriperen cellen.
- **fortify (okkupasjon):** angriperen får cellen, men den teller ikke for
  seier før angriperens neste tur begynner. Forsvareren får alltid én tur til
  å svare med motinvasjon eller våpen. Botten slår tilbake mot en slik
  fersk okkupasjon når den fullfører en linje.
- **raze (raséring):** vellykket invasjon tømmer cellen. Angriperen må ta
  den i en senere tur.

Resultater, bot mot bot, 1000 partier per variant:

| | flip | fortify | raze |
|---|---|---|---|
| Seier der siste celle ble tatt ved invasjon | 85 % | 55 % | 0 % |
| Startspiller vinner / andre spiller vinner | 58 / 42 % | 53 / 47 % | 39 / 44 % |
| Uavgjort (400 trekk) | 0 % | 0,5 % | 18 % |
| Trekk per parti, median (90. persentil) | 14 (30) | 20 (45) | 48 (400) |
| Vellykkede invasjoner per parti | 2,0 | 4,1 | 18 |
| Partier der samme celle ble invadert 3+ ganger | 6,5 % | 31 % | 51 % |
| Lederen etter 12 trekk vant | 66 % | 61 % | 47 % |

### Konklusjoner så langt

- Problemet er reelt: med dagens regel avgjøres 85 % av seirene ved at
  blokkeringscellen eller den siste cellen tas ved invasjon.
- **fortify** halverer nesten problemet, jevner ut fordelen for den som
  starter og gir litt lengre partier. Men 55 % av seirene kommer fortsatt
  etter en invasjon, fordi motangrepet bare lykkes halvparten av gangene. Og
  frem og tilbake om samme celle øker tydelig (31 % av partiene).
- **raze** forkastes: linjer blir nesten aldri ferdige, mange partier ender
  uten vinner, og halvparten av partiene får lang frem-og-tilbake-kamp.
- Frem og tilbake kan være tematisk riktig, og våpen som rammer cellen og
  naboene kan bryte det. Men det må holdes i sjakk.

## Idéer som ikke er testet

Prinsipp: endre én ting om gangen og måle den mot dagens regel og mot
fortify, så vi vet hva som gir effekt.

### Tiltak på okkupasjon (fortify)

1. **Fersk okkupasjon er lettere å ta tilbake**, f.eks. 75 % sjanse for
   motangrep mot en celle som ble tatt forrige tur. Gjør forsvarsvaret
   meningsfullt, men kan gi mer frem og tilbake.
2. **Kort immunitet etter gjenerobring:** en celle som nettopp er tatt
   tilbake, kan ikke invaderes i neste tur. Bremser frem og tilbake direkte.
   Trolig best sammen med 1.

Konseptuelt: begge fraksjonene invaderer og okkuperer allerede et annet
land, så "okkupasjon" blir en okkupasjon av en okkupasjon. Navnet og
forklaringen bør derfor velges med omhu, men mekanikken er interessant.

### Opprinnelig eier

3. **Første eier markeres.** Første gang en celle tas, merkes den med
   fraksjonen som tok den. Den andre spilleren er alltid "okkupant" på denne
   cellen. Motiverer til å være tidlig ute med å ta celler.
   - Kan kombineres med lettere gjenerobring: den opprinnelige eieren har
     høyere sjanse til å ta cellen tilbake.
   - Krever et nytt felt i spilltilstanden og en visuell markering (f.eks.
     faksjonsfarge i hjørnet).
4. **Revolt bare i okkuperte celler.** I dag kan alle eide celler gjøre
   opprør (`REVOLT_CHANCE` 5 % per celle per tur, unntatt cellen som nettopp
   ble angrepet). Med opprinnelig eier kan revolt begrenses til celler man
   kontrollerer, men ikke var først i. Bygger på 3.

### Befesting og omringing

5. **Befest en celle:** et eget trekk som gjør en celle i stand til å tåle
   ett angrep uten å bli mistet. Gir forsvareren et aktivt valg i stedet for
   bare å blokkere. Koster et trekk, så det er en reell avveining.
6. **Omringing gjør angrep lettere:** sjansen for en vellykket invasjon øker
   når cellen er omringet av angriperens celler (f.eks. per nabo), og synker
   kanskje når den har egne naboer. Gir mer geografi og taktikk, men flere
   tall å holde oversikt over.
7. **Lavere sjanse** (25 til 35 %). Enklest, men gjør bare plutselige seire
   sjeldnere, fjerner dem ikke. Nyttig som referanse.

### Forslag til rekkefølge

1. Fortify med tiltak 1, deretter med tiltak 1 og 2. Sammenlign med flip og
   ren fortify.
2. Opprinnelig eier (3) som egen test, med og uten høyere gjenerobringssjanse
   for opprinnelig eier.
3. Revolt bare i okkuperte celler (4), når 3 er vurdert.
4. Befesting (5) og omringing (6) hver for seg.

Hver test bør rapportere samme tabell som over, og botten må lære den nye
regelen før tallene er til å stole på.

## Kode

- `eksperiment/invasjon`: `RULES.invasion` (flip, fortify, raze) i
  `Game.js`, `fresh`-feltet for ferske okkupasjoner, `countedCells` for
  seierssjekk, bottens svar på fersk okkupasjon (`pendingWin`), og
  måltallene i `simulate.mjs`. Grenen er basert på AI-grenen før den ble
  merget, så den må oppdateres mot main før videre arbeid.
