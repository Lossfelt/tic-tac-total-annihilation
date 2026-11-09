// Ikonsettet: ensfargede silhuetter som arver tekstfargen (currentColor) og
// skalerer med skriftstørrelsen. Erstatter emoji, som ser ulike ut på hver
// plattform og ikke passer stilen.

const svgProps = {
  viewBox: '0 0 32 32',
  width: '1em',
  height: '1em',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

// Kvart sirkelbånd mellom to radier, sentrert på en vinkel (grader).
const wedge = (center, r1, r2, spread = 30) => {
  const at = (deg, r) => {
    const rad = (deg * Math.PI) / 180;
    return `${(16 + Math.cos(rad) * r).toFixed(2)} ${(16 + Math.sin(rad) * r).toFixed(2)}`;
  };
  const a = center - spread;
  const b = center + spread;
  return `M${at(a, r1)}A${r1} ${r1} 0 0 1 ${at(b, r1)}L${at(b, r2)}A${r2} ${r2} 0 0 0 ${at(a, r2)}Z`;
};

// Strålingssymbolet (trefoil). Brukes for Dirty Nuke og ødelagte celler.
export const RadiationIcon = () => (
  <svg {...svgProps} fill="currentColor" strokeWidth={0}>
    <circle cx="16" cy="16" r="3" />
    {[-90, 30, 150].map((deg) => (
      <path key={deg} d={wedge(deg, 6, 14.5)} />
    ))}
  </svg>
);

// Biofare-symbolet: tre klør (halvmåner) rundt en liten ring. Hver klo er en
// sirkel A (radius 7,5, sentrum 7,5 fra midten) minus en like stor sirkel B som
// er skjøvet 4,5 mot midten, så klørne åpner seg inn mot ringen.
const CLAW_R = 7.5;
const CLAW_DIST = 7.5;
const CLAW_SHIFT = 4.5;

const biohazardClaw = (deg) => {
  const rad = (deg * Math.PI) / 180;
  const ux = Math.cos(rad);
  const uy = Math.sin(rad);
  const nx = -uy;
  const ny = ux;
  // Midtpunktet mellom sirklene og halve kordelengden i skjæringspunktene.
  const mid = CLAW_DIST - CLAW_SHIFT / 2;
  const h = Math.sqrt(CLAW_R ** 2 - (CLAW_SHIFT / 2) ** 2);
  const pt = (sign) =>
    `${(16 + ux * mid + sign * h * nx).toFixed(2)} ${(16 + uy * mid + sign * h * ny).toFixed(2)}`;
  // Ytre bue av A (stor, mot klokka i skjermvinkel), så indre bue av B tilbake.
  return `M${pt(1)}A${CLAW_R} ${CLAW_R} 0 1 0 ${pt(-1)}A${CLAW_R} ${CLAW_R} 0 0 1 ${pt(1)}Z`;
};

const BiohazardIcon = () => (
  <svg {...svgProps} fill="currentColor" strokeWidth={0}>
    {[-90, 30, 150].map((deg) => (
      <path key={deg} d={biohazardClaw(deg)} />
    ))}
    <circle
      cx="16"
      cy="16"
      r="2.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

const ArtilleryIcon = () => (
  <svg {...svgProps}>
    <path d="M16 3c4 4 5.500 9 5.500 14v9h-11v-9c0-5 1.500-10 5.500-14Z" />
    <path d="M10.500 21h11M10.500 25h11" />
  </svg>
);

const AirStrikeIcon = () => (
  <svg {...svgProps}>
    <path d="m16 3 2 9 12 6v3l-12-2-1 7 4 3v2l-5-1-5 1v-2l4-3-1-7-12 2v-3l12-6Z" />
  </svg>
);

const WEAPON_ICONS = {
  Artillery: ArtilleryIcon,
  'Air Strike': AirStrikeIcon,
  'Biological Warfare': BiohazardIcon,
  'Dirty Nuke': RadiationIcon,
};

export function WeaponIcon({ weapon }) {
  const Icon = WEAPON_ICONS[weapon];
  return Icon ? <Icon /> : null;
}

// To sirkulære piler.
export const RecycleIcon = () => (
  <svg {...svgProps}>
    {[0, 180].map((deg) => (
      <g key={deg} transform={`rotate(${deg} 16 16)`}>
        <path d="M8 15a8 8 0 0 1 14-5" />
        <path d="M23 4.500v6h-6" />
      </g>
    ))}
  </svg>
);
