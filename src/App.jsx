import { TicTacToe } from './Game.js';
import { TicTacToeBoard } from './Board.jsx';
import { Client } from 'boardgame.io/dist/esm/react.js';
import { SocketIO } from 'boardgame.io/dist/esm/multiplayer.js';
import { LobbyClient } from 'boardgame.io/dist/esm/client.js';
import { useState, useEffect } from 'react';
import './Board.css';
import AboutPopup from './AboutPopup.jsx';
import Lobby from './Lobby.jsx';
import { loadSession, saveSession, clearSession } from './session.js';

const TicTacToeClient = Client({
  game: TicTacToe,
  board: TicTacToeBoard,
  multiplayer: SocketIO({
    server:
      import.meta.env.VITE_BACKEND_URL || `${window.location.hostname}:8000`,
  }),
  debug: false,
});

const lobbyClient = new LobbyClient({
  server:
    import.meta.env.VITE_BACKEND_URL ||
    `${window.location.protocol}//${window.location.hostname}:8000`,
});

const App = () => {
  // En reload gjenopptar matchen fra sessionStorage (se session.js).
  const [saved] = useState(loadSession);
  const [name, setName] = useState(saved?.name ?? '');
  const [matchID, setMatchID] = useState(saved?.matchID ?? '');
  const [credentials, setCredentials] = useState(saved?.credentials ?? '');
  const [playerID, setPlayerID] = useState(saved?.playerID ?? '');
  const [joined, setJoined] = useState(false);
  // True mens vi sjekker at den lagrede matchen fortsatt finnes.
  const [resuming, setResuming] = useState(Boolean(saved));
  const [showAbout, setShowAbout] = useState(false);
  // Hvis ikke null: backend-kall er underveis. Brukes til å disable knapper og
  // vise en "Waiting for server"-indikator. Hovedmotivasjon: Render kan bruke
  // 30-60s på å spinne opp en kald instans, så uten dette virker UI dødt.
  const [pendingAction, setPendingAction] = useState(null);
  const [lobbyError, setLobbyError] = useState('');
  const [matchError, setMatchError] = useState('');

  useEffect(() => {
    if (joined) saveSession({ name, matchID, playerID, credentials });
    else if (!resuming) clearSession();
  }, [joined, resuming, name, matchID, playerID, credentials]);

  // Gjenopptakelse: matchen kan være borte (serveren har startet på nytt), så
  // den sjekkes før vi viser brettet. Ellers havner spilleren på en tom skjerm.
  useEffect(() => {
    if (!saved) return undefined;
    let cancelled = false;
    const giveUp = () => {
      setMatchID('');
      setCredentials('');
      setPlayerID('');
      setLobbyError('Your previous match is no longer available.');
    };
    lobbyClient
      .getMatch('TicTacToe', saved.matchID)
      .then((match) => {
        if (cancelled) return;
        const me = match.players.find((p) => String(p.id) === saved.playerID);
        if (me?.name) setJoined(true);
        else giveUp();
      })
      .catch(() => {
        if (!cancelled) giveUp();
      })
      .finally(() => {
        if (!cancelled) setResuming(false);
      });
    return () => {
      cancelled = true;
    };
  }, [saved]);

  const handleAbout = () => {
    setShowAbout(!showAbout);
  };

  const handleJoin = async (id) => {
    if (!matchID) {
      setMatchID(id);
    }
    setLobbyError('');
    setPendingAction('join');
    try {
      const playerCredentials = await lobbyClient.joinMatch('TicTacToe', id, {
        playerName: name,
      });
      setCredentials(playerCredentials.playerCredentials);
      setPlayerID(playerCredentials.playerID);
      setJoined(true);
    } catch (error) {
      console.error('Error joining match:', error);
      setLobbyError('Could not join match. Check the Match ID and try again.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleCreate = async () => {
    setLobbyError('');
    setPendingAction('create');
    try {
      const match = await lobbyClient.createMatch('TicTacToe', {
        numPlayers: 2,
      });
      setMatchID(match.matchID);
      // handleJoin håndterer sin egen pendingAction; ikke clear her.
      await handleJoin(match.matchID);
    } catch (error) {
      console.error('Error creating match:', error);
      setLobbyError('Could not reach the server. Please try again.');
      setPendingAction(null);
    }
  };

  // Spilleren forlater alltid lokalt, selv om serveren ikke svarer. Ellers
  // blir man sittende fast i matchen når serveren er nede.
  const handleLeave = async () => {
    try {
      await lobbyClient.leaveMatch('TicTacToe', matchID, {
        playerID,
        credentials,
      });
    } catch (error) {
      console.warn('Could not notify server about leaving:', error);
    }
    setMatchError('');
    setMatchID('');
    setCredentials('');
    setPlayerID('');
    setJoined(false);
  };

  // Play Again bruker boardgame.io sin innebygde `playAgain`-API. Serveren
  // oppretter en delt ny match for begge spillerne: første spiller som
  // kaller, lager den; andre spiller får samme `nextMatchID` tilbake. Begge
  // forlater den ferdige matchen og kobler seg til den nye.
  const handlePlayAgain = async () => {
    try {
      const { nextMatchID } = await lobbyClient.playAgain(
        'TicTacToe',
        matchID,
        { playerID, credentials },
      );

      try {
        await lobbyClient.leaveMatch('TicTacToe', matchID, {
          playerID,
          credentials,
        });
      } catch (leaveError) {
        // Den andre spilleren kan ha trigget playAgain først og ryddet
        // matchen. Det er greit å ignorere.
        console.warn('Could not leave old match:', leaveError);
      }

      const next = await lobbyClient.joinMatch('TicTacToe', nextMatchID, {
        playerName: name,
      });
      setMatchID(nextMatchID);
      setCredentials(next.playerCredentials);
      setPlayerID(next.playerID);
      setMatchError('');
    } catch (error) {
      console.error('Error during play again:', error);
      setMatchError('Could not start a new match. Please try again.');
    }
  };

  return (
    <div>
      {resuming ? (
        <div className="lobby">
          <div className="lobby-pending" role="status" aria-live="polite">
            <span className="lobby-pending-dot" aria-hidden="true" />
            <span className="lobby-pending-text">
              Reconnecting to your match
            </span>
          </div>
        </div>
      ) : !joined ? (
        <Lobby
          name={name}
          pendingAction={pendingAction}
          lobbyError={lobbyError}
          onSubmitName={setName}
          onCreate={handleCreate}
          onJoin={handleJoin}
        />
      ) : (
        <div className="match-shell">
          <div className="match-bar">
            <button
              type="button"
              className="match-bar-button"
              onClick={handleLeave}
            >
              Leave
            </button>
            <h3>Match ID: {matchID}</h3>
            <button
              type="button"
              className="match-bar-button"
              onClick={handleAbout}
            >
              About
            </button>
          </div>
          {matchError && (
            <div className="lobby-error" role="alert">
              {matchError}
            </div>
          )}
          <TicTacToeClient
            playerID={playerID}
            credentials={credentials}
            matchID={matchID}
            onPlayAgain={handlePlayAgain}
          />
        </div>
      )}

      {!joined && (
        <button className="about-button" onClick={handleAbout}>
          About
        </button>
      )}
      {showAbout && <AboutPopup onClose={handleAbout} />}
    </div>
  );
};

export default App;
