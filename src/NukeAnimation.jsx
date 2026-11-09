import './NukeAnimation.css';
import { NUKE_DURATION_MS } from './weaponAnimation.js';

// Soppsky for Dirty Nuke: en ferdig SVG-scene (public/nuke.svg) med SMIL-
// animasjon på 2 sekunder, vist som <img> så den kjører uten skript. Den har
// egen himmel og bakke, så den dekker hele brettet mens den spilles, og den
// fades ut på slutten.
//
// `version` er hendelsesnummeret. Det legges på adressen fordi nettleseren
// deler ett bildedokument per adresse: uten det fortsetter en ny <img> der
// forrige avspilling sluttet, og animasjonen vises bare i sluttilstand.
export default function NukeAnimation({ version }) {
  return (
    <div
      className="nk-overlay"
      data-testid="nuke-animation"
      aria-hidden="true"
      style={{ '--nk-dur': `${NUKE_DURATION_MS}ms` }}
    >
      <img src={`/nuke.svg?play=${version}`} alt="" />
    </div>
  );
}
