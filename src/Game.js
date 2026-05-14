import { INVALID_MOVE } from 'boardgame.io/dist/cjs/core.js';

// Names of the different squares of the board
const territories = [
  'the Salt Marches',
  'the Corn Belt Desert',
  "Hudson's Pit",
  'Port Orchard',
  'Port Crater',
  'the Savannah Fragments',
  'the Ash Plains',
  'the Rust Belt Ruins',
  "Angels' Remnants",
  'Oklahoma Rift',
  'the Dusty Delta',
  'the Shining Desert',
  'the Shattered Mountains',
  'the Plains of Iron',
  'the Confederate Shards',
  'the Sunset Swamps',
];

const strategic_weapons = [
  'Artillery', //Overload Explosion
  'Air Strike', //Orbital Laser
  'Biological Warfare', //Viral Bomb
];

// Positions for rows, columns, and diagonals
const positions = [
  // Horizontal lines
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  // Vertical lines
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  // Diagonal lines
  [0, 5, 10, 15],
  [3, 6, 9, 12],
];

// Check if `cells` is in a winning configuration
export function IsVictory(cells) {
  const isRowComplete = (row, cells) => {
    const symbols = row.map((i) => cells[i]);
    return symbols.every((i) => i !== null && i === symbols[0]);
  };
  return positions.some((row) => isRowComplete(row, cells));
}

// funksjon for å teste om celler er på rad, enten horisontalt, vertikalt eller diagonalt, ved Air Strike
export function IsRow(input) {
  if (input.length !== 3) return false; // Air Strike krever nøyaktig 3 ID-er

  const sortedInput = [...input].sort((a, b) => a - b); // Sorter ID-ene for enkel sjekk
  const [first, second, third] = sortedInput;

  // Sjekk for horisontal rad
  const isHorizontal =
    Math.floor(first / 4) === Math.floor(second / 4) &&
    Math.floor(second / 4) === Math.floor(third / 4) &&
    second - first === 1 &&
    third - second === 1;

  // Sjekk for vertikal rad
  const isVertical = second - first === 4 && third - second === 4;

  // Sjekk for diagonal rad
  const isDiagonal =
    (second - first === 5 && third - second === 5) || // Økende diagonal
    (second - first === 3 && third - second === 3); // Synkende diagonal

  return isHorizontal || isVertical || isDiagonal;
}

// Helper function to get neighbors for Artillery
export function GetNeighbors(id, boardSize = 4) {
  const neighbors = [];
  const row = Math.floor(id / boardSize);
  const col = id % boardSize;

  if (row > 0) neighbors.push(id - boardSize); // Above
  if (row < boardSize - 1) neighbors.push(id + boardSize); // Below
  if (col > 0) neighbors.push(id - 1); // Left
  if (col < boardSize - 1) neighbors.push(id + 1); // Right

  return neighbors;
}

// Definere alle naboer for en celle, brukt til Biological Warfare
export function GetSurroundingCells(id, boardSize = 4) {
  const neighbors = [];
  const row = Math.floor(id / boardSize);
  const col = id % boardSize;

  // Loop gjennom 3x3-ruten rundt den valgte cellen
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const newRow = row + dr;
      const newCol = col + dc;

      // Sjekk at cellen er innenfor brettets grenser
      if (
        newRow >= 0 &&
        newRow < boardSize &&
        newCol >= 0 &&
        newCol < boardSize
      ) {
        neighbors.push(newRow * boardSize + newCol);
      }
    }
  }

  return neighbors;
}

