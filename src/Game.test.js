import { describe, it, expect } from 'vitest';
import {
  IsVictory,
  GetWinningLine,
  IsRow,
  GetNeighbors,
  GetSurroundingCells,
  formatLogEntry,
} from './Game.js';

// Brettet er 4x4, indeksert slik:
//   0  1  2  3
//   4  5  6  7
//   8  9 10 11
//  12 13 14 15

const emptyBoard = () => Array(16).fill(null);

const boardWith = (entries) => {
  const cells = emptyBoard();
  for (const [id, player] of entries) {
    cells[id] = player;
  }
  return cells;
};

describe('IsVictory', () => {
  it('gir false for tomt brett', () => {
    expect(IsVictory(emptyBoard())).toBe(false);
  });

  it.each([
    [[0, 1, 2, 3]],
    [[4, 5, 6, 7]],
    [[8, 9, 10, 11]],
    [[12, 13, 14, 15]],
  ])('gjenkjenner horisontal seier %j', (row) => {
    const cells = boardWith(row.map((i) => [i, '0']));
    expect(IsVictory(cells)).toBe(true);
  });

  it.each([
    [[0, 4, 8, 12]],
    [[1, 5, 9, 13]],
    [[2, 6, 10, 14]],
    [[3, 7, 11, 15]],
  ])('gjenkjenner vertikal seier %j', (col) => {
    const cells = boardWith(col.map((i) => [i, '1']));
    expect(IsVictory(cells)).toBe(true);
  });

  it.each([[[0, 5, 10, 15]], [[3, 6, 9, 12]]])(
    'gjenkjenner diagonal seier %j',
    (diag) => {
      const cells = boardWith(diag.map((i) => [i, '0']));
      expect(IsVictory(cells)).toBe(true);
    },
  );

  it('gir false for tre-på-rad (ufullstendig vinnerlinje)', () => {
    const cells = boardWith([
      [0, '0'],
      [1, '0'],
      [2, '0'],
    ]);
    expect(IsVictory(cells)).toBe(false);
  });

  it('gir false når en linje inneholder begge spillere', () => {
    const cells = boardWith([
      [0, '0'],
      [1, '0'],
      [2, '1'],
      [3, '0'],
    ]);
    expect(IsVictory(cells)).toBe(false);
  });

  it('gir false når null bryter linjen', () => {
    const cells = boardWith([
      [0, '0'],
      [1, '0'],
      [3, '0'],
    ]);
    expect(IsVictory(cells)).toBe(false);
  });
});

describe('GetWinningLine', () => {
  it('returnerer null for tomt brett', () => {
    expect(GetWinningLine(emptyBoard())).toBeNull();
  });

  it.each([
    [
      [0, 1, 2, 3],
      [0, 1, 2, 3],
    ],
    [
      [8, 9, 10, 11],
      [8, 9, 10, 11],
    ],
  ])('returnerer horisontal linje %j', (winningCells, expected) => {
    const cells = boardWith(winningCells.map((i) => [i, '0']));
    expect(GetWinningLine(cells)).toEqual(expected);
  });

  it('returnerer vertikal linje', () => {
    const cells = boardWith([1, 5, 9, 13].map((i) => [i, '1']));
    expect(GetWinningLine(cells)).toEqual([1, 5, 9, 13]);
  });

  it.each([
    [
      [0, 5, 10, 15],
      [0, 5, 10, 15],
    ],
    [
      [3, 6, 9, 12],
      [3, 6, 9, 12],
    ],
  ])('returnerer diagonal linje %j', (winningCells, expected) => {
    const cells = boardWith(winningCells.map((i) => [i, '0']));
    expect(GetWinningLine(cells)).toEqual(expected);
  });

  it('returnerer null naar linjen inneholder begge spillere', () => {
    const cells = boardWith([
      [0, '0'],
      [1, '0'],
      [2, '1'],
      [3, '0'],
    ]);
    expect(GetWinningLine(cells)).toBeNull();
  });
});

