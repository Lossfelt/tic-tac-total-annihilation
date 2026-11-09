// Balansesimulering: spiller mange partier med enkle spillere og skriver ut
// statistikk. Bruk:
//   node scripts/simulate.mjs [antall partier] [nøkkel=verdi ...]
//
// Nøkler, per spiller (0 eller 1), alle sannsynligheter mellom 0 og 1:
//   use0, use1       sjanse for å bruke et våpen når man har ett (standard 0.5)
//   recycle0/1       sjanse for å resirkulere et våpen i stedet (standard 0)
//   invade0/1        sjanse for å angripe en fiendecelle i stedet for å ta en
//                    ledig celle, når begge finnes (standard: helt tilfeldig)
//
// Våpen siktes grådig (flest fiendeceller, færrest egne), med aim=random for
// tilfeldig sikte. Cellevalget ellers er tilfeldig, så tallene sier noe om
// regelverket og relative fordeler mellom enkle strategier, ikke om optimalt
// spill. Sammenlign alltid to profiler mot hverandre, for eksempel
//   node scripts/simulate.mjs 1000 use0=0.9 use1=0.1
import clientPkg from 'boardgame.io/dist/cjs/client.js';
import {
  TicTacToe,
  TOTAL_CELLS,
  IsRow,
  GetNeighbors,
  GetSurroundingCells,
} from '../src/Game.js';

const { Client } = clientPkg;
const args = process.argv.slice(2);
const GAMES = Number(args.find((a) => !a.includes('='))) || 500;
const params = Object.fromEntries(
  args.filter((a) => a.includes('=')).map((a) => a.split('=')),
);
const profile = (id) => ({
  use: Number(params[`use${id}`] ?? 0.5),
  recycle: Number(params[`recycle${id}`] ?? 0),
  invade:
    params[`invade${id}`] === undefined ? null : Number(params[`invade${id}`]),
});
const PROFILES = [profile(0), profile(1)];

const MAX_TURNS = 400;
const SNAPSHOT_TURN = 12;
const ALL = [...Array(TOTAL_CELLS).keys()];
const ROWS = [];
for (let a = 0; a < TOTAL_CELLS; a++)
  for (let b = a + 1; b < TOTAL_CELLS; b++)
    for (let c = b + 1; c < TOTAL_CELLS; c++)
      if (IsRow([a, b, c])) ROWS.push([a, b, c]);

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Celler et våpen rammer når det sikter på `target`.
function hits(weapon, target) {
  if (weapon === 'Air Strike') return target;
  if (weapon === 'Artillery') return [target, ...GetNeighbors(target)];
  if (weapon === 'Biological Warfare') return GetSurroundingCells(target);
  return [target];
}

// Beste skudd: flest fiendeceller minus egne ramte celler. Returnerer null
// hvis ingen mål er en netto gevinst (da lar spilleren våpenet ligge).
function bestShot(G, me, weapon) {
  const targets =
    weapon === 'Air Strike'
      ? ROWS
      : ALL.filter((i) => weapon !== 'Dirty Nuke' || !G.destroyed[i]);
  let best = [];
  let bestScore = 0;
  for (const target of targets) {
    const score = hits(weapon, target).reduce(
      (sum, i) => sum + (G.cells[i] === null ? 0 : G.cells[i] === me ? -1 : 1),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = [target];
    } else if (score === bestScore && score > 0) best.push(target);
  }
  return best.length ? pick(best) : null;
}

function fireWeapon(client, G, me, weapon) {
  const target =
    params.aim === 'random'
      ? weapon === 'Air Strike'
        ? pick(ROWS)
        : pick(ALL.filter((i) => weapon !== 'Dirty Nuke' || !G.destroyed[i]))
      : bestShot(G, me, weapon);
  if (target === null) return false;
  const before = client.getState().ctx.turn;
  client.moves.useStrategicWeapon(target);
  return client.getState().ctx.turn !== before;
}

function chooseCell(G, me, invade) {
  const free = ALL.filter((i) => !G.destroyed[i] && G.cells[i] === null);
  const enemy = ALL.filter(
    (i) => !G.destroyed[i] && G.cells[i] !== null && G.cells[i] !== me,
  );
  if (invade === null || !enemy.length || !free.length) {
    return pick([...free, ...enemy]);
  }
  return Math.random() < invade ? pick(enemy) : pick(free);
}

