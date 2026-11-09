import { useState } from 'react';

// Status over brettet: venter på motstander (med kopier-lenke) eller varsel om
// at motstanderen er frakoblet. Vises ikke når alt er i orden.
export function MatchStatus({ matchID, matchData, playerID }) {
  const [copied, setCopied] = useState(false);
  const opponent = matchData?.[playerID === '0' ? 1 : 0];
  const waiting = !opponent?.name;
  const disconnected = !waiting && opponent.isConnected === false;
  if (!waiting && !disconnected) return null;

  const copyLink = async () => {
    const link = `${window.location.origin}/?match=${matchID}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Utklippstavlen kan være blokkert. Match-ID-en vises uansett.
    }
  };

  return (
    <div className="match-status" role="status">
      {waiting ? (
        <>
          <span>
            Waiting for an opponent. Share match ID <strong>{matchID}</strong>.
          </span>
          <button
            type="button"
            className="match-status-button"
            onClick={copyLink}
          >
            {copied ? 'Copied' : 'Copy invite link'}
          </button>
        </>
      ) : (
        <span>
          {opponent.name} disconnected. They can rejoin with the same tab.
        </span>
      )}
    </div>
  );
}
