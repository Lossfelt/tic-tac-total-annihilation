import { GetNeighbors, GetSurroundingCells } from './Game.js';

// Tidsrammer og geometri for våpenanimasjonene. Brukes både av
// useWeaponAnimation (som styrer når brettet byttes og når klikk igjen er
// tillatt) og av animasjonskomponentene, slik at alt går i takt.

// Dirty Nuke. Varigheten brukes også av CSS via --nk-dur.
export const NUKE_DURATION_MS = 5500;

// Når brettet bytter fra "før" til "etter". Skal ligge på toppen av
// lysglimtet (ca. 5 % av varigheten), så spilleren ikke ser cellene forsvinne.
export const NUKE_IMPACT_MS = 300;

// Air Strike. Brettet tegnes som 4x4 ruter på 100 enheter hver.
export const BOARD_UNITS = 400;
const CELL_UNITS = BOARD_UNITS / 4;
// Hvor lenge flyet er i luften, fra det går inn til det er ute av bildet.
const AIR_FLIGHT_MS = 2200;
// Hele animasjonen, inkludert røyk som sprer seg etter siste treff.
const AIR_DURATION_MS = 4000;
// Hvor langt flyet starter og slutter utenfor første og siste celle.
const AIR_MARGIN_UNITS = 260;
// Hvor lenge bomben faller før den treffer.
export const BOMB_FALL_MS = 280;

export const cellCenter = (id) => ({
  x: ((id % 4) + 0.5) * CELL_UNITS,
  y: (Math.floor(id / 4) + 0.5) * CELL_UNITS,
});

// Flyrute og treffpunkter for Air Strike. Flyet følger linjen mellom de tre
// cellene og slipper en bombe over hver. Retningen veksler med versjonen, som
// alle klienter har felles, så begge spillere ser samme fly.
export function planAirStrike(cells, version) {
  const ids = [...cells].sort((a, b) => a - b);
  if (version % 2 === 0) ids.reverse();
  const points = ids.map(cellCenter);
  const dx = points[2].x - points[0].x;
  const dy = points[2].y - points[0].y;
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;
  const total = length + 2 * AIR_MARGIN_UNITS;
  const speed = total / AIR_FLIGHT_MS;

  const hits = ids.map((id, i) => {
    const along = Math.hypot(
      points[i].x - points[0].x,
      points[i].y - points[0].y,
    );
    return {
      id,
      x: points[i].x,
      y: points[i].y,
      t: Math.round((AIR_MARGIN_UNITS + along) / speed),
    };
  });

  return {
    from: {
      x: points[0].x - ux * AIR_MARGIN_UNITS,
      y: points[0].y - uy * AIR_MARGIN_UNITS,
    },
    to: {
      x: points[2].x + ux * AIR_MARGIN_UNITS,
      y: points[2].y + uy * AIR_MARGIN_UNITS,
    },
    angle: (Math.atan2(uy, ux) * 180) / Math.PI,
    // Hvor langt flyet rekker å fly mens bomben faller.
    bombOffset: {
      x: -ux * speed * BOMB_FALL_MS,
      y: -uy * speed * BOMB_FALL_MS,
    },
    hits,
    flightMs: AIR_FLIGHT_MS,
    durationMs: AIR_DURATION_MS,
  };
}

// Artillery. Skallet faller inn mot målcellen og rammer den og de fire
// naboene. Naboene går av litt etter, som en sjokkbølge.
const ART_IMPACT_MS = 1000;
const ART_NEIGHBOR_DELAY_MS = 130;
const ART_DURATION_MS = 4200;
// Hvor langt utenfor målet skallet starter.
const ART_START_UNITS = 520;

