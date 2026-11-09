import { makeRng } from './rng.js';

// Aske og glør som driver sakte nedover bak lobbyen. Posisjonene er trukket
// med fast frø, så bildet er det samme hver gang, og animasjonen går i
// løkke. Fanger ingen klikk og er skjult for skjermlesere.
const COLORS = ['#8b8170', '#a39988', '#d9c9a3', '#dd6a35', '#8b3e1e'];

function buildAsh() {
  const rand = makeRng(7);
  const between = (a, b) => a + (b - a) * rand();
  return Array.from({ length: 36 }, (_, i) => ({
    left: between(0, 100),
    size: between(2, 5.5),
    duration: between(14, 26),
    delay: -between(0, 26),
    drift: between(-90, 90),
    spin: between(-180, 180),
    color: COLORS[i % COLORS.length],
    opacity: between(0.25, 0.7),
  }));
}

const ASH = buildAsh();

export default function LobbyAsh() {
  return (
    <div className="lobby-ash" data-testid="lobby-ash" aria-hidden="true">
      {ASH.map((a, i) => (
        <span
          key={i}
          className="lobby-ash-flake"
          style={{
            left: `${a.left}%`,
            width: `${a.size}px`,
            height: `${a.size * 0.6}px`,
            background: a.color,
            '--dur': `${a.duration}s`,
            '--delay': `${a.delay}s`,
            '--drift': `${a.drift}px`,
            '--spin': `${a.spin}deg`,
            '--peak': a.opacity,
          }}
        />
      ))}
    </div>
  );
}
