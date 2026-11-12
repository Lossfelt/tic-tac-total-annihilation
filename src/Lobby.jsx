import { useRef } from 'react';
import LobbyAsh from './LobbyAsh.jsx';
import { RulePicker } from './RulePicker.jsx';

// Lobbyskjermen: tittel, fraksjoner, navneskjema og opprett/bli med. All
// tilstand og alle backend-kall ligger i App.jsx.
export default function Lobby({
  name,
  pendingAction,
  lobbyError,
  onSubmitName,
  onCreate,
  onJoin,
  onPlayComputer,
  initialMatchID = '',
}) {
  const nameInput = useRef();
  const matchInput = useRef();
  const busy = pendingAction !== null;

  const handleNameSubmit = (event) => {
    event.preventDefault();
    onSubmitName(nameInput.current.value);
  };

  return (
    <div className="lobby">
      <LobbyAsh />
      <div className="lobby-title">
        <h1 className="game-title">
          <span className="game-title-main">
            <span className="game-title-worn">Tic Tac Total</span>
          </span>
          <span className="game-title-accent">
            <span className="game-title-worn">Annihilation</span>
          </span>
        </h1>
        <div className="lobby-subtitle">Post-collapse territory war</div>
      </div>

      <div className="factions-preview">
        <div className="faction-card queendom">
          <img src="/queendom-emblem.webp" alt="Mexican Queendom" />
          <span>Mexican Queendom</span>
        </div>
        <div className="faction-card canadia">
          <img src="/pan-canada-emblem.webp" alt="Pan-Canadia Inuit Alliance" />
          <span>Pan-Canadia Inuit Alliance</span>
        </div>
      </div>

      {!name ? (
        <form className="lobby-form" onSubmit={handleNameSubmit}>
          <h2>Who will lead the troops?</h2>
          <input
            ref={nameInput}
            type="text"
            placeholder="Enter your name"
            maxLength={32}
          />
          <button type="submit">Submit</button>
        </form>
      ) : (
        <div className="lobby-actions">
          <h2>Welcome, general {name}</h2>
          <button onClick={onCreate} disabled={busy}>
            Create new match
          </button>
          <button onClick={onPlayComputer} disabled={busy}>
            Play vs computer
          </button>
          <RulePicker />
          <div className="lobby-divider">
            {initialMatchID ? 'you were invited' : 'or join existing'}
          </div>
          <div className="lobby-row">
            <input
              ref={matchInput}
              type="number"
              placeholder="Match ID"
              defaultValue={initialMatchID}
              disabled={busy}
            />
            <button
              onClick={() => onJoin(matchInput.current.value)}
              disabled={busy}
            >
              Join
            </button>
          </div>
          {pendingAction ? (
            <div className="lobby-pending" role="status" aria-live="polite">
              <span className="lobby-pending-dot" aria-hidden="true" />
              <span className="lobby-pending-text">
                Waiting for server
                <span className="lobby-pending-ellipsis" aria-hidden="true">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </span>
              <span className="lobby-pending-hint">
                First connect can take 30-60 seconds while the backend wakes up.
              </span>
            </div>
          ) : (
            <div className="lobby-hint">
              Match ID is shared with your opponent so they can join the same
              battle.
            </div>
          )}
          {lobbyError && (
            <div className="lobby-error" role="alert">
              {lobbyError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
