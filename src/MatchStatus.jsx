import { QrCode } from './QrCode.jsx';

// Status over brettet: venter på motstander (med QR-kode som åpner matchen)
// eller varsel om at motstanderen er frakoblet. Vises ikke når alt er i orden.
export function MatchStatus({ matchID, matchData, playerID }) {
  const opponent = matchData?.[playerID === '0' ? 1 : 0];
  const waiting = !opponent?.name;
  const disconnected = !waiting && opponent.isConnected === false;
  if (!waiting && !disconnected) return null;

  return (
    <div className="match-status" role="status">
      {waiting ? (
        <>
          <span>
            Waiting for an opponent. Scan to join, or share match ID{' '}
            <strong>{matchID}</strong>.
          </span>
          <QrCode
            value={`${window.location.origin}/?match=${matchID}`}
            label={`QR code to join match ${matchID}`}
          />
        </>
      ) : (
        <span>
          {opponent.name} disconnected. They can rejoin with the same tab.
        </span>
      )}
    </div>
  );
}
