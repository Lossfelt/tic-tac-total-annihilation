import './WinEffect.css';
import { makeRng } from './rng.js';
import { BOARD_UNITS, cellCenter } from './weaponAnimation.js';

// Seierseffekt: en strek tegnes gjennom de fire vinnercellene, og glør stiger
// fra brettet i vinnerens farge. Ved seier ved dominans finnes ingen linje,
// så bare gløden vises. Overlegget fanger ingen klikk.

const EXTEND_UNITS = 40;
const FACTION_COLORS = {
  0: ['#ff7a4a', '#ff5a3a', '#ffd23a'],
  1: ['#9bd6ff', '#7ec8ff', '#ffffff'],
};

function buildEmbers() {
  const rand = makeRng(21);
  const between = (a, b) => a + (b - a) * rand();
  return Array.from({ length: 28 }, (_, i) => ({
    x: between(20, BOARD_UNITS - 20),
    y: between(BOARD_UNITS - 40, BOARD_UNITS + 10),
    r: between(1.5, 3.5),
    dx: between(-30, 30),
    duration: Math.round(between(2500, 4200)),
    delay: Math.round(between(0, 3000)),
    color: i % 3,
  }));
}

const EMBERS = buildEmbers();

function linePath(cells) {
  const ids = [...cells].sort((a, b) => a - b);
  const first = cellCenter(ids[0]);
  const last = cellCenter(ids[ids.length - 1]);
  const length = Math.hypot(last.x - first.x, last.y - first.y);
  const ux = (last.x - first.x) / length;
  const uy = (last.y - first.y) / length;
  return [
    `M${first.x - ux * EXTEND_UNITS} ${first.y - uy * EXTEND_UNITS}`,
    `L${last.x + ux * EXTEND_UNITS} ${last.y + uy * EXTEND_UNITS}`,
  ].join(' ');
}

export default function WinEffect({ winnerID, winningLine }) {
  const colors = FACTION_COLORS[winnerID] ?? FACTION_COLORS[0];
  return (
    <div className="win-effect" data-testid="win-effect" aria-hidden="true">
      <svg viewBox={`0 0 ${BOARD_UNITS} ${BOARD_UNITS}`}>
        {winningLine && (
          <g data-testid="win-line" fill="none" strokeLinecap="round">
            <path
              className="win-line-glow"
              d={linePath(winningLine)}
              pathLength="1"
              stroke={colors[0]}
              strokeWidth="22"
            />
            <path
              className="win-line-core"
              d={linePath(winningLine)}
              pathLength="1"
              stroke="#fff3d0"
              strokeWidth="5"
            />
          </g>
        )}
        {EMBERS.map((e, i) => (
          <circle
            key={i}
            className="win-ember"
            cx={e.x}
            cy={e.y}
            r={e.r}
            fill={colors[e.color]}
            style={{
              '--dx': `${e.dx}px`,
              '--dur': `${e.duration}ms`,
              '--delay': `${e.delay}ms`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
