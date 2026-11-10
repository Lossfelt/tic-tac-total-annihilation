// Brettets geometri: størrelse, territorienavn, vinnerlinjer og naboer.
// Rene funksjoner uten spilltilstand, delt mellom spillet (Game.js), klienten
// og animasjonene.

export const BOARD_SIZE = 4;
export const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

export const territories = [
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

export const LINES = [
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

// Returnerer cellene som utgjør den vinnende linjen, eller null hvis det
// ikke finnes noen. Brukes både til seier-sjekk og til å fremheve vinneren
// sine celler på brettet.
export function GetWinningLine(cells) {
  for (const row of LINES) {
    const symbols = row.map((i) => cells[i]);
    if (symbols.every((i) => i !== null && i === symbols[0])) {
      return row;
    }
  }
  return null;
}

export function IsVictory(cells) {
  return GetWinningLine(cells) !== null;
}

// Returnerer playerID hvis én spiller eier samtlige ikke-destroyed celler
// (og minst én celle er eid). Returnerer null ellers - inkludert hvis det
// fortsatt finnes tomme, ikke-destroyed celler.
export function GetDominator(G) {
  let dominator = null;
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (G.destroyed[i]) continue;
    if (G.cells[i] === null) return null;
    if (dominator === null) {
      dominator = G.cells[i];
    } else if (dominator !== G.cells[i]) {
      return null;
    }
  }
  return dominator;
}

// Sjekker om tre celle-IDer ligger på rad (horisontalt, vertikalt eller
// diagonalt) - brukes til Air Strike-validering.
export function IsRow(input) {
  if (input.length !== 3) return false;

  const sortedInput = [...input].sort((a, b) => a - b);
  const [first, second, third] = sortedInput;

  const isHorizontal =
    Math.floor(first / BOARD_SIZE) === Math.floor(second / BOARD_SIZE) &&
    Math.floor(second / BOARD_SIZE) === Math.floor(third / BOARD_SIZE) &&
    second - first === 1 &&
    third - second === 1;

  const isVertical =
    second - first === BOARD_SIZE && third - second === BOARD_SIZE;

  const isDiagonal =
    (second - first === BOARD_SIZE + 1 && third - second === BOARD_SIZE + 1) ||
    (second - first === BOARD_SIZE - 1 && third - second === BOARD_SIZE - 1);

  return isHorizontal || isVertical || isDiagonal;
}

// Ortogonale naboer til en celle - brukes til Artillery.
export function GetNeighbors(id, boardSize = BOARD_SIZE) {
  const neighbors = [];
  const row = Math.floor(id / boardSize);
  const col = id % boardSize;

  if (row > 0) neighbors.push(id - boardSize);
  if (row < boardSize - 1) neighbors.push(id + boardSize);
  if (col > 0) neighbors.push(id - 1);
  if (col < boardSize - 1) neighbors.push(id + 1);

  return neighbors;
}

// 3x3-blokken rundt en celle (inkludert cellen selv) - brukes til
// Biological Warfare.
export function GetSurroundingCells(id, boardSize = BOARD_SIZE) {
  const neighbors = [];
  const row = Math.floor(id / boardSize);
  const col = id % boardSize;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const newRow = row + dr;
      const newCol = col + dc;
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
