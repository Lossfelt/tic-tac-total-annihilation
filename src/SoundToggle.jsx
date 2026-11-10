import { useSyncExternalStore } from 'react';
import { isMuted, setMuted, subscribeMuted } from './sound.js';

// Knapp for å slå lyden av og på. Valget huskes mellom besøk.
export function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted);
  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={!muted}
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      onClick={() => setMuted(!muted)}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor" />
        {muted ? (
          <path
            d="M16 9l5 6M21 9l-5 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
    </button>
  );
}
