import './AirStrikeAnimation.css';
import Puff from './Puff.jsx';
import { makeRng } from './rng.js';
import { BOARD_UNITS, BOMB_FALL_MS } from './weaponAnimation.js';

// Air Strike: et bombefly flyr langs de tre valgte cellene og slipper en
// bombe over hver. Tegnet som SVG og animert med CSS, i samme stil som
// NukeAnimation. Ruten og tidspunktene kommer fra planAirStrike().

const INK = '#1d1712';
const SMOKE_DARK = ['#3a2c24', '#5a483a', '#7a6652'];
const SMOKE_LIGHT = ['#4a3a30', '#6b5a4a', '#8a7762'];

// Flyet sett ovenfra, nesen mot høyre (+x).
const FUSELAGE =
  'M64 0 C60 -6 46 -9 24 -9.5 L-46 -4.5 L-64 -2 L-64 2 L-46 4.5 L24 9.5 C46 9 60 6 64 0Z';
const WING = 'M-12 -7 L0 -55 L20 -55 L22 -9 L22 9 L20 55 L0 55 L-12 7Z';
const TAIL = 'M-46 -24 L-34 -22 L-38 -1.5 L-38 1.5 L-34 22 L-46 24 L-42 0Z';

function Nacelle({ side }) {
  const y = side * 24;
  return (
    <g>
      <path
        d={`M-10 ${y - 2} L-24 ${y - 3} L-24 ${y + 0.5} L-10 ${y + 2}Z`}
        fill="#2a2420"
        opacity="0.55"
      />
      <rect
        x="-10"
        y={y - 7}
        width="38"
        height="14"
        rx="6"
        fill="#4a3d30"
        stroke={INK}
        strokeWidth="1.2"
      />
      <path
        d={`M-4 ${y - 4.5} H20`}
        stroke="#8a7860"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.6"
      />
      <ellipse
        cx="28"
        cy={y}
        rx="3"
        ry="7.5"
        fill="#8a7860"
        stroke={INK}
        strokeWidth="1"
      />
      <ellipse cx="33" cy={y} rx="2.5" ry="17" fill="#d8ccb0" opacity="0.4" />
      <path
        d={`M33 ${y - 17} V${y + 17}`}
        stroke="#2a2420"
        strokeWidth="1.4"
        opacity="0.5"
      />
      <circle
        cx="31"
        cy={y}
        r="3.2"
        fill="#c75d3a"
        stroke={INK}
        strokeWidth="0.8"
      />
    </g>
  );
}

function Roundel({ y }) {
  return (
    <g>
      <circle cx="8" cy={y} r="7" fill="#c75d3a" />
      <circle cx="8" cy={y} r="4.6" fill="#e8dcc0" />
      <circle cx="8" cy={y} r="2.2" fill="#c75d3a" />
    </g>
  );
}

