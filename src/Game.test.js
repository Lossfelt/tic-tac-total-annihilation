import { describe, it, expect } from 'vitest';
import {
  IsVictory,
  GetWinningLine,
  IsRow,
  GetNeighbors,
  GetSurroundingCells,
  formatLogEntry,
  TicTacToe,
  NUM_PLAYERS,
  TOTAL_CELLS,
  RECYCLE_REFUND_RATIO,
} from './Game.js';
import { INVALID_MOVE } from 'boardgame.io/dist/cjs/core.js';

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

const baseG = () => ({
  cells: Array(TOTAL_CELLS).fill(null),
  destroyed: Array(TOTAL_CELLS).fill(false),
  log: [],
  blink: Array(TOTAL_CELLS).fill(false),
  blinkVersion: 0,
  lastCellAttacked: null,
  strategicWeapon: Array(NUM_PLAYERS).fill(null),
  Rareium: Array(NUM_PLAYERS).fill(0),
  rareiumAtWeapon: Array(NUM_PLAYERS).fill(0),
});

describe('recycleStrategicWeapon', () => {
  const recycle = TicTacToe.moves.recycleStrategicWeapon.move;

  it('er konfigurert som noLimit slik at turen ikke avsluttes', () => {
    expect(TicTacToe.moves.recycleStrategicWeapon.noLimit).toBe(true);
  });

  it('refunderer 70% av rareium-nivået da våpenet ble tildelt', () => {
    const G = baseG();
    G.strategicWeapon[0] = 'Artillery';
    G.rareiumAtWeapon[0] = 80;
    G.Rareium[0] = 0;

    recycle({ G, playerID: '0' });

    expect(G.strategicWeapon[0]).toBeNull();
    expect(G.Rareium[0]).toBe(Math.round(80 * RECYCLE_REFUND_RATIO));
    expect(G.rareiumAtWeapon[0]).toBe(0);
  });

  it('legger refusjonen på toppen av rareium akkumulert siden våpenet ble tildelt', () => {
    const G = baseG();
    G.strategicWeapon[0] = 'Artillery';
    G.rareiumAtWeapon[0] = 80;
    G.Rareium[0] = 30;

    recycle({ G, playerID: '0' });

    // 30 (akkumulert) + 56 (refund) = 86
    expect(G.Rareium[0]).toBe(30 + Math.round(80 * RECYCLE_REFUND_RATIO));
  });

  it('runder refusjonen', () => {
    const G = baseG();
    G.strategicWeapon[1] = 'Air Strike';
    // 55 * 0.7 = 38.5 -> 39
    G.rareiumAtWeapon[1] = 55;

    recycle({ G, playerID: '1' });

    expect(G.Rareium[1]).toBe(39);
  });

  it('logger handlingen med spillerens placeholder', () => {
    const G = baseG();
    G.strategicWeapon[0] = 'Biological Warfare';
    G.rareiumAtWeapon[0] = 100;

    recycle({ G, playerID: '0' });

    expect(G.log[0]).toBe(
      '__P0__ recycles Biological Warfare and recovers 70% Rareium',
    );
  });

  it('returnerer INVALID_MOVE hvis spilleren ikke har et våpen', () => {
    const G = baseG();

    const result = recycle({ G, playerID: '0' });

    expect(result).toBe(INVALID_MOVE);
    expect(G.Rareium[0]).toBe(0);
  });

  it('rører ikke motstanderens våpen eller rareium', () => {
    const G = baseG();
    G.strategicWeapon[0] = 'Artillery';
    G.rareiumAtWeapon[0] = 50;
    G.strategicWeapon[1] = 'Air Strike';
    G.rareiumAtWeapon[1] = 90;
    G.Rareium[1] = 12;

    recycle({ G, playerID: '0' });

    expect(G.strategicWeapon[1]).toBe('Air Strike');
    expect(G.rareiumAtWeapon[1]).toBe(90);
    expect(G.Rareium[1]).toBe(12);
  });
});