// Rute og treffpunkter for Artillery. Skallet kommer fra et hjørne som
// veksler med versjonen, som alle klienter har felles.
export function planArtillery(cells, version) {
  const center = cells[0];
  const target = cellCenter(center);
  const comesFrom = ((version % 4) * 90 + 45) * (Math.PI / 180);
  const ux = Math.cos(comesFrom);
  const uy = Math.sin(comesFrom);
  const hit = (id, t, scale) => ({ id, ...cellCenter(id), t, scale });

  return {
    from: {
      x: target.x + ux * ART_START_UNITS,
      y: target.y + uy * ART_START_UNITS,
    },
    to: target,
    // Skallet tegnes med nesen mot +x, så det snus mot bevegelsen.
    angle: (comesFrom * 180) / Math.PI + 180,
    hits: [
      hit(center, ART_IMPACT_MS, 1.15),
      ...GetNeighbors(center).map((id) =>
        hit(id, ART_IMPACT_MS + ART_NEIGHBOR_DELAY_MS, 0.8),
      ),
    ],
    impactMs: ART_IMPACT_MS,
    durationMs: ART_DURATION_MS,
  };
}

// Biological Warfare. En beholder faller på målet og gassen sprer seg over
// 3x3-området (ferdig ca. 1,7 s). Først da vises hvilke celler serveren har
// valgt å ramme, og de tømmes, de nærmeste først.
const BIO_IMPACT_MS = 900;
const BIO_HIT_BASE_MS = 1800;
const BIO_HIT_STEP_MS = 260;
const BIO_DURATION_MS = 4400;

// Område og treffpunkter for Biological Warfare. `affected` er cellene
// serveren faktisk rammet (tilfeldig), og kan være tom.
export function planBio(cells, affected = []) {
  const center = cellCenter(cells[0]);
  const hits = affected.map((id) => {
    const point = cellCenter(id);
    const distance = Math.hypot(point.x - center.x, point.y - center.y);
    return {
      id,
      ...point,
      t: Math.round(
        BIO_HIT_BASE_MS + (distance / CELL_UNITS) * BIO_HIT_STEP_MS,
      ),
    };
  });
  return {
    center,
    from: { x: center.x + 60, y: center.y - 240 },
    area: GetSurroundingCells(cells[0]).map((id) => ({
      id,
      ...cellCenter(id),
    })),
    hits,
    impactMs: BIO_IMPACT_MS,
    durationMs: BIO_DURATION_MS,
  };
}

// Tidslinjen for en våpenhendelse, eller null hvis våpenet ikke har animasjon.
//   impactMs: når brettet bytter fra "før" til "etter"
//   hits: celler som tømmes underveis, hver på sitt tidspunkt (ms)
export function getWeaponTiming(event) {
  if (event.type === 'Dirty Nuke') {
    return {
      type: event.type,
      durationMs: NUKE_DURATION_MS,
      impactMs: NUKE_IMPACT_MS,
      hits: [],
    };
  }
  if (event.type === 'Air Strike') {
    const plan = planAirStrike(event.cells, event.version);
    const lastHit = Math.max(...plan.hits.map((h) => h.t));
    return {
      type: event.type,
      durationMs: plan.durationMs,
      impactMs: lastHit + 60,
      hits: plan.hits.map(({ id, t }) => ({ id, t })),
      plan,
    };
  }
  if (event.type === 'Artillery') {
    const plan = planArtillery(event.cells, event.version);
    const lastHit = Math.max(...plan.hits.map((h) => h.t));
    return {
      type: event.type,
      durationMs: plan.durationMs,
      impactMs: lastHit + 60,
      hits: plan.hits.map(({ id, t }) => ({ id, t })),
      plan,
    };
  }
  if (event.type === 'Biological Warfare') {
    const plan = planBio(event.cells, event.affected);
    const lastHit = Math.max(BIO_HIT_BASE_MS, ...plan.hits.map((h) => h.t));
    return {
      type: event.type,
      durationMs: plan.durationMs,
      impactMs: lastHit + 60,
      hits: plan.hits.map(({ id, t }) => ({ id, t })),
      plan,
    };
  }
  return null;
}
