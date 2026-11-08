// Balansesimulering: spiller mange partier med enkle tilfeldige spillere og
// skriver ut statistikk. Bruk: node scripts/simulate.mjs [antall partier]
//
// Spillerne velger tilfeldige gyldige celler og bruker et våpen med 50 %
// sjanse når de har ett. Det er ikke smart spill, så tallene sier noe om
// regelverket (lengde, første-spiller-fordel, våpenfrekvens), ikke om
// optimal strategi.
import clientPkg from 'boardgame.io/dist/cjs/client.js';
import { TicTacToe, TOTAL_CELLS, IsRow } from '../src/Game.js';

const { Client } = clientPkg;
const GAMES = Number(process.argv[2]) || 500;
const MAX_TURNS = 400;
const ROWS = [];
for (let a = 0; a < TOTAL_CELLS; a++)
  for (let b = a + 1; b < TOTAL_CELLS; b++)
    for (let c = b + 1; c < TOTAL_CELLS; c++)
      if (IsRow([a, b, c])) ROWS.push([a, b, c]);

const pick = (list) => list[Math.floor(Math.random() * list.length)];

function takeTurn(client) {
  const { G, ctx } = client.getState();
  const me = ctx.currentPlayer;
  const weapon = G.strategicWeapon[me];
  if (weapon && Math.random() < 0.5) {
    const open = [...Array(TOTAL_CELLS).keys()].filter(
      (i) => weapon !== 'Dirty Nuke' || !G.destroyed[i],
    );
    const target = weapon === 'Air Strike' ? pick(ROWS) : pick(open);
    client.moves.useStrategicWeapon(target);
    if (client.getState().ctx.turn === ctx.turn) return false; // avvist
    return weapon;
  }
  const options = [...Array(TOTAL_CELLS).keys()].filter(
    (i) => !G.destroyed[i] && G.cells[i] !== me,
  );
  client.moves.clickCell(pick(options));
  return null;
}

const stats = {
  wins: [0, 0],
  draws: 0,
  turns: [],
  weapons: {},
  byDomination: 0,
};

for (let g = 0; g < GAMES; g++) {
  const client = Client({ game: TicTacToe, numPlayers: 2 });
  client.start();
  let turns = 0;
  while (!client.getState().ctx.gameover && turns < MAX_TURNS) {
    const weapon = takeTurn(client);
    if (weapon) stats.weapons[weapon] = (stats.weapons[weapon] ?? 0) + 1;
    turns++;
  }
  const over = client.getState().ctx.gameover;
  if (!over) stats.draws++;
  else {
    stats.wins[Number(over.winner)]++;
    if (!over.winningLine) stats.byDomination++;
  }
  stats.turns.push(turns);
}

const sorted = [...stats.turns].sort((a, b) => a - b);
const pct = (n) => `${((100 * n) / GAMES).toFixed(1)} %`;
console.log(`Partier: ${GAMES}`);
console.log(
  `Spiller 0 vant: ${pct(stats.wins[0])}, spiller 1 vant: ${pct(stats.wins[1])}`,
);
console.log(`Uavgjort etter ${MAX_TURNS} trekk: ${pct(stats.draws)}`);
console.log(`Seier ved dominans: ${pct(stats.byDomination)}`);
console.log(
  `Trekk per parti: median ${sorted[Math.floor(GAMES / 2)]}, ` +
    `90. persentil ${sorted[Math.floor(GAMES * 0.9)]}, maks ${sorted[GAMES - 1]}`,
);
console.log('Våpen brukt (totalt):', stats.weapons);
