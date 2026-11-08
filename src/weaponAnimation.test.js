import { describe, it, expect } from 'vitest';
import {
  planAirStrike,
  getWeaponTiming,
  NUKE_DURATION_MS,
  NUKE_IMPACT_MS,
} from './weaponAnimation.js';

describe('planAirStrike', () => {
  it('treffer cellene i rekkefølge langs linjen, med økende tidspunkt', () => {
    const { hits } = planAirStrike([4, 5, 6], 1);

    expect(hits.map((h) => h.id)).toEqual([4, 5, 6]);
    expect(hits[0].t).toBeLessThan(hits[1].t);
    expect(hits[1].t).toBeLessThan(hits[2].t);
  });

  it('snur retningen på partall-versjoner', () => {
    expect(planAirStrike([4, 5, 6], 2).hits.map((h) => h.id)).toEqual([
      6, 5, 4,
    ]);
  });

  it('sorterer målene selv om de ble valgt i tilfeldig rekkefølge', () => {
    expect(planAirStrike([6, 4, 5], 1).hits.map((h) => h.id)).toEqual([
      4, 5, 6,
    ]);
  });

  it.each([
    ['rad', [4, 5, 6], 0],
    ['kolonne', [1, 5, 9], 90],
    ['diagonal', [0, 5, 10], 45],
  ])('peker flyet langs %s', (_name, cells, angle) => {
    expect(planAirStrike(cells, 1).angle).toBeCloseTo(angle);
  });

  it('starter og slutter utenfor brettet, og er ferdig før animasjonen', () => {
    const plan = planAirStrike([4, 5, 6], 1);
    const outside = (p) => p.x < 0 || p.x > 400 || p.y < 0 || p.y > 400;

    expect(outside(plan.from)).toBe(true);
    expect(outside(plan.to)).toBe(true);
    expect(plan.hits.at(-1).t).toBeLessThan(plan.flightMs);
    expect(plan.flightMs).toBeLessThan(plan.durationMs);
  });
});

describe('getWeaponTiming', () => {
  it('gir fast tidslinje for Dirty Nuke', () => {
    const timing = getWeaponTiming({ type: 'Dirty Nuke', cells: [5] });

    expect(timing.durationMs).toBe(NUKE_DURATION_MS);
    expect(timing.impactMs).toBe(NUKE_IMPACT_MS);
    expect(timing.hits).toEqual([]);
  });

  it('bytter brettet rett etter siste treff for Air Strike', () => {
    const timing = getWeaponTiming({
      type: 'Air Strike',
      cells: [4, 5, 6],
      version: 1,
    });
    const lastHit = Math.max(...timing.hits.map((h) => h.t));

    expect(timing.hits).toHaveLength(3);
    expect(timing.impactMs).toBeGreaterThan(lastHit);
    expect(timing.impactMs).toBeLessThan(timing.durationMs);
  });

  it('gir null for våpen uten animasjon', () => {
    expect(getWeaponTiming({ type: 'Artillery', cells: [5] })).toBeNull();
  });
});