function Plane() {
  return (
    <g transform="scale(1.3)">
      <g opacity="0.28" transform="translate(9 13)">
        <path d={WING} fill="#000" />
        <path d={FUSELAGE} fill="#000" />
        <path d={TAIL} fill="#000" />
      </g>
      <path d={TAIL} fill="#5e5040" stroke={INK} strokeWidth="1.2" />
      <path
        d="M-45 -20 L-41 -2 M-45 20 L-41 2"
        stroke="#3a3026"
        strokeWidth="0.9"
        fill="none"
      />
      <path d={WING} fill="#6a5a47" stroke={INK} strokeWidth="1.4" />
      <g stroke="#4a3d30" strokeWidth="0.9" fill="none">
        <path d="M10 -9 L12 -54 M10 9 L12 54" />
        <path d="M-1 -36 L10 -36 M-1 36 L10 36" />
        <path d="M-6 -20 L10 -20 M-6 20 L10 20" />
      </g>
      <path d="M0 -55 L20 -55 L20.6 -46 L-2 -46Z" fill="#c75d3a" />
      <path d="M0 55 L20 55 L20.6 46 L-2 46Z" fill="#c75d3a" />
      <Roundel y={-34} />
      <Roundel y={34} />
      <Nacelle side={-1} />
      <Nacelle side={1} />
      <path d={FUSELAGE} fill="#8a7860" stroke={INK} strokeWidth="1.4" />
      <path
        d="M-40 -5 V5 M-24 -6 V6 M-6 -8 V8 M40 -8.5 V8.5"
        stroke="#5e5040"
        strokeWidth="0.8"
      />
      <rect
        x="-18"
        y="-3.5"
        width="28"
        height="7"
        fill="#6f5f4b"
        stroke="#4a3d30"
        strokeWidth="0.8"
      />
      <path d="M-4 -3.5 V3.5" stroke="#4a3d30" strokeWidth="0.8" />
      <path d="M-62 -2.6 H-54 V2.6 H-62Z" fill="#c75d3a" />
      <path d="M-64 0 H-44" stroke={INK} strokeWidth="2" />
      <path
        d="M64 0 C62 -4 54 -6 48 -6 L48 6 C54 6 62 4 64 0Z"
        fill="#6b8fa3"
        stroke={INK}
        strokeWidth="0.8"
      />
      <path d="M56 -5.5 V5.5" stroke={INK} strokeWidth="0.7" />
      <path
        d="M30 -6 C36 -6.5 44 -5 46 0 C44 5 36 6.5 30 6Z"
        fill="#4a6c80"
        stroke={INK}
        strokeWidth="0.8"
      />
      <path
        d="M33 -3.5 C37 -4 41 -3 43 -1"
        stroke="#b8d4e0"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle
        cx="-26"
        cy="0"
        r="3.8"
        fill="#5e5040"
        stroke={INK}
        strokeWidth="0.8"
      />
      <path
        d="M-26 0 H-34"
        stroke={INK}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </g>
  );
}

// Tre varianter av eksplosjon, så de tre treffene ikke ser helt like ut.
function buildBoom(seed) {
  const rand = makeRng(seed);
  const between = (a, b) => a + (b - a) * rand();
  const polar = (min, max) => {
    const angle = between(0, 6.283);
    const dist = between(min, max);
    return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist };
  };

  const fire = [];
  [
    { n: 7, f: 1, r: [12, 18] },
    { n: 5, f: 0.55, r: [12, 17] },
    { n: 1, f: 0, r: [14, 16] },
  ].forEach((ring) => {
    for (let i = 0; i < ring.n; i++) {
      const angle = (i / ring.n) * 6.283 + between(-0.3, 0.3);
      const x = Math.cos(angle) * 24 * ring.f;
      const y = Math.sin(angle) * 24 * ring.f;
      fire.push({
        x,
        y,
        r: between(ring.r[0], ring.r[1]),
        t: Math.min(1, Math.hypot(x, y) / 30),
      });
    }
  });
  fire.sort((a, b) => b.t - a.t);

  return {
    fire,
    smoke: Array.from({ length: 8 }, (_, i) => ({
      x: between(-16, 16),
      y: between(-12, 12),
      r: between(12, 20),
      sx: between(-46, 46),
      sy: between(-78, -26),
      delay: i * 45,
      colors: i % 2 ? SMOKE_DARK : SMOKE_LIGHT,
    })),
    debris: Array.from({ length: 9 }, (_, i) => ({
      ...polar(42, 86),
      rot: between(-420, 420),
      size: between(0.8, 1.6),
      fill: i % 3 === 0 ? '#e8791f' : '#3a2a20',
    })),
    sparks: Array.from({ length: 12 }, () => ({
      ...polar(55, 105),
      r: between(1.2, 2.4),
    })),
    streaks: Array.from({ length: 7 }, () => {
      const { dx, dy } = polar(34, 52);
      return { x: dx, y: dy };
    }),
  };
}

const BOOMS = [buildBoom(3), buildBoom(7), buildBoom(13)];

