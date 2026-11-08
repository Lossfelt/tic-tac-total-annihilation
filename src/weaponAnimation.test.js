import { describe, it, expect } from 'vitest';
import {
  planAirStrike,
  planArtillery,
  planBio,
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
    expect(getWeaponTiming({ type: 'Recycle', cells: [5] })).toBeNull();
  });
});

describe('planArtillery', () => {
  it('rammer målet og alle fire naboene i midten av brettet', () => {
    const { hits } = planArtillery([5], 1);

    expect(hits.map((h) => h.id).sort((a, b) => a - b)).toEqual([
      1, 4, 5, 6, 9,
    ]);
  });

  it('rammer bare de naboene som finnes i et hjørne', () => {
    const ids = planArtillery([0], 1).hits.map((h) => h.id);

    expect(ids.sort((a, b) => a - b)).toEqual([0, 1, 4]);
  });

  it('treffer målet først og naboene litt etter, større i midten', () => {
    const { hits } = planArtillery([5], 1);
    const [center, ...neighbors] = hits;

    expect(center.id).toBe(5);
    expect(neighbors.every((n) => n.t > center.t)).toBe(true);
    expect(neighbors.every((n) => n.scale < center.scale)).toBe(true);
  });

  it('lar skallet komme fra ulike retninger for ulike versjoner', () => {
    const froms = [1, 2, 3, 4].map((v) => {
      const { from } = planArtillery([5], v);
      return `${Math.round(from.x)},${Math.round(from.y)}`;
    });

    expect(new Set(froms).size).toBe(4);
  });

  it('starter utenfor brettet og lander på målcellen', () => {
    const { from, to } = planArtillery([5], 1);

    expect(from.x < 0 || from.x > 400 || from.y < 0 || from.y > 400).toBe(true);
    expect(to).toEqual({ x: 150, y: 150 });
  });
});

describe('getWeaponTiming: Artillery', () => {
  it('bytter brettet rett etter at siste nabo er truffet', () => {
    const timing = getWeaponTiming({
      type: 'Artillery',
      cells: [5],
      version: 1,
    });
    const lastHit = Math.max(...timing.hits.map((h) => h.t));

    expect(timing.hits).toHaveLength(5);
    expect(timing.impactMs).toBeGreaterThan(lastHit);
    expect(timing.impactMs).toBeLessThan(timing.durationMs);
  });
});

describe('planBio', () => {
  it('dekker 3x3-området rundt målet', () => {
    const { area } = planBio([5], []);

    expect(area.map((a) => a.id).sort((a, b) => a - b)).toEqual([
      0, 1, 2, 4, 5, 6, 8, 9, 10,
    ]);
  });

  it('dekker bare cellene som finnes når målet er i et hjørne', () => {
    expect(planBio([0], []).area).toHaveLength(4);
  });

  it('har treff bare for cellene serveren rammet', () => {
    const { hits } = planBio([5], [4, 6, 10]);

    expect(hits.map((h) => h.id)).toEqual([4, 6, 10]);
  });

  it('rammer nære celler før fjerne', () => {
    const { hits } = planBio([5], [10, 4]);
    const byId = Object.fromEntries(hits.map((h) => [h.id, h.t]));

    expect(byId[4]).toBeLessThan(byId[10]);
  });

  it('håndterer at ingen celler ble rammet', () => {
    expect(planBio([5], []).hits).toEqual([]);
    expect(planBio([5]).hits).toEqual([]);
  });
});

describe('getWeaponTiming: Biological Warfare', () => {
  it('bytter brettet rett etter siste treff', () => {
    const timing = getWeaponTiming({
      type: 'Biological Warfare',
      cells: [5],
      affected: [4, 6, 10],
    });
    const lastHit = Math.max(...timing.hits.map((h) => h.t));

    expect(timing.hits).toHaveLength(3);
    expect(timing.impactMs).toBeGreaterThan(lastHit);
    expect(timing.impactMs).toBeLessThan(timing.durationMs);
  });

  it('har en gyldig tidslinje selv uten treff', () => {
    const timing = getWeaponTiming({
      type: 'Biological Warfare',
      cells: [5],
      affected: [],
    });

    expect(timing.hits).toEqual([]);
    expect(Number.isFinite(timing.impactMs)).toBe(true);
  });
});
