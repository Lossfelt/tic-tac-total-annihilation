import './NukeAnimationV3.css';
import { NUKE_DURATION_MS } from './weaponAnimation.js';

// Soppsky for Dirty Nuke, variant 3: en ferdig SVG-scene (public/nuke-v3.svg)
// med SMIL-animasjon, spilt én gang og strukket til NUKE_DURATION_MS. SVG-en
// vises som <img>, så den kjører uten skript. Den har egen himmel og bakke, så
// den dekker hele brettet mens den spilles og fades ut på slutten.
export default function NukeAnimationV3() {
  return (
    <div
      className="nk3-overlay"
      data-testid="nuke-animation"
      aria-hidden="true"
      style={{ '--nk3-dur': `${NUKE_DURATION_MS}ms` }}
    >
      <img src="/nuke-v3.svg" alt="" />
    </div>
  );
}