// Bombe som faller mot cellen, så eksplosjon med lysglimt, ildkule, sjokkring,
// skrot, gnister og røyk. --d er tidspunktet for treffet.
function Boom({ hit, bombOffset, index }) {
  const boom = BOOMS[index % BOOMS.length];
  return (
    <g
      transform={`translate(${hit.x} ${hit.y})`}
      style={{ '--d': `${hit.t}ms` }}
    >
      <g className="as-scorch">
        <ellipse rx="37" ry="33" fill="#1a0805" transform="rotate(20)" />
        <ellipse rx="24" ry="20" fill="#2e1008" transform="rotate(-15)" />
        {boom.streaks.map((s, i) => (
          <line
            key={i}
            x2={s.x}
            y2={s.y}
            stroke="#1a0805"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.5"
          />
        ))}
      </g>
      <g
        className="as-bomb"
        style={{
          '--d': `${hit.t - BOMB_FALL_MS}ms`,
          '--ox': `${bombOffset.x}px`,
          '--oy': `${bombOffset.y}px`,
        }}
      >
        <path
          d="M10 0 C10 -4 4 -5 -6 -5 L-10 -3 L-10 3 L-6 5 C4 5 10 4 10 0Z"
          fill="#2e2823"
          stroke="#1a1511"
          strokeWidth="1"
        />
        <path d="M6 -2.5 L-4 -3.4" stroke="#6b5f50" strokeWidth="1" />
        <path d="M-10 -3 L-16 -8 L-16 8 L-10 3Z" fill="#c75d3a" />
      </g>
      <circle className="as-flash" r="60" fill="#fff3b0" />
      <g className="as-fire">
        {boom.fire.map((p, i) => (
          <Puff key={i} x={p.x} y={p.y} r={p.r} t={p.t} />
        ))}
      </g>
      <circle
        className="as-ring"
        r="44"
        fill="none"
        stroke="#ffd9a0"
        strokeWidth="4"
      />
      <circle
        className="as-ring as-ring-late"
        r="44"
        fill="none"
        stroke="#ffe9c0"
        strokeWidth="2"
      />
      {boom.debris.map((d, i) => (
        <g
          key={i}
          className="as-debris"
          style={{
            '--dx': `${d.dx}px`,
            '--dy': `${d.dy}px`,
            '--rot': `${d.rot}deg`,
          }}
        >
          <path
            d="M-3 -2 L3 -3 L4 2 L-2 3Z"
            transform={`scale(${d.size.toFixed(2)})`}
            fill={d.fill}
          />
        </g>
      ))}
      {boom.sparks.map((s, i) => (
        <circle
          key={i}
          className="as-spark"
          r={s.r}
          fill="#ffd23a"
          style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px` }}
        />
      ))}
      {boom.smoke.map((s, i) => (
        <g
          key={i}
          className="as-smoke"
          style={{
            '--sx': `${s.sx}px`,
            '--sy': `${s.sy}px`,
            '--x': `${s.delay}ms`,
          }}
        >
          <Puff x={s.x} y={s.y} r={s.r} colors={s.colors} />
        </g>
      ))}
    </g>
  );
}

// Dekker hele brettet og fanger alle klikk mens animasjonen spilles. Skal
// bare monteres mens animasjonen går: CSS-animasjonene starter ved montering.
export default function AirStrikeAnimation({ plan }) {
  return (
    <div
      className="as-overlay"
      data-testid="air-strike-animation"
      aria-hidden="true"
      style={{ '--as-dur': `${plan.durationMs}ms` }}
    >
      <svg viewBox={`0 0 ${BOARD_UNITS} ${BOARD_UNITS}`}>
        <rect
          className="as-dim"
          width={BOARD_UNITS}
          height={BOARD_UNITS}
          fill="#1a0805"
        />
        {plan.hits.map((hit, i) => (
          <Boom key={hit.id} hit={hit} bombOffset={plan.bombOffset} index={i} />
        ))}
        <g
          className="as-plane"
          style={{
            '--x0': `${plan.from.x}px`,
            '--y0': `${plan.from.y}px`,
            '--x1': `${plan.to.x}px`,
            '--y1': `${plan.to.y}px`,
            '--fly': `${plan.flightMs}ms`,
          }}
        >
          <g transform={`rotate(${plan.angle})`}>
            <Plane />
          </g>
        </g>
      </svg>
    </div>
  );
}
