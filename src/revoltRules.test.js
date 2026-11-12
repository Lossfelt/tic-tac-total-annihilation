import { describe, it, expect, afterEach } from 'vitest';
import { resetRules } from './rules.js';
import { isIsolated, mayRevolt, runRevolts } from './revoltRules.js';
import { attack, countedCells } from './invasionRules.js';

// Brett som tekst, fire rader: '.' tom, '0' og '1' eier.
function makeG(rows) {
  const cells = rows
    .join('')
    .split('')
    .map((c) => (c === '.' ? null : c));
  return {
    cells,
    unrest: cells.map(() => null),
    fresh: cells.map(() => false),
    immune: cells.map(() => false),
    lastCellAttacked: null,
  };
}

const always = { Number: () => 0 };

describe('revolt-varianter', () => {
  afterEach(() => resetRules());

  it('isolasjon: bare celler uten egne naboer kan gjøre opprør', () => {
    resetRules({ revoltIsolated: 4 });
    const G = makeG(['00..', '....', '..0.', '...1']);
    expect(isIsolated(G, 0)).toBe(false);
    expect(mayRevolt(G, 0)).toBe(false);
    expect(mayRevolt(G, 10)).toBe(true);
    resetRules({ revoltIsolated: 8 });
    expect(mayRevolt(G, 15)).toBe(true);
    G.cells[10] = '1';
    expect(mayRevolt(G, 15)).toBe(false);
  });

  it('okkupert land: erobret celle får uro og teller ikke for seier', () => {
    resetRules({ conquestUnrest: 'nocount', revoltChance: 0 });
    const G = makeG(['0001', '....', '....', '....']);
    expect(attack(G, 3, '0', 0, 5)).toBe('conquer');
    expect(G.unrest[3]).toBe(5);
    expect(countedCells(G)[3]).toBeNull();
    const lost = [];
    const hooks = { lost: (i) => lost.push(i), unrest: () => {} };
    runRevolts(G, { currentPlayer: '0', turn: 5 }, always, hooks);
    expect(lost).toEqual([]);
    runRevolts(G, { currentPlayer: '0', turn: 7 }, always, hooks);
    expect(lost).toEqual([3]);
  });
});
