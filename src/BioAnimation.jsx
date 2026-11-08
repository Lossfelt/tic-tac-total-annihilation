import './BioAnimation.css';
import { useMemo } from 'react';
import Puff from './Puff.jsx';
import { makeRng } from './rng.js';
import { BOARD_UNITS } from './weaponAnimation.js';

// Biological Warfare: en beholder faller ned over målcellen og sprekker, og en
// giftig gassky brer seg over 3x3-området. Cellene som faktisk blir rammet
// (tilfeldig, bestemt av serveren) får et giftmerke og tømmes etter hvert som
// gassen når dem. Tegnet som SVG og animert med CSS. Rute og tidspunkter
// kommer fra planBio().

const INK = '#1d1712';
const GAS = [
  ['#2f6a22', '#5fae38', '#a8e068'],
  ['#3f7d2a', '#7fbf3f', '#c4ec7a'],
  ['#285a1c', '#4f8f2f', '#8fcf50'],
];
const GLOW = '#d8ff7a';

// Gasspuffer fordelt over hver celle i området, som sprer seg ut fra målet.
function buildGas(area, center) {
  const puffs = [];
  area.forEach((cell) => {
    const rand = makeRng(100 + cell.id);
    const between = (a, b) => a + (b - a) * rand();
    for (let i = 0; i < 3; i++) {
      const x = cell.x + between(-34, 34);
      const y = cell.y + between(-34, 34);
      puffs.push({
        x,
        y,
        r: between(20, 34),
        sx: -(x - center.x) * 0.85,
        sy: -(y - center.y) * 0.85,
        delay: Math.round(between(0, 300)),
        colors: GAS[puffs.length % GAS.length],
        sway: puffs.length % 2 ? 'a' : 'b',
      });
    }
  });
  return puffs;
}

// Giftmerke, tegnet som tre sammenflettede ringer rundt et senter.
function Biohazard() {
  return (
    <g fill="none" stroke={GLOW} strokeWidth="3">
      {[0, 120, 240].map((angle) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        return (
          <circle
            key={angle}
            cx={Math.cos(rad) * 11}
            cy={Math.sin(rad) * 11}
            r="10"
          />
        );
      })}
      <circle r="4" fill={GLOW} />
    </g>
  );
}

const BUBBLES = [
  { x: -16, y: 6, bx: -8, delay: 0 },
  { x: 14, y: 10, bx: 10, delay: 120 },
  { x: -6, y: -12, bx: -4, delay: 240 },
  { x: 20, y: -6, bx: 14, delay: 340 },
  { x: -22, y: -4, bx: -14, delay: 460 },
];

function Canister() {
  return (
    <g>
      <circle r="16" fill="#5e6e34" stroke={INK} strokeWidth="1.5" />
      <path
        d="M-12 -4 L12 4 M-12 4 L12 -4"
        stroke="#e0d33a"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle r="5" fill="#2a3318" stroke={INK} strokeWidth="1" />
      <path
        d="M-9 -10 A12 12 0 0 1 2 -13"
        stroke="#c4d68a"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
    </g>
  );
}

// Dekker hele brettet og fanger alle klikk mens animasjonen spilles. Skal
// bare monteres mens animasjonen går: CSS-animasjonene starter ved montering.
export default function BioAnimation({ plan }) {
  const gas = useMemo(
    () => buildGas(plan.area, plan.center),
    [plan.area, plan.center],
  );
  return (
    <div
      className="bw-overlay"
      data-testid="bio-animation"
      aria-hidden="true"
      style={{
        '--bw-dur': `${plan.durationMs}ms`,
        '--impact': `${plan.impactMs}ms`,
      }}
    >
      <svg viewBox={`0 0 ${BOARD_UNITS} ${BOARD_UNITS}`}>
        <rect
          className="bw-dim"
          width={BOARD_UNITS}
          height={BOARD_UNITS}
          fill="#0c1a08"
        />
        <g transform={`translate(${plan.center.x} ${plan.center.y})`}>
          <circle className="bw-shadow" r="22" fill="#000" />
        </g>
        {gas.map((p, i) => (
          <g
            key={i}
            className="bw-puff"
            style={{
              '--sx': `${p.sx}px`,
              '--sy': `${p.sy}px`,
              '--x': `${p.delay}ms`,
            }}
          >
            <g className={`bw-sway bw-sway-${p.sway}`}>
              <Puff x={p.x} y={p.y} r={p.r} colors={p.colors} />
            </g>
          </g>
        ))}
        {plan.hits.map((hit) => (
          <g
            key={hit.id}
            transform={`translate(${hit.x} ${hit.y})`}
            style={{ '--d': `${hit.t}ms` }}
          >
            <g className="bw-mark">
              <circle r="34" fill="none" stroke={GLOW} strokeWidth="2" />
              <Biohazard />
            </g>
            {BUBBLES.map((b, i) => (
              <circle
                key={i}
                className="bw-bubble"
                cx={b.x}
                cy={b.y}
                r="4"
                fill="none"
                stroke={GLOW}
                strokeWidth="1.5"
                style={{ '--bx': `${b.bx}px`, '--bd': `${b.delay}ms` }}
              />
            ))}
          </g>
        ))}
        <g transform={`translate(${plan.center.x} ${plan.center.y})`}>
          <circle className="bw-flash" r="150" fill="#d8ff9a" />
        </g>
        <g
          className="bw-canister"
          style={{
            '--x0': `${plan.from.x}px`,
            '--y0': `${plan.from.y}px`,
            '--x1': `${plan.center.x}px`,
            '--y1': `${plan.center.y}px`,
          }}
        >
          <Canister />
        </g>
      </svg>
    </div>
  );
}
