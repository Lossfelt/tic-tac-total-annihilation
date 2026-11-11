import { describe, it, expect, afterEach } from 'vitest';
import { resetRules, RULES } from './rules.js';
import {
  shapeAllows,
  strengthAttack,
  growStrength,
  canReinforce,
} from './strengthRules.js';
import { runRevolts } from './revoltRules.js';

// Brett som tekst, fire rader: '.' tom, '0' og '1' eier. Styrke 1 overalt.
function makeG(rows) {
  const cells = rows
    .join('')
    .split('')
    .map((c) => (c === '.' ? null : c));
  return {
    cells,
    strength: cells.map((c) => (c === null ? 0 : 1)),
    attacked: cells.map(() => false),
    immune: cells.map(() => false),
    unrest: cells.map(() => null),
    lastCellAttacked: null,
  };
}

describe('knipetang og forankring', () => {
  afterEach(() => resetRules());

  it('knipetang krever to egne naboer, rett ut eller diagonalt', () => {
    const G = makeG(['0...', '.1..', '0...', '....']);
    resetRules({ pincer: 4 });
    expect(shapeAllows(G, 5, '0')).toBe(false);
    resetRules({ pincer: 8 });
    expect(shapeAllows(G, 5, '0')).toBe(true);
  });

  it('attrition: angrepet treffer alltid og koster angriperen 1', () => {
    resetRules({ strength: 'attrition' });
    const G = makeG(['01..', '....', '....', '....']);
    G.strength[0] = 3;
    G.strength[1] = 2;
    expect(strengthAttack(G, 1, '0', 0.99)).toBe('hit');
    expect(G.strength).toEqual(expect.arrayContaining([2, 1]));
    expect(strengthAttack(G, 1, '0', 0.99)).toBe('conquer');
    expect(G.cells[1]).toBe('0');
    expect(G.cells[0]).toBe('0');
    expect(G.strength[0]).toBe(1);
  });

  it('risk: en bom koster den angripende cellen', () => {
    resetRules({ strength: 'risk' });
    const G = makeG(['01..', '....', '....', '....']);
    expect(strengthAttack(G, 1, '0', 0.99)).toBe('fail');
    expect(G.cells[0]).toBeNull();
  });

  it('celler vokser bare når de ikke ble angrepet', () => {
    resetRules({ strength: 'click', reinforce: true });
    const G = makeG(['00..', '....', '....', '....']);
    G.attacked[1] = true;
    growStrength(G, '0');
    expect(G.strength.slice(0, 2)).toEqual([2, 1]);
    expect(G.attacked[1]).toBe(false);
    expect(canReinforce(G, 0)).toBe(true);
  });
});

describe('forsinket revolt', () => {
  afterEach(() => resetRules());

  it('uro varsles og går tapt etter eierens neste tur', () => {
    resetRules({ revolt: 'delayed', revoltChance: 1 });
    const G = makeG(['0...', '....', '....', '....']);
    const lost = [];
    const hooks = { lost: (i) => lost.push(i), unrest: () => {} };
    const always = { Number: () => 0 };
    runRevolts(G, { currentPlayer: '1', turn: 1 }, always, hooks);
    expect(G.unrest[0]).toBe(1);
    expect(lost).toEqual([]);
    runRevolts(G, { currentPlayer: '0', turn: 2 }, always, hooks);
    expect(lost).toEqual([0]);
    expect(RULES.revolt).toBe('delayed');
  });
});
