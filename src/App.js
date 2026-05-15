import { TicTacToe } from './Game.js';
import { TicTacToeBoard } from './Board.js';
import { Client } from 'boardgame.io/dist/cjs/react.js';
import { SocketIO } from 'boardgame.io/dist/cjs/multiplayer.js';
import { LobbyClient } from 'boardgame.io/dist/cjs/client.js';
import React, { useState, useRef } from 'react';
import './Board.css';
import AboutPopup from './AboutPopup.js';

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
  const [name, setName] = useState('');
  const [matchID, setMatchID] = useState('');
  const [credentials, setCredentials] = useState('');
  const [playerID, setPlayerID] = useState('');
  const [joined, setJoined] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const nameInput = useRef();
  const matchInput = useRef();

  const handleAbout = () => {
    setShowAbout(!showAbout);
  };

  const handleNameChange = (event) => {
    event.preventDefault();
    setName(nameInput.current.value);
  };

  const handleJoin = async (inputMatchID) => {
    const id =
      typeof inputMatchID === 'string'
        ? inputMatchID
        : matchInput.current.value;
    if (!matchID) {
      setMatchID(id);
    }
    const playerCredentials = await lobbyClient.joinMatch('TicTacToe', id, {
      playerName: name,
    });
    setCredentials(playerCredentials.playerCredentials);
    setPlayerID(playerCredentials.playerID);
    setJoined(true);
  };

  const handleCreate = async () => {
    try {
      const match = await lobbyClient.createMatch('TicTacToe', {
        numPlayers: 2,
      });
      setMatchID(match.matchID);
      handleJoin(match.matchID);
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  const handleLeave = async () => {
    await lobbyClient.leaveMatch('TicTacToe', matchID, {
      playerID,
      credentials,
    });
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
    } catch (error) {
      console.error('Error during play again:', error);
    }
  };

  return (
    <div>
      {!joined ? (
        <div className="lobby">
          <div className="lobby-title">
            <h1 className="game-title">
              <span className="game-title-main">Tic Tac Total</span>
              <span className="game-title-accent">Annihilation</span>
            </h1>
            <div className="lobby-subtitle">Post-collapse territory war</div>
          </div>

          <div className="factions-preview">
            <div className="faction-card queendom">
              <img src="/Queendom_icon.png" alt="Mexican Queendom" />
              <span>Mexican Queendom</span>
            </div>
            <div className="faction-card canadia">
              <img
                src="/Pan-Canadia_icon.png"
                alt="Pan-Canadia Inuit Alliance"
              />
              <span>Pan-Canadia Inuit Alliance</span>
            </div>
          </div>

          {!name ? (
            <form className="lobby-form" onSubmit={handleNameChange}>
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
              <button onClick={handleCreate}>Create new match</button>
              <div className="lobby-divider">or join existing</div>
              <div className="lobby-row">
                <input ref={matchInput} type="number" placeholder="Match ID" />
                <button onClick={() => handleJoin()}>Join</button>
              </div>
              <div className="lobby-hint">
                Match ID is shared with your opponent so they can join the same
                battle.
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="match-shell">
          <div className="match-bar">
            <h3>Match ID: {matchID}</h3>
            <button onClick={handleLeave}>Leave</button>
          </div>
          <TicTacToeClient
            playerID={playerID}
            credentials={credentials}
            matchID={matchID}
            onPlayAgain={handlePlayAgain}
          />
        </div>
      )}

      <button className="about-button" onClick={handleAbout}>
        About
      </button>
      {showAbout && <AboutPopup onClose={handleAbout} />}
    </div>
  );
};

export default App;
