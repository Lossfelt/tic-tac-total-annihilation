import './ArtilleryAnimation.css';
import Explosion from './Explosion.jsx';
import { BOARD_UNITS } from './weaponAnimation.js';

// Artillery: et skall faller inn mot målcellen, et siktemerke viser hvor det
// lander, og eksplosjonen sprer seg til de fire naboene som en sjokkbølge.
// Tegnet som SVG og animert med CSS, i samme stil som de andre våpnene. Rute
// og tidspunkter kommer fra planArtillery().

const INK = '#1d1712';
const RED = '#ff5a3a';

// Skallet sett ovenfra, nesen mot høyre (+x), med røykspor bak.
function Shell() {
  return (
    <g>
      <path
        d="M-150 -5 L-14 -3 L-14 3 L-150 5Z"
        fill="#d8ccb0"
        opacity="0.22"
      />
      <path d="M-70 0 L-14 -3.5 L-14 3.5Z" fill="#ffb02e" opacity="0.5" />
      <path
        d="M20 0 C14 -5 4 -6 -14 -6 L-14 6 C4 6 14 5 20 0Z"
        fill="#5a5a3a"
        stroke={INK}
        strokeWidth="1"
      />
      <path
        d="M20 0 C17 -2.4 14 -4 10 -5 L10 5 C14 4 17 2.4 20 0Z"
        fill="#c75d3a"
      />
      <rect x="-8" y="-6" width="4" height="12" fill="#c9a227" />
      <path
        d="M8 -3.4 L-6 -4.4"
        stroke="#8a8a60"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <ellipse cx="-14" cy="0" rx="2" ry="4" fill="#ffd23a" />
    </g>
  );
}

// Dekker hele brettet og fanger alle klikk mens animasjonen spilles. Skal
// bare monteres mens animasjonen går: CSS-animasjonene starter ved montering.
export default function ArtilleryAnimation({ plan }) {
  const [center, ...neighbors] = plan.hits;
  return (
    <div
      className="ar-overlay"
      data-testid="artillery-animation"
      aria-hidden="true"
      style={{
        '--ar-dur': `${plan.durationMs}ms`,
        '--impact': `${plan.impactMs}ms`,
      }}
    >
      <svg viewBox={`0 0 ${BOARD_UNITS} ${BOARD_UNITS}`}>
        <rect
          className="ar-dim"
          width={BOARD_UNITS}
          height={BOARD_UNITS}
          fill="#1a0805"
        />
        <g className="ar-shake">
          <g className="ar-mark-area">
            {neighbors.map((n) => (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r="30"
                fill="none"
                stroke={RED}
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />
            ))}
          </g>
          <g transform={`translate(${center.x} ${center.y})`}>
            <g className="ar-mark">
              <circle
                r="46"
                fill="none"
                stroke={RED}
                strokeWidth="2"
                strokeDasharray="8 6"
              />
              <circle r="14" fill="none" stroke={RED} strokeWidth="2" />
              <path
                d="M-62 0 H-24 M24 0 H62 M0 -62 V-24 M0 24 V62"
                stroke={RED}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          </g>
          {plan.hits.map((hit, i) => (
            <Explosion
              key={hit.id}
              x={hit.x}
              y={hit.y}
              delay={hit.t}
              scale={hit.scale}
              variant={i}
            />
          ))}
          <g transform={`translate(${center.x} ${center.y})`}>
            <circle
              className="ar-wave"
              r="30"
              fill="none"
              stroke="#ffe9c0"
              strokeWidth="4"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              className="ar-wave ar-wave-late"
              r="30"
              fill="none"
              stroke="#ffd9a0"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
          <g
            className="ar-shell"
            style={{
              '--x0': `${plan.from.x}px`,
              '--y0': `${plan.from.y}px`,
              '--x1': `${plan.to.x}px`,
              '--y1': `${plan.to.y}px`,
            }}
          >
            <g transform={`rotate(${plan.angle})`}>
              <Shell />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