// Spiller ett trekk. Returnerer navnet på våpenet som ble brukt, ellers null.
function takeTurn(client, stats) {
  const { G, ctx } = client.getState();
  const me = ctx.currentPlayer;
  const p = PROFILES[Number(me)];
  const weapon = G.strategicWeapon[me];
  if (weapon && Math.random() < p.recycle) {
    client.moves.recycleStrategicWeapon();
    stats.recycled[me]++;
    return takeTurn(client, stats);
  }
  if (weapon && Math.random() < p.use && fireWeapon(client, G, me, weapon)) {
    return weapon;
  }
  client.moves.clickCell(chooseCell(G, me, p.invade));
  return null;
}

const newStats = () => ({
  wins: [0, 0],
  draws: 0,
  turns: [],
  weapons: {},
  byDomination: 0,
  awarded: [0, 0],
  recycled: [0, 0],
  peakHeld: [0, 0],
  leaderGames: 0,
  leaderWins: 0,
});

const countCells = (G, id) => G.cells.filter((c) => c === id).length;

function playGame(stats) {
  const client = Client({ game: TicTacToe, numPlayers: 2 });
  client.start();
  let turns = 0;
  let leader = null;
  let held = [null, null];
  while (!client.getState().ctx.gameover && turns < MAX_TURNS) {
    const weapon = takeTurn(client, stats);
    if (weapon) stats.weapons[weapon] = (stats.weapons[weapon] ?? 0) + 1;
    turns++;
    const { G } = client.getState();
    for (const id of ['0', '1']) {
      if (!held[Number(id)] && G.strategicWeapon[id]) stats.awarded[id]++;
      if (G.strategicWeapon[id]) {
        stats.peakHeld[id] = Math.max(stats.peakHeld[id], G.Rareium[id]);
      }
    }
    held = [G.strategicWeapon['0'], G.strategicWeapon['1']];
    if (turns === SNAPSHOT_TURN) {
      const [a, b] = [countCells(G, '0'), countCells(G, '1')];
      if (a !== b) leader = a > b ? '0' : '1';
    }
  }
  const over = client.getState().ctx.gameover;
  if (!over) stats.draws++;
  else {
    stats.wins[Number(over.winner)]++;
    if (!over.winningLine) stats.byDomination++;
    if (leader !== null) {
      stats.leaderGames++;
      if (over.winner === leader) stats.leaderWins++;
    }
  }
  stats.turns.push(turns);
}

const stats = newStats();
for (let g = 0; g < GAMES; g++) playGame(stats);

const sorted = [...stats.turns].sort((a, b) => a - b);
const pct = (n, of = GAMES) => `${((100 * n) / of).toFixed(1)} %`;
const per = (n) => (n / GAMES).toFixed(2);
console.log(`Partier: ${GAMES}, profiler:`, JSON.stringify(PROFILES));
console.log(
  `Spiller 0 vant: ${pct(stats.wins[0])}, spiller 1 vant: ${pct(stats.wins[1])}`,
);
console.log(`Uavgjort etter ${MAX_TURNS} trekk: ${pct(stats.draws)}`);
console.log(`Seier ved dominans: ${pct(stats.byDomination)}`);
console.log(
  `Trekk per parti: median ${sorted[Math.floor(GAMES / 2)]}, ` +
    `90. persentil ${sorted[Math.floor(GAMES * 0.9)]}, maks ${sorted[GAMES - 1]}`,
);
console.log(
  `Våpen tildelt per parti: ${per(stats.awarded[0])} / ${per(stats.awarded[1])}`,
);
console.log(
  `Resirkulert per parti: ${per(stats.recycled[0])} / ${per(stats.recycled[1])}`,
);
console.log(
  `Høyeste Rareium mens våpen holdes: ${stats.peakHeld[0]} / ${stats.peakHeld[1]}`,
);
console.log(
  `Leder etter ${SNAPSHOT_TURN} trekk vant: ${pct(stats.leaderWins, stats.leaderGames)} ` +
    `(${stats.leaderGames} partier med leder)`,
);
console.log('Våpen brukt (totalt):', stats.weapons);
