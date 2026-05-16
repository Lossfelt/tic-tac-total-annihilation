import './Board.css';
import { useState, useEffect } from 'react';
import { RECYCLE_REFUND_RATIO, formatLogEntry, territories } from './Game.js';

const WEAPON_TARGET_COUNT = {
  'Air Strike': 3,
  Artillery: 1,
  'Biological Warfare': 1,
  'Dirty Nuke': 1,
};

const WEAPON_META = {
  Artillery: {
    icon: '💥',
    description: 'Destroys 1 target and its 4 orthogonal neighbours.',
    instruction: 'Select 1 target cell',
  },
  'Air Strike': {
    icon: '✈️',
    description:
      'Destroys 3 cells in a row (horizontal, vertical or diagonal).',
    instruction: 'Select 3 cells in a row',
  },
  'Biological Warfare': {
    icon: '☣️',
    description: 'Each cell in a 3x3 area has a 50% chance to be destroyed.',
    instruction: 'Select 1 target cell (3x3 area)',
  },
  'Dirty Nuke': {
    icon: '☢️',
    description:
      'Permanently destroys 1 target cell. The cell cannot be claimed again.',
    instruction: 'Select 1 target cell',
  },
};

// Velger ikon for en loggoppføring basert på keyword. Holdt enkelt: loggen
// er strenger, og typene er gjenkjennelige fra unike fraser i Game.js.
const logIcon = (entry) => {
  if (entry.includes('Artillery Strike')) return '💥';
  if (entry.includes('Air Strike')) return '✈️';
  if (entry.includes('Biological Weapon')) return '☣️';
  if (entry.includes('Dirty Nuke')) return '☢️';
  if (entry.includes('recycles')) return '♻';
  if (entry.includes('revolt')) return '✊';
  if (entry.includes('conquers')) return '⚔️';
  if (entry.includes('fails')) return '🛡️';
  if (entry.includes('claims')) return '🚩';
  return '•';
};

const FACTION_NAME = {
  0: 'Mexican Queendom',
  1: 'Pan-Canadia Inuit Alliance',
};

const FACTION_ICON = {
  0: '/Queendom_icon.png',
  1: '/Pan-Canadia_icon.png',
};

const FactionMark = ({ playerID, size = '1em' }) => (
  <img
    src={FACTION_ICON[playerID]}
    alt={FACTION_NAME[playerID]}
    style={{ height: size, width: 'auto', verticalAlign: 'middle' }}
  />
);

