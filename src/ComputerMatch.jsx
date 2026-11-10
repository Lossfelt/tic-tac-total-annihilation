import { useState } from 'react';
import { Client } from 'boardgame.io/dist/esm/react.js';
import { Local } from 'boardgame.io/dist/esm/multiplayer.js';
import { TicTacToe } from './Game.js';
import { TicTacToeBoard } from './Board.jsx';
import { HeuristicBot } from './HeuristicBot.js';
import { SoundToggle } from './SoundToggle.jsx';

// Kamp mot datamaskinen. Spillet kjører helt i nettleseren via boardgame.io
// sin Local-transport, uten server. Spilleren er alltid 0 (Mexican
// Queendom), og botten er 1 (Pan-Canadia).
const LocalClient = Client({
  game: TicTacToe,
  board: TicTacToeBoard,
  multiplayer: Local({ bots: { 1: HeuristicBot } }),
  debug: false,
});

export const COMPUTER_NAME = 'Computer';

// Local-transporten husker kamper per matchID så lenge siden er åpen, så hver
// kamp trenger en ny ID. Ellers fortsetter en ny kamp der den forrige slapp.
const newMatchID = () => `computer-${Date.now()}`;

export default function ComputerMatch({ name, onLeave, onAbout }) {
  const [matchID, setMatchID] = useState(newMatchID);
  const players = [
    { id: 0, name },
    { id: 1, name: COMPUTER_NAME },
  ];

  return (
    <div className="match-shell">
      <div className="match-bar">
        <button type="button" className="match-bar-button" onClick={onLeave}>
          Leave
        </button>
        <h3>vs {COMPUTER_NAME}</h3>
        <span className="match-bar-actions">
          <SoundToggle />
          <button type="button" className="match-bar-button" onClick={onAbout}>
            About
          </button>
        </span>
      </div>
      <LocalClient
        key={matchID}
        playerID="0"
        matchID={matchID}
        localPlayers={players}
        onPlayAgain={() => setMatchID(newMatchID())}
      />
    </div>
  );
}
