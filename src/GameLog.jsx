import { formatLogEntry, logIcon } from './gameLog.js';

export function GameLog({ log, matchData }) {
  return (
    <div className="game-log">
      <h2>Game Log</h2>
      <ul>
        {log.map((entry, index) => (
          <li key={`${log.length - index}-${entry.type}`} className="log-entry">
            <span className="log-icon">{logIcon(entry)}</span>
            <span className="log-text">{formatLogEntry(entry, matchData)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
