import { describe, it, expect, afterEach } from 'vitest';
import {
  RULES,
  resetRules,
  invasionChance,
  applyInvasion,
  consolidate,
  countedCells,
  markOrigin,
  mayRevolt,
  INVASION_SUCCESS_CHANCE,
} from './invasionRules.js';

const makeG = (cells) => ({
  cells: [...cells],
  fresh: cells.map(() => false),
  immune: cells.map(() => false),
  origin: cells.map(() => null),
});

describe('invasionRules', () => {
  afterEach(() => resetRules());

  it('standardreglene gir angriperen cellen med vanlig sjanse', () => {
    const G = makeG(['1', null]);
    expect(invasionChance(G, 0, '0')).toBe(INVASION_SUCCESS_CHANCE);
    applyInvasion(G, 0, '0');
    expect(G.cells[0]).toBe('0');
    expect(G.fresh[0]).toBe(false);
  });

  it('fortify: fersk okkupasjon teller ikke før angriperens tur', () => {
    resetRules({ invasion: 'fortify' });
    const G = makeG(['1', null]);
    applyInvasion(G, 0, '0');
    expect(countedCells(G)[0]).toBeNull();
    consolidate(G, '1');
    expect(G.fresh[0]).toBe(true);
    consolidate(G, '0');
    expect(countedCells(G)[0]).toBe('0');
  });

  it('gjenerobring av fersk celle gjenoppretter den og kan gi immunitet', () => {
    resetRules({ invasion: 'fortify', freshRetake: 0.75, immunity: true });
    const G = makeG(['1']);
    applyInvasion(G, 0, '0');
    expect(invasionChance(G, 0, '1')).toBe(0.75);
    applyInvasion(G, 0, '1');
    expect(G.fresh[0]).toBe(false);
    expect(G.immune[0]).toBe(true);
    consolidate(G, '0');
    expect(G.immune[0]).toBe(true);
    consolidate(G, '1');
    expect(G.immune[0]).toBe(false);
  });

  it('opprinnelig eier får egen sjanse og revolt kan begrenses', () => {
    resetRules({ originRetake: 0.75, revolt: 'occupied' });
    const G = makeG([null]);
    markOrigin(G, 0, '0');
    markOrigin(G, 0, '1');
    expect(G.origin[0]).toBe('0');
    G.cells[0] = '0';
    expect(mayRevolt(G, 0)).toBe(false);
    G.cells[0] = '1';
    expect(mayRevolt(G, 0)).toBe(true);
    expect(invasionChance(G, 0, '0')).toBe(0.75);
    expect(RULES.revolt).toBe('occupied');
  });
});
