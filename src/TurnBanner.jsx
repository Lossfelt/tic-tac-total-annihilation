import { FactionMark } from './FactionMark.jsx';

// Bånd som sveiper over brettet når turen skifter. Fanger ingen klikk, og
// teksten er skjult for skjermlesere fordi turindikatoren allerede er en
// live-region.
export function TurnBanner({ player, text }) {
  return (
    <div
      className={`turn-banner turn-banner-${player}`}
      data-testid="turn-banner"
      aria-hidden="true"
    >
      <span className="turn-banner-text">
        <FactionMark playerID={player} size="1.1em" />
        {text}
      </span>
    </div>
  );
}
