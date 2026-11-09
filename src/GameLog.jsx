import { useState } from 'react';
import { FactionMark } from './FactionMark.jsx';
import { formatLogEntry, logTag, logTagClass } from './gameLog.js';

// Hver rad viser fraksjonen som handlet, et stensilmerke for hva som skjedde
// og teksten. Fraksjonsmerket er dekor: spillerens navn står i teksten.
// På smale skjermer er loggen sammenfoldet til den siste hendelsen (CSS),
// og knappen viser eller skjuler resten. På brede skjermer vises alt, og
// knappen er skjult.
export function GameLog({ log, matchData }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`game-log ${open ? '' : 'game-log-collapsed'}`}>
      <div className="game-log-header">
        <h2>Game Log</h2>
        <button
          type="button"
          className="game-log-toggle"
          aria-expanded={open}
          aria-controls="game-log-list"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Show less' : 'Show all'}
        </button>
      </div>
      <ul id="game-log-list" aria-live="polite" aria-relevant="additions">
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
