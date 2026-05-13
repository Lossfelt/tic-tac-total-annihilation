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
      process.env.REACT_APP_BACKEND_URL || `${window.location.hostname}:8000`,
  }),
  debug: false,
});

const lobbyClient = new LobbyClient({
  server:
    process.env.REACT_APP_BACKEND_URL ||
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

  return (
    <div className="center-content">
      {name && !joined ? (
        <h1>Welcome, general {name}!</h1>
      ) : !name ? (
        <h1>Who will lead the troops?</h1>
      ) : null}
      {!name ? (
        <form onSubmit={handleNameChange}>
          <input ref={nameInput} type="text" placeholder="Enter your name" />
          <button className="submit" type="submit">
            Submit
          </button>
        </form>
      ) : !joined ? (
        <div>
          <div className="create-game">
            <button onClick={handleCreate}>Create Game</button>
          </div>
          <div className="create-game">
            <input
              ref={matchInput}
              type="number"
              placeholder="Enter match ID"
            />
            <button onClick={() => handleJoin()}>Join Game</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="match-ID-and-leave-button">
            <h3>Match ID: {matchID}</h3>
            <button onClick={handleLeave}>Leave Game</button>
          </div>
          <TicTacToeClient
            playerID={playerID}
            credentials={credentials}
            matchID={matchID}
          />
        </div>
      )}
      <button
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          backgroundColor: 'grey',
          padding: 5,
        }}
        onClick={handleAbout}
      >
        About
      </button>
      {showAbout && <AboutPopup onClose={handleAbout} />}
    </div>
  );
};

export default App;
