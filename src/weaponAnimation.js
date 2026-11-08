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
const AIR_DURATION_MS = 3300;
// Hvor langt flyet starter og slutter utenfor første og siste celle.
const AIR_MARGIN_UNITS = 260;
// Hvor lenge bomben faller før den treffer.
export const BOMB_FALL_MS = 280;

const cellCenter = (id) => ({
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
  return null;
}
