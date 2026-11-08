import { useState, useEffect } from 'react';
import { RECYCLE_REFUND_RATIO } from './Game.js';
import { WEAPONS, strategicWeapons } from './weapons.js';

// Våpenknapp, recycle med bekreftelse, testknapper (bare i utviklingsmodus)
// og instruksjonen mens spilleren velger mål.
export function WeaponPanel({
  G,
  moves,
  playerID,
  isActive,
  animating,
  armedCount,
  targeting,
}) {
  const [recyclePending, setRecyclePending] = useState(false);
  const myWeapon = G.strategicWeapon[playerID];
  const refundPreview = Math.round(
    (G.rareiumAtWeapon?.[playerID] ?? 0) * RECYCLE_REFUND_RATIO,
  );

  // Lukk recycle-bekreftelsen hvis våpenet forsvinner (brukt opp, recycled
  // ferdig, eller turen skifter til en spiller uten våpen).
  //
  // Selve dialogen sjekker `recyclePending && myWeapon`, så denne effekten
  // påvirker ikke visningen. Den nullstiller flagget slik at dialogen ikke
  // popper opp igjen av seg selv når spilleren senere får et nytt våpen. Å
  // utlede tilstanden i stedet fungerer ikke: i lokal modus deler begge
  // spillerne komponenten, så `myWeapon` forsvinner og kommer tilbake hver
  // gang turen skifter.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!myWeapon && recyclePending) setRecyclePending(false);
  }, [myWeapon, recyclePending]);

  const handleRecycleConfirm = () => {
    moves.recycleStrategicWeapon();
    setRecyclePending(false);
  };

  const activeMeta = targeting.active ? WEAPONS[targeting.active] : null;

  return (
    <div className="weapon-panel">
      <div className="weapon-button-row">
        <button
          key={`weapon-${armedCount}`}
          className={`weapon-button ${targeting.active ? 'active' : ''} ${
            myWeapon ? 'armed' : 'unarmed'
          } ${armedCount > 0 && myWeapon ? 'just-armed' : ''}`}
          onClick={targeting.toggle}
          disabled={animating || !isActive || !myWeapon}
          title={
            myWeapon
              ? WEAPONS[myWeapon].description
              : 'No strategic weapon available'
          }
        >
          {myWeapon ? (
            <>
              <span className="weapon-icon">{WEAPONS[myWeapon].icon}</span>
              <span className="weapon-name">{myWeapon}</span>
            </>
          ) : (
            <span className="weapon-name weapon-empty">No weapon armed</span>
          )}
        </button>
        <button
          type="button"
          className="recycle-button"
          onClick={() => setRecyclePending(true)}
          disabled={animating || !isActive || !myWeapon || targeting.active}
          title={
            myWeapon
              ? `Recycle weapon for ${refundPreview}% Rareium`
              : 'No weapon to recycle'
          }
          aria-label="Recycle strategic weapon"
        >
          ♻
        </button>
      </div>

      {import.meta.env.DEV &&
        strategicWeapons.map((weapon) => (
          <button
            key={weapon}
            type="button"
            className="debug-button"
            onClick={() => moves.debugGiveWeapon(weapon)}
            disabled={animating || !isActive || !!myWeapon}
          >
            Debug: arm {weapon.toLowerCase()}
          </button>
        ))}

      {recyclePending && myWeapon && (
        <div className="recycle-confirm" role="alertdialog">
          <div className="recycle-confirm-text">
            Recycle <strong>{myWeapon}</strong> for{' '}
            <strong>{refundPreview}%</strong> Rareium?
          </div>
          <div className="recycle-confirm-actions">
            <button
              type="button"
              className="recycle-confirm-yes"
              onClick={handleRecycleConfirm}
            >
              Recycle
            </button>
            <button
              type="button"
              className="recycle-confirm-no"
              onClick={() => setRecyclePending(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {activeMeta && (
        <div className="weapon-instruction">
          <div className="weapon-instruction-text">
            {activeMeta.instruction}
          </div>
          <div className="weapon-instruction-count">
            {targeting.targets.length} / {targeting.count} selected
          </div>
          {targeting.error && (
            <div className="weapon-instruction-error" role="alert">
              {targeting.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
