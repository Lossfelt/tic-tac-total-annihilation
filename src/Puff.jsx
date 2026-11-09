// En flat røykpuff med tre toner, belyst fra oppe til venstre. Grunnelementet
// i både soppskyen og eksplosjonene.

// Fargetrapp fra varm kjerne (t=0) til kald kant (t=1): [base, lys, høylys].
function fireRamp(t) {
  if (t < 0.3) return ['#fbb630', '#ffe27a', '#fff3b0'];
  if (t < 0.65) return ['#e8791f', '#fbb630', '#ffd75a'];
  if (t < 0.88) return ['#b8391a', '#e8791f', '#f59a2b'];
  return ['#962c14', '#cf5a1c', '#ee8a2a'];
}

// colors overstyrer ilden, for eksempel til røyk: [base, lys, høylys].
export default function Puff({ x, y, r, t = 0, colors, className }) {
  const [base, light, highlight] = colors ?? fireRamp(t);
  const showCrescent = r > 30 && t < 0.75;
  const arcR = 0.7 * r;
  const cx = x - 0.08 * r;
  const cy = y - 0.1 * r;
  const point = (angle) =>
    `${(cx + arcR * Math.cos(angle)).toFixed(1)} ${(cy + arcR * Math.sin(angle)).toFixed(1)}`;
  return (
    <g className={className}>
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