export function TicTacToeBoard({
  ctx,
  G,
  moves,
  matchData,
  playerID,
  isActive,
  onPlayAgain,
}) {
  const [specialMoveActive, setSpecialMoveActive] = useState(false);
  const [targetsOfSpecialMove, setTargetsOfSpecialMove] = useState([]);
  const [recyclePending, setRecyclePending] = useState(false);

  const myWeapon = G.strategicWeapon[playerID];
  const myRareium = G.Rareium[playerID];
  const rareiumPercent = Math.min(myRareium, 100);
  const refundPreview = Math.round(
    (G.rareiumAtWeapon?.[playerID] ?? 0) * RECYCLE_REFUND_RATIO,
  );

  // Lukk recycle-bekreftelsen hvis våpenet forsvinner (brukt opp, recycled
  // ferdig, eller turen skifter til en spiller uten våpen).
  useEffect(() => {
    if (!myWeapon && recyclePending) setRecyclePending(false);
  }, [myWeapon, recyclePending]);

  const handleSpecialMoveClick = () => {
    if (!specialMoveActive) {
      if (myWeapon) setSpecialMoveActive(myWeapon);
    } else {
      setSpecialMoveActive(false);
      setTargetsOfSpecialMove([]);
    }
  };

  const handleRecycleClick = () => {
    setRecyclePending(true);
  };

  const handleRecycleConfirm = () => {
    moves.recycleStrategicWeapon();
    setRecyclePending(false);
  };

  const handleRecycleCancel = () => {
    setRecyclePending(false);
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

  const activeWeaponMeta = specialMoveActive
    ? WEAPON_META[specialMoveActive]
    : null;
  const targetCount = specialMoveActive
    ? WEAPON_TARGET_COUNT[specialMoveActive]
    : 0;

  const gameover = ctx.gameover;
  const winnerID = gameover?.winner;
  const winnerName =
    gameover && (matchData[winnerID]?.name || FACTION_NAME[winnerID]);
  const winningCells = new Set(gameover?.winningLine ?? []);

  const cells = [];
  for (let id = 0; id < 16; id++) {
    const owner = G.cells[id];
    const isDestroyed = G.destroyed?.[id] ?? false;
    const isSelected = targetsOfSpecialMove.includes(id);
    const isBlinking = G.blink[id];
    const isWinning = winningCells.has(id);

    // En destroyed celle kan ikke nuke-es på nytt, men kan brukes som
    // sentrum for område-våpen (Artillery / Air Strike / Bio Warfare) for å
    // ramme cellene rundt.
    const blockedForSpecial = isDestroyed && specialMoveActive === 'Dirty Nuke';
    const isTargetable = specialMoveActive && !blockedForSpecial;

    const classes = ['cell'];
    if (owner === '0') classes.push('cell-queendom');
    if (owner === '1') classes.push('cell-canadia');
    if (isDestroyed) classes.push('cell-destroyed');
    if (isBlinking) classes.push('blink');
    if (isSelected) classes.push('selected');
    if (isTargetable) classes.push('targetable');
    if (isWinning) classes.push('winning');

    const buttonKey = isBlinking
      ? `cell-${id}-blink-${G.blinkVersion}`
      : `cell-${id}`;

    cells.push(
      <td key={id}>
        <button
          key={buttonKey}
          className={classes.join(' ')}
          type="button"
          title={
            isDestroyed ? `${territories[id]} (destroyed)` : territories[id]
          }
          onClick={() => clickCell(id)}
          disabled={
            (isDestroyed && (!specialMoveActive || blockedForSpecial)) ||
            (!isActive && !specialMoveActive)
          }
        >
          {isDestroyed ? (
            <span className="cell-destroyed-icon" aria-hidden="true">
              ☢
            </span>
          ) : (
            owner !== null && (
              <img
                src={FACTION_ICON[owner]}
                alt={FACTION_NAME[owner]}
                className="cell-icon"
              />
            )
          )}
        </button>
      </td>,
    );
  }

  const tbody = [];
  for (let row = 0; row < 4; row++) {
    tbody.push(<tr key={row}>{cells.slice(row * 4, row * 4 + 4)}</tr>);
  }

  return (
    <div className="board-container">
      <div className="board-content">
        <h1 className="vs-banner">
          <span className="vs-side vs-queendom">
            <FactionMark playerID="0" size="1.2em" />
            {matchData[0]?.name || FACTION_NAME[0]}
          </span>
          <span className="vs-divider">vs</span>
          <span className="vs-side vs-canadia">
            {matchData[1]?.name || FACTION_NAME[1]}
            <FactionMark playerID="1" size="1.2em" />
          </span>
        </h1>

        <div className="board-wrapper">
          <table className="board">
            <tbody>{tbody}</tbody>
          </table>
          {gameover && (
            <div className={`winner-overlay winner-overlay-${winnerID}`}>
              <div className="winner-overlay-name">{winnerName}</div>
              <div className="winner-overlay-label">Wins</div>
            </div>
          )}
        </div>

        {gameover && (
          <button
            className="play-again-button"
            type="button"
            onClick={onPlayAgain}
          >
            Play again
          </button>
        )}

        {!gameover && (
          <div className="turn-indicator">
            <span className="turn-label">Current turn:</span>
            <span
              className={`turn-name ${
                ctx.currentPlayer === '0' ? 'queendom' : 'canadia'
              }`}
            >
              {matchData[ctx.currentPlayer]?.name ||
                FACTION_NAME[ctx.currentPlayer]}{' '}
              <FactionMark playerID={ctx.currentPlayer} />
            </span>
          </div>
        )}

        {!gameover && (
          <div className="weapon-panel">
            <div className="weapon-button-row">
              <button
                className={`weapon-button ${specialMoveActive ? 'active' : ''} ${
                  myWeapon ? 'armed' : 'unarmed'
                }`}
                onClick={handleSpecialMoveClick}
                disabled={!isActive || !myWeapon}
                title={
                  myWeapon
                    ? WEAPON_META[myWeapon].description
                    : 'No strategic weapon available'
                }
              >
                {myWeapon ? (
                  <>
                    <span className="weapon-icon">
                      {WEAPON_META[myWeapon].icon}
                    </span>
                    <span className="weapon-name">{myWeapon}</span>
                  </>
                ) : (
                  <span className="weapon-name weapon-empty">
                    No weapon armed
                  </span>
                )}
              </button>
              <button
                type="button"
                className="recycle-button"
                onClick={handleRecycleClick}
                disabled={!isActive || !myWeapon || specialMoveActive}
                title={
                  myWeapon
                    ? `Recycle weapon for ${refundPreview}% Rareium`
                    : 'No weapon to recycle'
                }
                aria-label="Recycle strategic weapon"
              >
                ♻
              </button>
              {/* MIDLERTIDIG test-knapp: gir spilleren Dirty Nuke umiddelbart.
                  Fjern denne (og cheatGiveDirtyNuke i Game.js) når
                  Dirty Nuke er ferdig testet. */}
              <button
                type="button"
                className="cheat-button"
                onClick={() => moves.cheatGiveDirtyNuke()}
                disabled={!isActive || specialMoveActive}
                title="Cheat: arm Dirty Nuke"
                aria-label="Cheat: arm Dirty Nuke"
              >
                ☢
              </button>
            </div>

            {recyclePending && myWeapon && (
              <div className="recycle-confirm" role="alertdialog">
                <div className="recycle-confirm-text">
                  Recycle <strong>{myWeapon}</strong> for{' '}
                  <strong>{refundPreview}%</strong> Rareium?
                </div>
                <div className="recycle-confirm-actions">
                  <button
                    type="button"
                    className="recycle-confirm-yes"
                    onClick={handleRecycleConfirm}
                  >
                    Recycle
                  </button>
                  <button
                    type="button"
                    className="recycle-confirm-no"
                    onClick={handleRecycleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {activeWeaponMeta && (
              <div className="weapon-instruction">
                <div className="weapon-instruction-text">
                  {activeWeaponMeta.instruction}
                </div>
                <div className="weapon-instruction-count">
                  {targetsOfSpecialMove.length} / {targetCount} selected
                </div>
              </div>
            )}
          </div>
        )}

        {!gameover && (
          <div
            className="rareium-bar"
            title="Rareium is the chance (%) to receive a strategic weapon at the start of your turn."
          >
            <div
              className="rareium-fill"
              style={{ width: `${rareiumPercent}%` }}
            />
            <div className="rareium-label">
              <span>Rareium</span>
              <span className="rareium-value">{myRareium}%</span>
            </div>
          </div>
        )}

        <div className="game-log">
          <h2>Game Log</h2>
          <ul>
            {G.log.map((entry, index) => (
              <li
                key={`${G.log.length - index}-${entry}`}
                className="log-entry"
              >
                <span className="log-icon">{logIcon(entry)}</span>
                <span className="log-text">
                  {formatLogEntry(entry, matchData)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
