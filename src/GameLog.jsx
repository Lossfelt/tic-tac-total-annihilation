import { FactionMark } from './FactionMark.jsx';
import { formatLogEntry, logTag, logTagClass } from './gameLog.js';

// Hver rad viser fraksjonen som handlet, et stensilmerke for hva som skjedde
// og teksten. Fraksjonsmerket er dekor: spillerens navn står i teksten.
export function GameLog({ log, matchData }) {
  return (
    <div className="game-log">
      <h2>Game Log</h2>
      <ul aria-live="polite" aria-relevant="additions">
        {log.map((entry, index) => (
          <li key={`${log.length - index}-${entry.type}`} className="log-entry">
            <span className="log-faction" aria-hidden="true">
              <FactionMark playerID={entry.player} size="1.1em" />
            </span>
            <span className={logTagClass(entry)}>{logTag(entry)}</span>
            <span className="log-text">{formatLogEntry(entry, matchData)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
