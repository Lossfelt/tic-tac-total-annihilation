import './BioAnimation.css';
import { useMemo } from 'react';
import Puff from './Puff.jsx';
import { makeRng } from './rng.js';
import { BOARD_UNITS } from './weaponAnimation.js';

// Biological Warfare: en beholder faller ned over målcellen og sprekker, og en
// giftig gassky brer seg over 3x3-området. Først når gassen har spredt seg
// vises hvilke celler som faktisk ble rammet (tilfeldig, bestemt av
// serveren): de får et giftmerke og tømmes, de nærmeste først. Tegnet som SVG
// og animert med CSS. Rute og tidspunkter kommer fra planBio().

const INK = '#1d1712';
const GLOW = '#d8ff7a';

// Fargetrapper for gassen: [base, lys, høylys].
const GAS_BACK = ['#1f4a16', '#3a7524', '#6bb040'];
const GAS_MID = [
  ['#2f6a22', '#5fae38', '#a8e068'],
  ['#3f7d2a', '#7fbf3f', '#c4ec7a'],
  ['#285a1c', '#4f8f2f', '#8fcf50'],
];
const GAS_FRONT = ['#5fae38', '#a8e068', '#e4ffb0'];

// Gassen i tre lag: store mørke skyer bakerst, midtlaget, og små lyse puffer
// foran. Dessuten tåkeslør og små sporer som stiger. Alt spres ut fra målet.
function buildGas(area, center) {
  const rand = makeRng(100 + area.length);
  const between = (a, b) => a + (b - a) * rand();
  const spreadFrom = (x, y) => ({
    sx: -(x - center.x) * 0.85,
    sy: -(y - center.y) * 0.85,
  });
  const layer = { back: [], mid: [], wisps: [], front: [], spores: [] };

  area.forEach((cell) => {
    const around = (spread) => ({
      x: cell.x + between(-spread, spread),
      y: cell.y + between(-spread, spread),
    });
    for (let i = 0; i < 2; i++) {
      const p = around(30);
      layer.back.push({ ...p, r: between(30, 44), colors: GAS_BACK, o: 0.55 });
    }
    for (let i = 0; i < 3; i++) {
      const p = around(34);
      layer.mid.push({
        ...p,
        r: between(20, 34),
        colors: GAS_MID[(layer.mid.length + i) % GAS_MID.length],
        o: 0.78,
      });
    }
    const wisp = around(28);
    layer.wisps.push({
      ...wisp,
      rx: between(26, 42),
      ry: between(7, 11),
      angle: between(0, 180),
      o: 0.35,
    });
    for (let i = 0; i < 2; i++) {
      const p = around(30);
      layer.front.push({
        ...p,
        r: between(11, 21),
        colors: GAS_FRONT,
        o: 0.85,
      });
    }
    for (let i = 0; i < 3; i++) {
      const p = around(40);
      layer.spores.push({
        ...p,
        r: between(1.4, 2.6),
        bx: between(-14, 14),
        delay: Math.round(between(0, 900)),
      });
    }
  });

  const withMotion = (p, i) => ({
    ...p,
    ...spreadFrom(p.x, p.y),
    delay: Math.round(between(0, 300)),
    sway: i % 2 ? 'a' : 'b',
  });
  return {
    back: layer.back.map(withMotion),
    mid: layer.mid.map(withMotion),
    wisps: layer.wisps.map(withMotion),
    front: layer.front.map(withMotion),
    spores: layer.spores,
  };
}

// Giftmerke, tegnet som tre sammenflettede ringer rundt et senter.
function Biohazard({ size = 1, stroke = GLOW }) {
  return (
    <g fill="none" stroke={stroke} strokeWidth={3 * size}>
      {[0, 120, 240].map((angle) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        return (
          <circle
            key={angle}
            cx={Math.cos(rad) * 11 * size}
            cy={Math.sin(rad) * 11 * size}
            r={10 * size}
          />
        );
      })}
      <circle r={4 * size} fill={stroke} />
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

// Gassbeholderen sett ovenfra: stålsylinder med fareskravering, bolter, ventil
// og giftmerke på lokket.
function Canister() {
  return (
    <g>
      <path
        d="M-9 -17 Q0 -26 9 -17"
        fill="none"
        stroke={INK}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M-9 -17 Q0 -26 9 -17"
        fill="none"
        stroke="#8a8a60"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle r="19" fill="#4a5a2c" stroke={INK} strokeWidth="1.6" />
      <circle r="15.5" fill="none" stroke={INK} strokeWidth="5.4" />
      <circle
        r="15.5"
        fill="none"
        stroke="#e6cf3a"
        strokeWidth="5"
        strokeDasharray="6.5 6.5"
      />
      <circle r="12.5" fill="#6f7f40" stroke={INK} strokeWidth="1" />
      <circle r="9.6" fill="#7d8c4a" stroke="#4a5a2c" strokeWidth="0.8" />
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <circle
            key={angle}
            cx={Math.cos(rad) * 11.2}
            cy={Math.sin(rad) * 11.2}
            r="1.1"
            fill="#2e3818"
          />
        );
      })}
      <g opacity="0.85">
        <Biohazard size={0.34} stroke="#e4ffb0" />
      </g>
      <circle r="4.6" fill="#8a8a60" stroke={INK} strokeWidth="1" />
      <path
        d="M-6.4 0 H6.4 M0 -6.4 V6.4"
        stroke="#c4c07a"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle r="1.9" fill="#c75d3a" stroke={INK} strokeWidth="0.6" />
      <path
        d="M-12 -9 A15 15 0 0 1 0 -15.5"
        fill="none"
        stroke="#e8f0c0"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.75"
      />
    </g>
  );
}

function GasPuff({ p, children }) {
  return (
    <g
      className="bw-puff"
      style={{
        '--sx': `${p.sx}px`,
        '--sy': `${p.sy}px`,
        '--x': `${p.delay}ms`,
        '--o': p.o,
      }}
    >
      <g className={`bw-sway bw-sway-${p.sway}`}>{children}</g>
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
        {gas.back.map((p, i) => (
          <GasPuff key={`b${i}`} p={p}>
            <Puff x={p.x} y={p.y} r={p.r} colors={p.colors} />
          </GasPuff>
        ))}
        {gas.mid.map((p, i) => (
          <GasPuff key={`m${i}`} p={p}>
            <Puff x={p.x} y={p.y} r={p.r} colors={p.colors} />
          </GasPuff>
        ))}
        {gas.wisps.map((p, i) => (
          <GasPuff key={`w${i}`} p={p}>
            <ellipse
              cx={p.x}
              cy={p.y}
              rx={p.rx}
              ry={p.ry}
              fill="#9fe05a"
              transform={`rotate(${p.angle.toFixed(0)} ${p.x.toFixed(1)} ${p.y.toFixed(1)})`}
            />
          </GasPuff>
        ))}
        {gas.front.map((p, i) => (
          <GasPuff key={`f${i}`} p={p}>
            <Puff x={p.x} y={p.y} r={p.r} colors={p.colors} />
          </GasPuff>
        ))}
        {gas.spores.map((s, i) => (
          <circle
            key={`s${i}`}
            className="bw-spore"
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#e4ffb0"
            style={{ '--bx': `${s.bx}px`, '--sd': `${s.delay}ms` }}
          />
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