describe('IsRow', () => {
  it.each([
    [[0, 1, 2]],
    [[1, 2, 3]],
    [[5, 6, 7]],
    [[12, 13, 14]],
    [[13, 14, 15]],
  ])('godkjenner horisontal rad %j', (input) => {
    expect(IsRow(input)).toBe(true);
  });

  it('avviser rad som krysser radskillet (2,3,4)', () => {
    expect(IsRow([2, 3, 4])).toBe(false);
  });

  it('avviser rad som krysser radskillet (3,4,5)', () => {
    expect(IsRow([3, 4, 5])).toBe(false);
  });

  it.each([[[0, 4, 8]], [[4, 8, 12]], [[3, 7, 11]], [[7, 11, 15]]])(
    'godkjenner vertikal rad %j',
    (input) => {
      expect(IsRow(input)).toBe(true);
    },
  );

  it.each([[[0, 5, 10]], [[5, 10, 15]], [[1, 6, 11]]])(
    'godkjenner økende diagonal %j',
    (input) => {
      expect(IsRow(input)).toBe(true);
    },
  );

  it.each([[[3, 6, 9]], [[6, 9, 12]], [[7, 10, 13]], [[2, 5, 8]]])(
    'godkjenner synkende diagonal %j',
    (input) => {
      expect(IsRow(input)).toBe(true);
    },
  );

  it('aksepterer usortert input som faktisk er en gyldig rad', () => {
    expect(IsRow([2, 0, 1])).toBe(true);
    expect(IsRow([10, 0, 5])).toBe(true);
  });

  it.each([[[]], [[0]], [[0, 1]], [[0, 1, 2, 3]]])(
    'avviser feil lengde %j',
    (input) => {
      expect(IsRow(input)).toBe(false);
    },
  );

  it.each([[[0, 1, 3]], [[0, 2, 5]], [[0, 5, 11]], [[0, 1, 4]]])(
    'avviser celler som ikke er på rad %j',
    (input) => {
      expect(IsRow(input)).toBe(false);
    },
  );
});

describe('GetNeighbors', () => {
  it.each([
    [0, [4, 1]],
    [3, [7, 2]],
    [12, [8, 13]],
    [15, [11, 14]],
  ])('hjørnet %i har naboer %j', (id, expected) => {
    expect(GetNeighbors(id).sort()).toEqual([...expected].sort());
  });

  it.each([
    [1, [5, 0, 2]],
    [2, [6, 1, 3]],
    [4, [0, 8, 5]],
    [7, [3, 11, 6]],
    [8, [4, 12, 9]],
    [11, [7, 15, 10]],
    [13, [9, 12, 14]],
    [14, [10, 13, 15]],
  ])('kantcellen %i har naboer %j', (id, expected) => {
    expect(GetNeighbors(id).sort()).toEqual([...expected].sort());
  });

  it.each([
    [5, [1, 9, 4, 6]],
    [6, [2, 10, 5, 7]],
    [9, [5, 13, 8, 10]],
    [10, [6, 14, 9, 11]],
  ])('midtcellen %i har naboer %j', (id, expected) => {
    expect(GetNeighbors(id).sort()).toEqual([...expected].sort());
  });
});

describe('GetSurroundingCells', () => {
  it.each([
    [0, [0, 1, 4, 5]],
    [3, [2, 3, 6, 7]],
    [12, [8, 9, 12, 13]],
    [15, [10, 11, 14, 15]],
  ])('hjørnet %i dekker %j (4 celler)', (id, expected) => {
    expect(GetSurroundingCells(id).sort((a, b) => a - b)).toEqual(expected);
  });

  it.each([
    [1, [0, 1, 2, 4, 5, 6]],
    [2, [1, 2, 3, 5, 6, 7]],
    [4, [0, 1, 4, 5, 8, 9]],
    [7, [2, 3, 6, 7, 10, 11]],
    [13, [8, 9, 10, 12, 13, 14]],
  ])('kantcellen %i dekker %j (6 celler)', (id, expected) => {
    expect(GetSurroundingCells(id).sort((a, b) => a - b)).toEqual(expected);
  });

  it.each([
    [5, [0, 1, 2, 4, 5, 6, 8, 9, 10]],
    [6, [1, 2, 3, 5, 6, 7, 9, 10, 11]],
    [9, [4, 5, 6, 8, 9, 10, 12, 13, 14]],
    [10, [5, 6, 7, 9, 10, 11, 13, 14, 15]],
  ])('midtcellen %i dekker %j (9 celler)', (id, expected) => {
    expect(GetSurroundingCells(id).sort((a, b) => a - b)).toEqual(expected);
  });
});

describe('formatLogEntry', () => {
  const matchData = [
    { id: 0, name: 'Levin' },
    { id: 1, name: 'Eva' },
  ];

  it('erstatter __P0__ og __P1__ med navn fra matchData', () => {
    expect(formatLogEntry('__P0__ conquers Port Orchard', matchData)).toBe(
      'Levin conquers Port Orchard',
    );
    expect(formatLogEntry('__P1__ claims the Salt Marches', matchData)).toBe(
      'Eva claims the Salt Marches',
    );
  });

  it('erstatter flere placeholders i samme streng', () => {
    expect(formatLogEntry('__P0__ defeats __P1__ in battle', matchData)).toBe(
      'Levin defeats Eva in battle',
    );
  });

  it('returnerer strengen uendret hvis det ikke finnes placeholders', () => {
    expect(formatLogEntry('The people of Port Crater revolt', matchData)).toBe(
      'The people of Port Crater revolt',
    );
  });

  it('faller tilbake til "Player N" hvis matchData mangler navn', () => {
    expect(formatLogEntry('__P0__ claims it', [{}, {}])).toBe(
      'Player 0 claims it',
    );
  });

  it('faller tilbake til "Player N" hvis matchData er undefined', () => {
    expect(formatLogEntry('__P1__ acts', undefined)).toBe('Player 1 acts');
  });
});
