import { useState, useEffect } from 'react';
import { Client } from 'boardgame.io/dist/esm/react.js';
import { Local } from 'boardgame.io/dist/esm/multiplayer.js';
import { TicTacToe } from './Game.js';
import { TicTacToeBoard } from './Board.jsx';
import { HeuristicBot } from './HeuristicBot.js';
import { SoundToggle } from './SoundToggle.jsx';
import { resetRules } from './rules.js';
import { presetFromUrl } from './rulePresets.js';

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
  // Regelvariant fra lenken (?regler=...), ellers dagens regler.
  const [PRESET] = useState(presetFromUrl);
  const [matchID, setMatchID] = useState(() => {
    resetRules(PRESET?.rules);
    return newMatchID();
  });
  // Tilbake til dagens regler når kampen forlates, så en kamp mot et
  // menneske i samme fane ikke arver varianten.
  useEffect(() => {
    resetRules(PRESET?.rules);
    return () => resetRules();
  }, [PRESET]);
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
      {PRESET && (
        <div className="rule-preset">
          <strong>{PRESET.label}.</strong> {PRESET.help}
        </div>
      )}
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
