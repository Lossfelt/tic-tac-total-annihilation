import './Board.css';
import './Effects.css';
import NukeAnimation from './NukeAnimation.jsx';
import AirStrikeAnimation from './AirStrikeAnimation.jsx';
import ArtilleryAnimation from './ArtilleryAnimation.jsx';
import BioAnimation from './BioAnimation.jsx';
import WinEffect from './WinEffect.jsx';
import { BoardGrid } from './BoardGrid.jsx';
import { WeaponPanel } from './WeaponPanel.jsx';
import { RareiumBar } from './RareiumBar.jsx';
import { GameLog } from './GameLog.jsx';
import { MatchStatus } from './MatchStatus.jsx';
import { FactionMark } from './FactionMark.jsx';
import { FACTION_NAME } from './factions.js';
import { useWeaponAnimation } from './useWeaponAnimation.js';
import { useJustArmed } from './useJustArmed.js';
import { useWeaponTargeting } from './useWeaponTargeting.js';

export function TicTacToeBoard({
  ctx,
  G,
  moves,
  matchID,
  matchData,
  playerID,
  isActive,
  onPlayAgain,
}) {
  const { anim, animating, shown } = useWeaponAnimation(G);
  const myWeapon = G.strategicWeapon[playerID];
  const armedCount = useJustArmed(myWeapon);
  const targeting = useWeaponTargeting(moves, myWeapon);

  const clickCell = (id) => {
    if (targeting.active) targeting.pick(id);
    else moves.clickCell(id);
  };

  const gameover = ctx.gameover;
  const winnerID = gameover?.winner;
  const nameOf = (id) => matchData[id]?.name || FACTION_NAME[id];
  const myTurn = ctx.currentPlayer === playerID;

  return (
    <div className="board-container">
      <div className="board-content">
        <h1 className="vs-banner">
          <span className="vs-side vs-queendom">
            <FactionMark playerID="0" size="1.2em" />
            {nameOf(0)}
          </span>
          <span className="vs-divider">vs</span>
          <span className="vs-side vs-canadia">
            {nameOf(1)}
            <FactionMark playerID="1" size="1.2em" />
          </span>
        </h1>

        <div className="board-main">
          <MatchStatus
            matchID={matchID}
            matchData={matchData}
            playerID={playerID}
          />

          <div className="board-wrapper">
            <BoardGrid
              shown={shown}
              G={G}
              animating={animating}
              winningLine={gameover?.winningLine}
              weaponActive={targeting.active}
              targets={targeting.targets}
              isActive={isActive}
              onCellClick={clickCell}
            />
            {anim?.type === 'Dirty Nuke' && (
              <NukeAnimation
                key={anim.event.version}
                version={anim.event.version}
              />
            )}
            {anim?.type === 'Biological Warfare' && (
              <BioAnimation key={anim.event.version} plan={anim.plan} />
            )}
            {anim?.type === 'Artillery' && (
              <ArtilleryAnimation key={anim.event.version} plan={anim.plan} />
            )}
            {anim?.type === 'Air Strike' && (
              <AirStrikeAnimation key={anim.event.version} plan={anim.plan} />
            )}
            {gameover && (
              <WinEffect
                winnerID={winnerID}
                winningLine={gameover.winningLine}
              />
            )}
            {gameover && (
              <div
                role="status"
                className={`winner-overlay winner-overlay-${winnerID} ${
                  gameover.winningLine ? 'winner-overlay-after-line' : ''
                }`}
              >
                <div className="winner-overlay-name">{nameOf(winnerID)}</div>
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
        </div>

        <div className="board-side">
          {!gameover && (
            <>
              <div
                className={`turn-indicator ${myTurn ? 'turn-indicator-mine' : ''}`}
                role="status"
              >
                <span className="turn-label">Current turn:</span>
                <span
                  className={`turn-name ${
                    ctx.currentPlayer === '0' ? 'queendom' : 'canadia'
                  }`}
                >
                  {nameOf(ctx.currentPlayer)}{' '}
                  <FactionMark playerID={ctx.currentPlayer} />
                </span>
              </div>
              <div className="command-panel">
                <WeaponPanel
                  G={G}
                  moves={moves}
                  playerID={playerID}
                  isActive={isActive}
                  animating={animating}
                  armedCount={armedCount}
                  targeting={targeting}
                />
                <RareiumBar rareium={G.Rareium[playerID]} />
              </div>
            </>
          )}

          <GameLog log={G.log} matchData={matchData} />
        </div>
      </div>
    </div>
  );
}
