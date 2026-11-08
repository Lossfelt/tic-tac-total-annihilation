import './AirStrikeAnimation.css';
import { BOARD_UNITS, BOMB_FALL_MS } from './weaponAnimation.js';

// Air Strike: et bombefly flyr langs de tre valgte cellene og slipper en
// bombe over hver. Tegnet som SVG og animert med CSS, i samme stil som
// NukeAnimation. Ruten og tidspunktene kommer fra planAirStrike().

const SMOKE = [
  { cx: -14, cy: -6, r: 16, sx: -30, sy: -46, delay: 0, fill: '#5a463a' },
  { cx: 12, cy: -10, r: 20, sx: 26, sy: -60, delay: 60, fill: '#7a6452' },
  { cx: 0, cy: 8, r: 18, sx: -8, sy: -40, delay: 120, fill: '#5a463a' },
  { cx: -20, cy: 6, r: 13, sx: -40, sy: -30, delay: 180, fill: '#7a6452' },
  { cx: 20, cy: 4, r: 14, sx: 38, sy: -34, delay: 240, fill: '#5a463a' },
];

// Flyet sett ovenfra, nesen mot høyre.
function Plane() {
  return (
    <g transform="scale(1.3)">
      <g opacity="0.28" transform="translate(8 12)">
        <path d="M-4 -52 L14 -52 L22 0 L14 52 L-4 52 L6 0Z" fill="#000" />
        <path d="M-50 -7 Q-58 0 -50 7 L40 5 Q62 0 40 -5Z" fill="#000" />
      </g>
      <path
        d="M-46 -22 L-34 -22 L-38 0 L-34 22 L-46 22 L-42 0Z"
        fill="#5e5040"
        stroke="#1d1712"
        strokeWidth="1.5"
      />
      <path
        d="M-4 -52 L14 -52 L22 0 L14 52 L-4 52 L6 0Z"
        fill="#6a5a47"
        stroke="#1d1712"
        strokeWidth="1.5"
      />
      <circle cx="6" cy="-38" r="5" fill="#c75d3a" />
      <circle cx="6" cy="38" r="5" fill="#c75d3a" />
      <ellipse cx="12" cy="-26" rx="9" ry="5" fill="#3a3026" />
      <ellipse cx="12" cy="26" rx="9" ry="5" fill="#3a3026" />
      <ellipse cx="22" cy="-26" rx="2" ry="11" fill="#cfc3a8" opacity="0.5" />
      <ellipse cx="22" cy="26" rx="2" ry="11" fill="#cfc3a8" opacity="0.5" />
      <path
        d="M-50 -7 Q-58 0 -50 7 L40 5 Q62 0 40 -5Z"
        fill="#8a7860"
        stroke="#1d1712"
        strokeWidth="1.5"
      />
      <ellipse cx="30" cy="0" rx="8" ry="4" fill="#4a6c80" />
    </g>
  );
}

// Bombe som faller mot cellen, så eksplosjon med lysglimt, ildkule,
// sjokkring og røyk. --d er tidspunktet for treffet.
function Boom({ hit, bombOffset }) {
  return (
    <g
      transform={`translate(${hit.x} ${hit.y})`}
      style={{ '--d': `${hit.t}ms` }}
    >
      <circle className="as-scorch" r="34" fill="#1a0805" />
      <g
        className="as-bomb"
        style={{
          '--d': `${hit.t - BOMB_FALL_MS}ms`,
          '--ox': `${bombOffset.x}px`,
          '--oy': `${bombOffset.y}px`,
        }}
      >
        <ellipse rx="9" ry="4" fill="#2a2420" />
        <path d="M-9 -5 L-14 -8 L-14 8 L-9 5Z" fill="#c75d3a" />
      </g>
      <circle className="as-flash" r="60" fill="#fff3b0" />
      <g className="as-fire">
        <circle r="34" fill="#e8791f" />
        <circle cx="-3" cy="-4" r="26" fill="#fbb630" />
        <circle cx="-6" cy="-8" r="14" fill="#fff3b0" />
      </g>
      <circle
        className="as-ring"
        r="44"
        fill="none"
        stroke="#ffd9a0"
        strokeWidth="4"
      />
      {SMOKE.map((s, i) => (
        <circle
          key={i}
          className="as-smoke"
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill={s.fill}
          style={{
            '--sx': `${s.sx}px`,
            '--sy': `${s.sy}px`,
            '--x': `${s.delay}ms`,
          }}
        />
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
        {plan.hits.map((hit) => (
          <Boom key={hit.id} hit={hit} bombOffset={plan.bombOffset} />
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