// Define the rules of the game
export const TicTacToe = {
  name: 'TicTacToe',

  setup: () => ({
    cells: Array(16).fill(null),
    log: [],
    blink: Array(16).fill(false),
    lastCellAttacked: null,
    MWD: Array(2).fill(null), // Hvilket strategisk våpen hver spiller har, hvis noen
    Rareium: Array(2).fill(0), // Antall Rareium hver spiller har
  }),

  turn: {
    minMoves: 1,
    maxMoves: 1,
    onBegin: ({ G, ctx, random }) => {
      G.lastCellAttacked = null;

      // Beregn antall celler nåværende spiller eier og oppdater Rareium basert på det
      const ownedCells = G.cells.filter(
        (cell) => cell === ctx.currentPlayer,
      ).length;
      G.Rareium[ctx.currentPlayer] += ownedCells;
      // Hvis spilleren ikke har et strategisk våpen, sjekk om de får et og nullstill Rareium
      if (!G.MWD[ctx.currentPlayer]) {
        if (random.Number() * 100 < G.Rareium[ctx.currentPlayer]) {
          G.MWD[ctx.currentPlayer] =
            strategic_weapons[random.Die(strategic_weapons.length) - 1];
          G.Rareium[ctx.currentPlayer] = 0;
        }
      }
    },
    onEnd: ({ G, random }) => {
      for (let i = 0; i < 16; i++) {
        if (
          G.cells[i] !== null &&
          random.Number() < 0.05 &&
          i !== G.lastCellAttacked
        ) {
          G.cells[i] = null;
          G.log.unshift(
            `The people of ${territories[i]} revolt against foreign rule`,
          );
          G.blink[i] = true;
        }
      }
    },
  },

  moves: {
    clickCell: ({ G, playerID, random }, id, matchData) => {
      G.blink.fill(false);
      if (G.cells[id] === playerID) {
        return INVALID_MOVE;
      } else if (G.cells[id] !== null) {
        if (random.Number() < 0.2) {
          G.cells[id] = playerID; // 20% chance of conquering
          G.log.unshift(
            `${matchData[playerID].name} conquers ${territories[id]}`,
          );
        } else {
          G.log.unshift(
            `${matchData[playerID].name} attempts to invade ${territories[id]}, but fails`,
          );
        }
        G.blink[id] = true;
        G.lastCellAttacked = id;
      } else {
        G.cells[id] = playerID;
        G.log.unshift(`${matchData[playerID].name} claims ${territories[id]}`);
        G.blink[id] = true;
        G.lastCellAttacked = id;
      }
    },
    MWD: ({ G, playerID, random }, input, matchData) => {
      G.blink.fill(false);
      if (G.MWD[playerID] === 'Artillery') {
        const targets = [input, ...GetNeighbors(input)];
        targets.forEach((target) => {
          G.cells[target] = null; // Destroy targeted cells
          G.blink[target] = true;
        });
        G.log.unshift(
          `${matchData[playerID].name} launches an Artillery Strike at ${territories[input]} and its neighbors!`,
        );
        G.lastCellAttacked = input;
        G.MWD[playerID] = null; // Nullstill strategisk våpen etter bruk
      } else if (G.MWD[playerID] === 'Air Strike') {
        if (input.length === 3 && IsRow(input)) {
          G.log.unshift(
            `${matchData[playerID].name} launches an Air Strike at ${input.map((id) => territories[id]).join(', ')}`,
          );
          input.forEach((id) => {
            G.cells[id] = null; // Destroy targeted cells
            G.blink[id] = true;
          });
          G.lastCellAttacked = input[2];
          G.MWD[playerID] = null; // Nullstill strategisk våpen etter bruk
        } else {
          G.blink.fill(false); // Hindre at cellene blinker etter et ugyldig trekk
          return INVALID_MOVE; // Allow the player to try again
        }
      } else if (G.MWD[playerID] === 'Biological Warfare') {
        const targets = GetSurroundingCells(input);
        targets.forEach((target) => {
          if (random.Number() < 0.5) {
            G.cells[target] = null; // Destroy targeted cells
            G.blink[target] = true;
          }
        });
        G.log.unshift(
          `${matchData[playerID].name} releases a Biological Weapon at ${territories[input]} and its surroundings!`,
        );
        G.lastCellAttacked = input;
        G.MWD[playerID] = null; // Nullstill strategisk våpen etter bruk
      }
    },
  },

  minPlayers: 2,
  maxPlayers: 2,

  endIf: ({ G, ctx }) => {
    if (IsVictory(G.cells)) {
      return { winner: ctx.currentPlayer };
    }
  },

  ai: {
    enumerate: (G, ctx) => {
      let moves = [];
      for (let i = 0; i < 16; i++) {
        if (G.cells[i] === null) {
          moves.push({ move: 'clickCell', args: [i] });
        }
      }
      return moves;
    },
  },
};
