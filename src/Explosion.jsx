import './Explosion.css';
import Puff from './Puff.jsx';
import { makeRng } from './rng.js';

// En eksplosjon sett ovenfra: brannsår, lysglimt, ildkule, sjokkringer, skrot,
// gnister og røyk. Brukes av Air Strike og Artillery. Tegnes rundt (0, 0) i
// 100 enheters celler; x og y plasserer den, scale gjør den større eller
// mindre, og delay er når (ms etter montering) den går av.

const SMOKE_DARK = ['#3a2c24', '#5a483a', '#7a6652'];
const SMOKE_LIGHT = ['#4a3a30', '#6b5a4a', '#8a7762'];

// Tre varianter, så flere eksplosjoner i samme animasjon ikke ser helt like ut.
function buildVariant(seed) {
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

const VARIANTS = [buildVariant(3), buildVariant(7), buildVariant(13)];

export default function Explosion({ x, y, delay, scale = 1, variant = 0 }) {
  const v = VARIANTS[variant % VARIANTS.length];
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      style={{ '--d': `${delay}ms` }}
    >
      <g className="ex-scorch">
        <ellipse rx="37" ry="33" fill="#1a0805" transform="rotate(20)" />
        <ellipse rx="24" ry="20" fill="#2e1008" transform="rotate(-15)" />
        {v.streaks.map((s, i) => (
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
      <circle className="ex-flash" r="60" fill="#fff3b0" />
      <g className="ex-fire">
        {v.fire.map((p, i) => (
          <Puff key={i} x={p.x} y={p.y} r={p.r} t={p.t} />
        ))}
      </g>
      <circle
        className="ex-ring"
        r="44"
        fill="none"
        stroke="#ffd9a0"
        strokeWidth="4"
      />
      <circle
        className="ex-ring ex-ring-late"
        r="44"
        fill="none"
        stroke="#ffe9c0"
        strokeWidth="2"
      />
      {v.debris.map((d, i) => (
        <g
          key={i}
          className="ex-debris"
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
      {v.sparks.map((s, i) => (
        <circle
          key={i}
          className="ex-spark"
          r={s.r}
          fill="#ffd23a"
          style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px` }}
        />
      ))}
      {v.smoke.map((s, i) => (
        <g
          key={i}
          className="ex-smoke"
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
