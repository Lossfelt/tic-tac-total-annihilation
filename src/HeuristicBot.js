import { Bot } from 'boardgame.io/dist/esm/ai.js';
import { chooseAction } from './botStrategy.js';
import { getWeaponTiming } from './weaponAnimation.js';

// Hvor lenge botten "tenker" før et vanlig trekk, i millisekunder.
const THINK_MS = 900;

// Samme form som boardgame.io sin interne makeMove, som ikke eksporteres.
const makeMove = (type, args, playerID) => ({
  type: 'MAKE_MOVE',
  payload: { type, args, playerID },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Datamotspilleren i lokal modus (boardgame.io sin Local-transport). Selve
// valget ligger i botStrategy.js. Her venter vi bare til animasjonen av
// forrige trekk er ferdig, så spilleren rekker å se hva som skjedde.
export class HeuristicBot extends Bot {
  constructor(options) {
    super(options);
    this.seenWeaponVersion = 0;
  }

  // Ventetid: tenketid, pluss lengden på en våpenanimasjon som nettopp
  // startet (spillerens eller bottens egen fra forrige tur).
  waitFor(G) {
    const event = G.weaponEvent;
    let wait = THINK_MS;
    if (event?.type && event.version !== this.seenWeaponVersion) {
      wait += getWeaponTiming(event)?.durationMs ?? 0;
    }
    this.seenWeaponVersion = event?.version ?? 0;
    return wait;
  }

  async play({ G }, playerID) {
    await sleep(this.waitFor(G));
    const choice = chooseAction(G, playerID, () => this.random());
    return { action: makeMove(choice.move, choice.args, playerID) };
  }
}
