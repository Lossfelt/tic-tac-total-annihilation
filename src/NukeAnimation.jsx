import './NukeAnimation.css';
import { NUKE_DURATION_MS } from './weaponAnimation.js';

// Soppskyen for Dirty Nuke. Tegnet som SVG av lagdelte "puffer" i stedet for
// ferdige bilder, så den skalerer skarpt, bruker temaets farger og kan
// animeres lag for lag. Posisjonene genereres med et fast frø, så skyen ser
// lik ut hver gang.

function makeRng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fargetrapp fra varm kjerne (t=0) til kald kant (t=1): [base, lys, høylys].
function ramp(t) {
  if (t < 0.3) return ['#fbb630', '#ffe27a', '#fff3b0'];
  if (t < 0.65) return ['#e8791f', '#fbb630', '#ffd75a'];
  if (t < 0.88) return ['#b8391a', '#e8791f', '#f59a2b'];
  return ['#962c14', '#cf5a1c', '#ee8a2a'];
}

function Puff({ x, y, r, t }) {
  const [base, light, highlight] = ramp(t);
  const showCrescent = r > 30 && t < 0.75;
  const arcR = 0.7 * r;
  const cx = x - 0.08 * r;
  const cy = y - 0.1 * r;
  const point = (angle) =>
    `${(cx + arcR * Math.cos(angle)).toFixed(1)} ${(cy + arcR * Math.sin(angle)).toFixed(1)}`;
  return (
    <g className="nk-pf">
      <circle cx={x} cy={y} r={r} fill={base} />
      <circle cx={x - 0.14 * r} cy={y - 0.18 * r} r={0.8 * r} fill={light} />
      <circle
        cx={x - 0.3 * r}
        cy={y - 0.36 * r}
        r={0.46 * r}
        fill={highlight}
      />
      {showCrescent && (
        <path
          d={`M${point(3.5)} A${arcR.toFixed(1)} ${arcR.toFixed(1)} 0 0 1 ${point(4.7)}`}
          fill="none"
          stroke="#fff6c8"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.65"
        />
      )}
    </g>
  );
}

function buildCloud() {
  const rand = makeRng(11);
  const between = (a, b) => a + (b - a) * rand();
  const outerFirst = (puffs) => puffs.sort((a, b) => b.t - a.t);

  // Hatten: tre ringer av puffer rundt et varmt sentrum. Midten nederst er
  // utelatt, slik at stilken går inn i en uthulet åpning.
  const cx = 340;
  const cy = 188;
  const rx = 98;
  const ry = 64;
  const cap = [];
  [
    { n: 16, f: 1, r: [27, 40] },
    { n: 11, f: 0.68, r: [30, 42] },
    { n: 6, f: 0.32, r: [28, 36] },
  ].forEach((ring, k) => {
    for (let i = 0; i < ring.n; i++) {
      const angle = (i / ring.n) * 6.283 + k * 0.55 + between(-0.12, 0.12);
      const jitter = 1 + between(-0.07, 0.07);
      const x = cx + Math.cos(angle) * rx * ring.f * jitter;
      const y = cy + Math.sin(angle) * ry * ring.f * jitter;
      const r = between(ring.r[0], ring.r[1]);
      if (y > cy + 16 && Math.abs(x - cx) < 56) continue;
      let t = Math.min(1, Math.hypot((x - 335) / rx, (y - 172) / ry) / 1.15);
      if (y > cy + 26) t = Math.min(1, t + 0.45);
      cap.push({ x, y, r, t });
    }
  });

  // Stilken: en smal søyle av bobler, varmest i midten.
  const stem = [];
  for (let y = 412; y >= 232; y -= 13) {
    const f = (412 - y) / 180;
    const halfWidth = 25 - 4 * f;
    [-0.7, 0, 0.7].forEach((offset) => {
      stem.push({
        x: 340 + offset * halfWidth + between(-4, 4),
        y: y + between(-3, 3),
        r: halfWidth * 0.6 + between(-2, 4),
        t: Math.min(1, Math.abs(offset) * 0.75 + f * 0.18 + between(0, 0.08)),
      });
    });
  }

  // Basen: røyk og støv langs bakken, varmest midt under stilken.
  const base = [];
  for (let i = 0; i < 20; i++) {
    const x = 175 + (330 * (i + 0.5)) / 20 + between(-8, 8);
    const d = Math.abs(x - 340) / 170;
    base.push({
      x,
      y: 434 - 16 * (1 - d) + between(-5, 5),
      r: between(26, 44),
      t: Math.min(1, d * 1.1),
    });
  }
  for (let i = 0; i < 9; i++) {
    const x = 215 + (250 * i) / 8 + between(-8, 8);
    const d = Math.abs(x - 340) / 170;
    base.push({
      x,
      y: 446 + between(-3, 3),
      r: between(20, 30),
      t: Math.min(1, d * 0.8),
    });
  }

  const sparkColors = ['#ffd23a', '#ff9a2e', '#ffe27a', '#4a2218'];
  const sparks = Array.from({ length: 22 }, (_, i) => {
    const angle = between(0, 6.283);
    const dist = between(150, 240);
    return {
      cx: 340 + Math.cos(angle) * dist,
      cy: 195 + Math.sin(angle) * dist * 0.7,
      r: between(2.5, 5.5),
      fill: sparkColors[i % 4],
    };
  });

  return {
    cap: outerFirst(cap),
    stem: outerFirst(stem),
    base: outerFirst(base),
    sparks,
  };
}

