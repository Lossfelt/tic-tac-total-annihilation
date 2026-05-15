import './Board.css';
import React, { useState, useEffect } from 'react';
import { formatLogEntry } from './Game.js';

const WEAPON_TARGET_COUNT = {
  'Air Strike': 3,
  Artillery: 1,
  'Biological Warfare': 1,
};

export function TicTacToeBoard({
  ctx,
  G,
  moves,
  matchData,
  playerID,
  isActive,
}) {
  const [specialMoveActive, setSpecialMoveActive] = useState(false);
  const [targetsOfSpecialMove, setTargetsOfSpecialMove] = useState([]);

  const handleSpecialMoveClick = () => {
    if (!specialMoveActive) {
      setSpecialMoveActive(G.strategicWeapon[playerID]);
    } else {
      setSpecialMoveActive(false);
      setTargetsOfSpecialMove([]);
    }
  };

  const specialAttack = (id) => {
    setTargetsOfSpecialMove((targets) => [...targets, id]);
  };

  useEffect(() => {
    const requiredCount = WEAPON_TARGET_COUNT[specialMoveActive];
    if (!requiredCount || targetsOfSpecialMove.length !== requiredCount) {
      return;
    }
    // Air Strike vil ha hele array-en som mål; de andre tar en enkelt celle.
    const arg =
      requiredCount === 1 ? targetsOfSpecialMove[0] : targetsOfSpecialMove;
    moves.useStrategicWeapon(arg);
    setTargetsOfSpecialMove([]);
    setSpecialMoveActive(false);
  }, [targetsOfSpecialMove, specialMoveActive, moves]);

  const clickCell = (id) => {
    if (specialMoveActive) {
      specialAttack(id);
    } else {
      moves.clickCell(id);
    }
  };

  let winner = '';
  if (ctx.gameover) {
    winner = (
      <div id="winner">
        Winner:{' '}
        {ctx.gameover.winner === '0' ? (
          <>
            {matchData[0]?.name || 'Queendom'}
            <img
              src="/Queendom_icon.png"
              alt="Queendom"
              style={{ height: '1em', verticalAlign: 'middle' }}
            />
          </>
        ) : (
          <>
            {matchData[1]?.name || 'Pan-Canadia'}
            <img
              src="/Pan-Canadia_icon.png"
              alt="Pan-Canadia"
              style={{ height: '1em', verticalAlign: 'middle' }}
            />
          </>
        )}
      </div>
    );
  }

  let tbody = [];
  for (let i = 0; i < 4; i++) {
    let cells = [];
    for (let j = 0; j < 4; j++) {
      const id = 4 * i + j;
      const isSelected = targetsOfSpecialMove.includes(id);
      const className = `${G.blink[id] ? 'knapp blink' : 'knapp'} ${
        isSelected ? 'selected' : ''
      }`;
      // Når en celle blinker, inkluderer vi blinkVersion i React `key` slik
      // at to blink-hendelser etter hverandre faktisk remounter elementet
      // og restarter CSS-animasjonen. Uten det vil DOM beholde den gamle,
      // ferdigkjørte animasjonen og cellen virker statisk.
      const buttonKey = G.blink[id]
        ? `cell-${id}-blink-${G.blinkVersion}`
        : `cell-${id}`;
      cells.push(
        <td key={id}>
          {G.cells[id] ? (
            <button
              key={buttonKey}
              className={className}
              type="button"
              onClick={() => clickCell(id)}
            >
              <img
                src={
                  G.cells[id] === '0'
                    ? '/Queendom_icon.png'
                    : '/Pan-Canadia_icon.png'
                }
                alt={G.cells[id] === '0' ? 'Queendom' : 'Pan-Canadia'}
                style={{ width: '100%', height: '100%' }}
              />
            </button>
          ) : (
            <button
              key={buttonKey}
              className={className}
              type="button"
              onClick={() => clickCell(id)}
            />
          )}
        </td>,
      );
    }
    tbody.push(<tr key={i}>{cells}</tr>);
  }

  return (
    <div className="container">
      <div className="center-content">
        <h1>
          {matchData[0].name} &nbsp;
          <img
            src="/Queendom_icon.png"
            alt="Queendom"
            style={{ height: '1em', verticalAlign: 'middle' }}
          />
          &nbsp;vs&nbsp;
          {matchData[1].name} &nbsp;
          <img
            src="/Pan-Canadia_icon.png"
            alt="Pan-Canadia"
            style={{ height: '1em', verticalAlign: 'middle' }}
          />
        </h1>
        <table>
          <tbody>{tbody}</tbody>
        </table>
        <h3>
          Current turn:{' '}
          {matchData[ctx.currentPlayer]?.name ||
            (ctx.currentPlayer === '0' ? (
              <img
                src="/Queendom_icon.png"
                alt="Queendom"
                style={{ height: '1em', verticalAlign: 'middle' }}
              />
            ) : (
              <img
                src="/Pan-Canadia_icon.png"
                alt="Pan-Canadia"
                style={{ height: '1em', verticalAlign: 'middle' }}
              />
            ))}
        </h3>
        <button
          className="strategic_weapons"
          style={specialMoveActive ? { backgroundColor: 'red' } : {}}
          onClick={() => handleSpecialMoveClick()}
          disabled={!isActive}
        >
          {G.strategicWeapon[playerID]}
        </button>
        <div>Rareium: {G.Rareium[playerID]} </div>
        <div className="text">{winner}</div>
        <div className="gameLog">
          <h2>Game Log</h2>
          <ul>
            {G.log.map((entry, index) => (
              <li key={index}>{formatLogEntry(entry, matchData)}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
