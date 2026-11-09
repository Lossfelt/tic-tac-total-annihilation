import { FACTION_ICON, FACTION_NAME } from './factions.js';

export const FactionMark = ({ playerID, size = '1em' }) => (
  <img
    src={FACTION_ICON[playerID]}
    alt={FACTION_NAME[playerID]}
    style={{ height: size, width: 'auto', verticalAlign: 'middle' }}
  />
);