describe('useStrategicWeapon: Dirty Nuke', () => {
  const useWeapon = TicTacToe.moves.useStrategicWeapon;
  // Brukes ikke av Dirty Nuke, men kreves av kontrakten til moven.
  const stubRandom = { Number: () => 0 };

  it('setter destroyed=true og clear-er cells for målet', () => {
    const G = baseG();
    G.cells[5] = '1';
    G.strategicWeapon[0] = 'Dirty Nuke';

    useWeapon({ G, playerID: '0', random: stubRandom }, 5);

    expect(G.destroyed[5]).toBe(true);
    expect(G.cells[5]).toBeNull();
    expect(G.strategicWeapon[0]).toBeNull();
    expect(G.lastCellAttacked).toBe(5);
  });

  it('logger handlingen med territorienavnet', () => {
    const G = baseG();
    G.strategicWeapon[0] = 'Dirty Nuke';

    useWeapon({ G, playerID: '0', random: stubRandom }, 0);

    expect(G.log[0]).toContain('Dirty Nuke');
    expect(G.log[0]).toContain('the Salt Marches');
  });

  it('avviser nuke på en allerede destroyed celle', () => {
    const G = baseG();
    G.destroyed[7] = true;
    G.strategicWeapon[0] = 'Dirty Nuke';

    const result = useWeapon({ G, playerID: '0', random: stubRandom }, 7);

    expect(result).toBe(INVALID_MOVE);
    // Våpenet skal ikke konsumeres ved avvist trekk.
    expect(G.strategicWeapon[0]).toBe('Dirty Nuke');
  });

  it('tillater å nuke egen celle', () => {
    const G = baseG();
    G.cells[3] = '0';
    G.strategicWeapon[0] = 'Dirty Nuke';

    useWeapon({ G, playerID: '0', random: stubRandom }, 3);

    expect(G.destroyed[3]).toBe(true);
    expect(G.cells[3]).toBeNull();
  });
});

describe('område-våpen mot destroyed celle', () => {
  const useWeapon = TicTacToe.moves.useStrategicWeapon;
  // 0 < BIO_DESTROY_CHANCE og < INVASION_SUCCESS_CHANCE -> alltid "treff" der
  // det er random-roll. For Air Strike/Artillery brukes ikke random.
  const stubRandom = { Number: () => 0 };

  it('Artillery kan ha destroyed celle som senter og rammer naboene', () => {
    const G = baseG();
    G.destroyed[5] = true;
    G.cells[1] = '1';
    G.cells[4] = '1';
    G.cells[6] = '1';
    G.cells[9] = '1';
    G.strategicWeapon[0] = 'Artillery';

    useWeapon({ G, playerID: '0', random: stubRandom }, 5);

    // Naboene er nullet ut, og destroyed-flagget på 5 består.
    expect(G.cells[1]).toBeNull();
    expect(G.cells[4]).toBeNull();
    expect(G.cells[6]).toBeNull();
    expect(G.cells[9]).toBeNull();
    expect(G.destroyed[5]).toBe(true);
    expect(G.strategicWeapon[0]).toBeNull();
  });

  it('Biological Warfare kan sentreres på destroyed celle', () => {
    const G = baseG();
    G.destroyed[5] = true;
    G.cells[0] = '1';
    G.cells[10] = '1';
    G.strategicWeapon[0] = 'Biological Warfare';

    useWeapon({ G, playerID: '0', random: stubRandom }, 5);

    expect(G.cells[0]).toBeNull();
    expect(G.cells[10]).toBeNull();
    expect(G.destroyed[5]).toBe(true);
    expect(G.strategicWeapon[0]).toBeNull();
  });

  it('Air Strike kan inkludere destroyed celle i raden', () => {
    const G = baseG();
    G.destroyed[1] = true;
    G.cells[0] = '1';
    G.cells[2] = '1';
    G.strategicWeapon[0] = 'Air Strike';

    useWeapon({ G, playerID: '0', random: stubRandom }, [0, 1, 2]);

    expect(G.cells[0]).toBeNull();
    expect(G.cells[2]).toBeNull();
    expect(G.destroyed[1]).toBe(true);
    expect(G.strategicWeapon[0]).toBeNull();
  });
});

describe('clickCell på destroyed celle', () => {
  const clickCell = TicTacToe.moves.clickCell;
  const stubRandom = { Number: () => 1 };

  it('avvises som INVALID_MOVE', () => {
    const G = baseG();
    G.destroyed[8] = true;

    const result = clickCell({ G, playerID: '0', random: stubRandom }, 8);

    expect(result).toBe(INVALID_MOVE);
    expect(G.cells[8]).toBeNull();
    expect(G.destroyed[8]).toBe(true);
  });
});

describe('GetWinningLine med destroyed celle', () => {
  it('returnerer null hvis en celle i en ellers full linje er destroyed', () => {
    // Linjen [0,1,2,3] er eid av spiller 0 på 0,1,3 og destroyed (null) på 2.
    const cells = Array(TOTAL_CELLS).fill(null);
    cells[0] = '0';
    cells[1] = '0';
    cells[3] = '0';
    expect(GetWinningLine(cells)).toBeNull();
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
