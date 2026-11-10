import { BOARD_SIZE, TOTAL_CELLS, territories } from './Game.js';
import { FACTION_ICON, FACTION_NAME } from './factions.js';
import { RadiationIcon } from './icons.jsx';

// Kartkoordinat for en celle, A1 øverst til venstre.
const cellCoord = (id) =>
  'ABCD'[id % BOARD_SIZE] + (Math.floor(id / BOARD_SIZE) + 1);

// Selve brettet. `shown` er brettet slik animasjonen viser det akkurat nå,
// `weaponActive` er navnet på våpenet spilleren sikter med (eller false).
export function BoardGrid({
  shown,
  G,
  animating,
  winningLine,
  weaponActive,
  targets,
  isActive,
  onCellClick,
}) {
  const winningCells = new Set(winningLine ?? []);
  const cells = [];
  for (let id = 0; id < TOTAL_CELLS; id++) {
    const owner = shown.cells[id];
    const isDestroyed = shown.destroyed?.[id] ?? false;
    const isBlinking = !animating && G.blink[id];

    // En destroyed celle kan ikke nuke-es på nytt, men kan brukes som
    // sentrum for område-våpen (Artillery / Air Strike / Bio Warfare) for å
    // ramme cellene rundt.
    const blockedForSpecial = isDestroyed && weaponActive === 'Dirty Nuke';
    const isTargetable = weaponActive && !blockedForSpecial;

    const classes = ['cell'];
    if (owner === '0') classes.push('cell-queendom');
    if (owner === '1') classes.push('cell-canadia');
    if (isDestroyed) classes.push('cell-destroyed');
    if (isBlinking) classes.push('blink');
    const blinkKind = G.blinkKind?.[id];
    if (isBlinking && blinkKind) classes.push(`fx-${blinkKind}`);
    if (targets.includes(id)) classes.push('selected');
    if (isTargetable) classes.push('targetable');
    if (winningCells.has(id)) classes.push('winning');

    const buttonKey = isBlinking
      ? `cell-${id}-blink-${G.blinkVersion}`
      : `cell-${id}`;

    cells.push(
      <td key={id}>
        <button
          key={buttonKey}
          className={classes.join(' ')}
          type="button"
          style={{
            '--col': id % BOARD_SIZE,
            '--row': Math.floor(id / BOARD_SIZE),
          }}
          title={
            isDestroyed ? `${territories[id]} (destroyed)` : territories[id]
          }
          aria-label={`${territories[id]}: ${
            isDestroyed
              ? 'destroyed'
              : owner !== null
                ? FACTION_NAME[owner]
                : 'unclaimed'
          }`}
          onClick={() => onCellClick(id)}
          disabled={
            animating ||
            (isDestroyed && (!weaponActive || blockedForSpecial)) ||
            (!isActive && !weaponActive)
          }
        >
          <span className="cell-coord" aria-hidden="true">
            {cellCoord(id)}
          </span>
          {owner !== null && !isDestroyed && (
            <span className="cell-claim-mark" aria-hidden="true" />
          )}
          {isDestroyed ? (
            <span className="cell-destroyed-icon" aria-hidden="true">
              <RadiationIcon />
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

  const rows = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    rows.push(
      <tr key={row}>
        {cells.slice(row * BOARD_SIZE, (row + 1) * BOARD_SIZE)}
      </tr>,
    );
  }

  return (
    <table className="board">
      <tbody>{rows}</tbody>
    </table>
  );
}