const CLOUD = buildCloud();

const renderPuffs = (puffs) =>
  puffs.map((p, i) => <Puff key={i} x={p.x} y={p.y} r={p.r} t={p.t} />);

// Dekker hele brettet og fanger alle klikk mens animasjonen spilles. Skal
// bare monteres mens animasjonen går: CSS-animasjonene starter ved montering.
export default function NukeAnimation() {
  return (
    <div
      className="nk-overlay"
      data-testid="nuke-animation"
      aria-hidden="true"
      style={{ '--nk-dur': `${NUKE_DURATION_MS}ms` }}
    >
      <svg viewBox="0 0 680 520" preserveAspectRatio="xMidYMid slice">
        <rect className="nk nk-dim" width="680" height="520" fill="#1a0805" />
        <rect className="nk nk-glow" width="680" height="520" fill="#ff8c2a" />
        <g className="nk nk-shake">
          <g className="nk nk-heat">
            <g className="nk nk-cap">
              <ellipse cx="340" cy="250" rx="52" ry="28" fill="#4e160a" />
            </g>
            <g className="nk nk-stem">{renderPuffs(CLOUD.stem)}</g>
            <g className="nk nk-base">{renderPuffs(CLOUD.base)}</g>
            <g className="nk nk-cap">{renderPuffs(CLOUD.cap)}</g>
            <ellipse
              className="nk nk-sw1"
              cx="340"
              cy="448"
              rx="60"
              ry="9"
              fill="none"
              stroke="#ffd9a0"
              strokeWidth="5"
              vectorEffect="non-scaling-stroke"
            />
            <ellipse
              className="nk nk-sw2"
              cx="340"
              cy="448"
              rx="60"
              ry="9"
              fill="none"
              stroke="#ffe9c0"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            <g className="nk nk-ring">
              <ellipse
                cx="340"
                cy="272"
                rx="170"
                ry="24"
                fill="#ffcf80"
                opacity="0.14"
              />
              <ellipse
                cx="340"
                cy="282"
                rx="112"
                ry="15"
                fill="none"
                stroke="#ffb02e"
                strokeWidth="4"
              />
              <ellipse
                cx="340"
                cy="282"
                rx="132"
                ry="19"
                fill="none"
                stroke="#ffe2a0"
                strokeWidth="1.5"
                opacity="0.6"
              />
            </g>
            <g className="nk nk-sparks">
              {CLOUD.sparks.map((s, i) => (
                <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} />
              ))}
            </g>
          </g>
        </g>
        <rect className="nk nk-flash" width="680" height="520" fill="#fff3b0" />
      </svg>
    </div>
  );
}
