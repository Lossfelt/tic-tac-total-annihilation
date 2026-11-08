import { describe, it, expect } from 'vitest';
import {
  IsVictory,
  GetWinningLine,
  GetDominator,
  IsRow,
  GetNeighbors,
  GetSurroundingCells,
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
  blinkKind: Array(TOTAL_CELLS).fill(null),
  lastCellAttacked: null,
  strategicWeapon: Array(NUM_PLAYERS).fill(null),
  Rareium: Array(NUM_PLAYERS).fill(0),
  rareiumAtWeapon: Array(NUM_PLAYERS).fill(0),
  weaponEvent: { type: null, cells: [], before: null, version: 0 },
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

  it('logger handlingen som strukturert oppføring', () => {
    const G = baseG();
    G.strategicWeapon[0] = 'Biological Warfare';
    G.rareiumAtWeapon[0] = 100;

    recycle({ G, playerID: '0' });

    expect(G.log[0]).toEqual({
      type: 'recycle',
      player: '0',
      weapon: 'Biological Warfare',
      refund: 70,
    });
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

  it('logger våpenet, spilleren og målcellen', () => {
    const G = baseG();
    G.strategicWeapon[0] = 'Dirty Nuke';

    useWeapon({ G, playerID: '0', random: stubRandom }, 0);

    expect(G.log[0]).toEqual({
      type: 'Dirty Nuke',
      player: '0',
      cells: [0],
    });
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

describe('useStrategicWeapon: validering', () => {
  const weaponMove = TicTacToe.moves.useStrategicWeapon;
  const stubRandom = { Number: () => 0 };
  const play = (G, input) =>
    weaponMove({ G, playerID: '0', random: stubRandom }, input);

  it('avviser trekket når spilleren ikke har et våpen', () => {
    const G = baseG();
    G.cells[5] = '1';

    expect(play(G, 5)).toBe(INVALID_MOVE);
    expect(G.cells[5]).toBe('1');
    expect(G.weaponEvent.version).toBe(0);
  });

  it.each([-1, 16, 99, 1.5, '5', null, undefined, [5]])(
    'avviser ugyldig enkeltmål %j',
    (input) => {
      const G = baseG();
      G.strategicWeapon[0] = 'Artillery';

      expect(play(G, input)).toBe(INVALID_MOVE);
      expect(G.strategicWeapon[0]).toBe('Artillery');
    },
  );

  it.each([
    [[0, 0, 0]],
    [[0, 1]],
    [[0, 1, 2, 3]],
    [[0, 1, 5]],
    [[0, 1, 99]],
    [5],
    ['0', '1', '2'],
  ])('avviser ugyldig Air Strike-mål %j', (input) => {
    const G = baseG();
    G.strategicWeapon[0] = 'Air Strike';

    expect(play(G, input)).toBe(INVALID_MOVE);
    expect(G.strategicWeapon[0]).toBe('Air Strike');
  });
});

describe('useStrategicWeapon: våpenhendelse', () => {
  const weaponMove = TicTacToe.moves.useStrategicWeapon;
  const stubRandom = { Number: () => 0 };
  const play = (G, input) =>
    weaponMove({ G, playerID: '0', random: stubRandom }, input);

  it('registrerer type, mål og versjon', () => {
    const G = baseG();
    G.strategicWeapon[0] = 'Dirty Nuke';

    play(G, 5);

    expect(G.weaponEvent.type).toBe('Dirty Nuke');
    expect(G.weaponEvent.cells).toEqual([5]);
    expect(G.weaponEvent.version).toBe(1);
  });

  it('lagrer brettet slik det var før våpenet traff', () => {
    const G = baseG();
    G.cells[5] = '1';
    G.cells[6] = '0';
    G.strategicWeapon[0] = 'Dirty Nuke';

    play(G, 5);

    expect(G.weaponEvent.before.cells[5]).toBe('1');
    expect(G.weaponEvent.before.cells[6]).toBe('0');
    expect(G.weaponEvent.before.destroyed[5]).toBe(false);
    expect(G.cells[5]).toBeNull();
    expect(G.destroyed[5]).toBe(true);
  });

  it('øker versjonen for hvert våpen som brukes', () => {
    const G = baseG();
    G.strategicWeapon[0] = 'Dirty Nuke';
    play(G, 5);
    G.strategicWeapon[0] = 'Artillery';
    play(G, 9);

    expect(G.weaponEvent.version).toBe(2);
    expect(G.weaponEvent.type).toBe('Artillery');
  });

  it('registrerer alle tre målene for Air Strike', () => {
    const G = baseG();
    G.strategicWeapon[0] = 'Air Strike';

    play(G, [0, 1, 2]);

    expect(G.weaponEvent.cells).toEqual([0, 1, 2]);
  });

  it('registrerer ingen hendelse for et avvist trekk', () => {
    const G = baseG();
    G.destroyed[7] = true;
    G.strategicWeapon[0] = 'Dirty Nuke';

    expect(play(G, 7)).toBe(INVALID_MOVE);
    expect(G.weaponEvent.version).toBe(0);
  });
});

describe('useStrategicWeapon: Biological Warfare, hendelse', () => {
  const weaponMove = TicTacToe.moves.useStrategicWeapon;
  const play = (G, input, numbers) => {
    const queue = [...numbers];
    const random = { Number: () => queue.shift() };
    return weaponMove({ G, playerID: '0', random }, input);
  };

  it('registrerer bare cellene som faktisk ble rammet', () => {
    const G = baseG();
    G.strategicWeapon[0] = 'Biological Warfare';
    // Senter 5 har 9 celler i området (0,1,2,4,5,6,8,9,10). Annenhver rammes.
    play(G, 5, [0, 0.9, 0, 0.9, 0, 0.9, 0, 0.9, 0]);

    expect(G.weaponEvent.affected).toEqual([0, 2, 5, 8, 10]);
  });

  it('registrerer en tom liste når ingen celler ble rammet', () => {
    const G = baseG();
    G.strategicWeapon[0] = 'Biological Warfare';

    play(G, 5, Array(9).fill(0.99));

    expect(G.weaponEvent.affected).toEqual([]);
    expect(G.weaponEvent.type).toBe('Biological Warfare');
  });

  it('registrerer ingen rammede celler for våpen uten tilfeldighet', () => {
    const G = baseG();
    G.strategicWeapon[0] = 'Dirty Nuke';

    play(G, 5, []);

    expect(G.weaponEvent.affected).toEqual([]);
  });
});

describe('clickCell: hva som skjedde med cellen', () => {
  const clickCell = TicTacToe.moves.clickCell;
  const play = (G, id, roll) =>
    clickCell({ G, playerID: '0', random: { Number: () => roll } }, id);

  it("merker en ledig celle som 'claim'", () => {
    const G = baseG();

    play(G, 3, 1);

    expect(G.cells[3]).toBe('0');
    expect(G.blink[3]).toBe(true);
    expect(G.blinkKind[3]).toBe('claim');
  });

  it("merker en vellykket invasjon som 'conquer'", () => {
    const G = baseG();
    G.cells[3] = '1';

    play(G, 3, 0);

    expect(G.cells[3]).toBe('0');
    expect(G.blinkKind[3]).toBe('conquer');
  });

  it("merker en mislykket invasjon som 'fail'", () => {
    const G = baseG();
    G.cells[3] = '1';

    play(G, 3, 0.99);

    expect(G.cells[3]).toBe('1');
    expect(G.blinkKind[3]).toBe('fail');
  });

  it('nullstiller forrige trekks merker ved neste trekk', () => {
    const G = baseG();
    play(G, 3, 1);
    play(G, 4, 1);

    expect(G.blink[3]).toBe(false);
    expect(G.blinkKind[3]).toBeNull();
    expect(G.blinkKind[4]).toBe('claim');
  });

  it('nullstiller merkene også når et våpen brukes', () => {
    const G = baseG();
    play(G, 3, 1);
    G.strategicWeapon[0] = 'Dirty Nuke';
    TicTacToe.moves.useStrategicWeapon(
      { G, playerID: '0', random: { Number: () => 0 } },
      9,
    );

    expect(G.blinkKind[3]).toBeNull();
    expect(G.blink[9]).toBe(true);
    expect(G.blinkKind[9]).toBeNull();
  });
});

describe('revolt (onEnd)', () => {
  it("merker cellen som 'revolt' og tømmer den", () => {
    const G = baseG();
    G.cells[2] = '1';
    G.lastCellAttacked = null;

    TicTacToe.turn.onEnd({ G, random: { Number: () => 0 } });

    expect(G.cells[2]).toBeNull();
    expect(G.blinkKind[2]).toBe('revolt');
  });

  it('lar cellen som ble angrepet denne runden i fred', () => {
    const G = baseG();
    G.cells[2] = '1';
    G.lastCellAttacked = 2;

    TicTacToe.turn.onEnd({ G, random: { Number: () => 0 } });

    expect(G.cells[2]).toBe('1');
  });
});

describe('clickCell: validering', () => {
  const clickCell = TicTacToe.moves.clickCell;

  it.each([-1, 16, 99, 1.5, '3', null, undefined])(
    'avviser ugyldig celle-id %j',
    (id) => {
      const G = baseG();

      const result = clickCell(
        { G, playerID: '0', random: { Number: () => 1 } },
        id,
      );

      expect(result).toBe(INVALID_MOVE);
      expect(G.cells).toEqual(Array(16).fill(null));
    },
  );
});

describe('debugGiveWeapon', () => {
  const give = TicTacToe.moves.debugGiveWeapon;

  it('kjører bare på serveren og teller ikke som turens trekk', () => {
    expect(give.client).toBe(false);
    expect(give.noLimit).toBe(true);
  });

  it('avvises uten DEBUG_MOVES, slik at det ikke virker i produksjon', () => {
    const G = baseG();

    expect(give.move({ G, playerID: '0' }, 'Dirty Nuke')).toBe(INVALID_MOVE);
    expect(G.strategicWeapon[0]).toBeNull();
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

describe('GetDominator', () => {
  it('returnerer null på tomt brett (begge eier 0)', () => {
    const G = baseG();
    expect(GetDominator(G)).toBeNull();
  });

  it('returnerer null hvis det finnes en tom, ikke-destroyed celle', () => {
    const G = baseG();
    // Spiller 0 eier alt unntatt celle 7 som er tom og ikke destroyed.
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (i !== 7) G.cells[i] = '0';
    }
    expect(GetDominator(G)).toBeNull();
  });

  it('returnerer null hvis begge spillere eier celler', () => {
    const G = baseG();
    for (let i = 0; i < TOTAL_CELLS; i++) G.cells[i] = '0';
    G.cells[5] = '1';
    expect(GetDominator(G)).toBeNull();
  });

  it('returnerer dominator når alle ikke-destroyed er eid av samme spiller', () => {
    const G = baseG();
    // Destroyed: 0, 5, 10, 15. Resten eies av spiller 1.
    [0, 5, 10, 15].forEach((i) => {
      G.destroyed[i] = true;
    });
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (!G.destroyed[i]) G.cells[i] = '1';
    }
    expect(GetDominator(G)).toBe('1');
  });

  it('returnerer null hvis kun destroyed celler er igjen (ingen eier noe)', () => {
    const G = baseG();
    for (let i = 0; i < TOTAL_CELLS; i++) G.destroyed[i] = true;
    expect(GetDominator(G)).toBeNull();
  });
});

describe('endIf: domination', () => {
  const { endIf } = TicTacToe;
  const stubCtx = { currentPlayer: '0' };

  it('returnerer winner uten winningLine når en spiller dominerer', () => {
    const G = baseG();
    // 4 nukes som dreper alle linjer: {3, 5, 10, 12}. Spiller 0 eier resten.
    [3, 5, 10, 12].forEach((i) => {
      G.destroyed[i] = true;
    });
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (!G.destroyed[i]) G.cells[i] = '0';
    }

    const result = endIf({ G, ctx: stubCtx });

    expect(result).toEqual({ winner: '0' });
    expect(result.winningLine).toBeUndefined();
  });

  it('foretrekker winningLine-seier hvis begge betingelser er sanne', () => {
    const G = baseG();
    // Spiller 0 har en vinnende rad og dominerer (alt annet destroyed).
    [0, 1, 2, 3].forEach((i) => {
      G.cells[i] = '0';
    });
    for (let i = 4; i < TOTAL_CELLS; i++) G.destroyed[i] = true;

    const result = endIf({ G, ctx: stubCtx });

    expect(result.winner).toBe('0');
    expect(result.winningLine).toEqual([0, 1, 2, 3]);
  });

  it('avslutter ikke spillet hvis det fortsatt finnes tomme celler', () => {
    const G = baseG();
    // Spiller 0 eier én celle, motstander eier 0, men resten er tomme.
    G.cells[0] = '0';

    expect(endIf({ G, ctx: stubCtx })).toBeUndefined();
  });
});

describe('endIf: vinner er eieren av linjen', () => {
  it('velger linjens eier, ikke spilleren som har turen', () => {
    const G = baseG();
    [0, 1, 2, 3].forEach((i) => {
      G.cells[i] = '1';
    });

    const result = TicTacToe.endIf({ G, ctx: { currentPlayer: '0' } });

    expect(result.winner).toBe('1');
  });
});

describe('playerView', () => {
  const { playerView } = TicTacToe;
  const makeG = () => {
    const G = baseG();
    G.Rareium = [30, 70];
    G.strategicWeapon = ['Dirty Nuke', 'Artillery'];
    G.rareiumAtWeapon = [10, 20];
    return G;
  };

  it('skjuler motstanderens Rareium og våpen, men viser egne', () => {
    const view = playerView({ G: makeG(), playerID: '0' });

    expect(view.Rareium).toEqual([30, 0]);
    expect(view.strategicWeapon).toEqual(['Dirty Nuke', null]);
    expect(view.rareiumAtWeapon).toEqual([10, 0]);
  });

  it('endrer ikke selve spilltilstanden', () => {
    const G = makeG();
    playerView({ G, playerID: '1' });

    expect(G.Rareium).toEqual([30, 70]);
  });

  it('viser alt uten playerID', () => {
    const G = makeG();

    expect(playerView({ G, playerID: null })).toBe(G);
  });
});

describe('turn.onBegin: Rareium og våpentildeling', () => {
  const { onBegin } = TicTacToe.turn;
  const begin = (G, roll, die = 1) =>
    onBegin({
      G,
      ctx: { currentPlayer: '0' },
      random: { Number: () => roll, Die: () => die },
    });

  it('gir Rareium lik antall celler spilleren eier', () => {
    const G = baseG();
    [0, 1, 5].forEach((i) => {
      G.cells[i] = '0';
    });
    G.cells[2] = '1';

    begin(G, 0.99);

    expect(G.Rareium).toEqual([3, 0]);
  });

  it('nullstiller lastCellAttacked', () => {
    const G = baseG();
    G.lastCellAttacked = 4;

    begin(G, 0.99);

    expect(G.lastCellAttacked).toBeNull();
  });

  it('deler ut våpen og nullstiller Rareium når trekningen treffer', () => {
    const G = baseG();
    G.cells[0] = '0';
    G.Rareium[0] = 49;

    begin(G, 0, 4); // Die 4 gir det fjerde våpenet

    expect(G.strategicWeapon[0]).toBe('Dirty Nuke');
    expect(G.rareiumAtWeapon[0]).toBe(50);
    expect(G.Rareium[0]).toBe(0);
  });

  it('deler ikke ut våpen når trekningen bommer', () => {
    const G = baseG();
    G.cells[0] = '0';
    G.Rareium[0] = 49;

    begin(G, 0.99);

    expect(G.strategicWeapon[0]).toBeNull();
    expect(G.Rareium[0]).toBe(50);
  });

  it('deler ikke ut nytt våpen til en spiller som allerede har ett', () => {
    const G = baseG();
    G.cells[0] = '0';
    G.strategicWeapon[0] = 'Artillery';

    begin(G, 0, 4);

    expect(G.strategicWeapon[0]).toBe('Artillery');
    expect(G.Rareium[0]).toBe(1);
  });

  it('påvirker ikke motstanderens Rareium', () => {
    const G = baseG();
    G.cells[0] = '1';
    G.Rareium[1] = 10;

    begin(G, 0.99);

    expect(G.Rareium[1]).toBe(10);
  });
});

describe('clickCell: egen celle', () => {
  it('avviser trekk på en celle spilleren allerede eier', () => {
    const G = baseG();
    G.cells[3] = '0';

    const result = TicTacToe.moves.clickCell(
      { G, playerID: '0', random: { Number: () => 0 } },
      3,
    );

    expect(result).toBe(INVALID_MOVE);
  });
});

describe('loggoppføringer fra trekk og revolt', () => {
  const click = (G, id, roll, playerID = '0') =>
    TicTacToe.moves.clickCell(
      { G, playerID, random: { Number: () => roll } },
      id,
    );

  it('logger claim, conquer og fail med spiller og celle', () => {
    const G = baseG();
    click(G, 3, 1);
    G.cells[4] = '1';
    click(G, 4, 0);
    G.cells[5] = '1';
    click(G, 5, 0.99);

    expect(G.log.reverse()).toEqual([
      { type: 'claim', player: '0', cell: 3 },
      { type: 'conquer', player: '0', cell: 4 },
      { type: 'fail', player: '0', cell: 5 },
    ]);
  });

  it('logger revolt med forrige eier', () => {
    const G = baseG();
    G.cells[2] = '1';

    TicTacToe.turn.onEnd({ G, random: { Number: () => 0 } });

    expect(G.log[0]).toEqual({ type: 'revolt', player: '1', cell: 2 });
  });
});
