// Strategien til datamotspilleren. Rene funksjoner uten tilstand, slik at
// de kan testes uten boardgame.io. `chooseAction` får hele spilltilstanden
// og returnerer ett trekk: { move, args }.
//
// Rekkefølgen er enkel og lett å lese:
//   1. Bruk våpenet hvis det treffer klart mer av motstanderen enn av oss.
//   2. Vinn hvis én celle mangler på en linje.
//   3. Blokker hvis motstanderen mangler én celle på en linje.
//   4. Ellers: ta eller invadere cellen med høyest verdi.
// Botten resirkulerer aldri våpen. Simuleringen viste at det sjelden lønner
// seg (se todo.md).

import {
  TOTAL_CELLS,
  LINES,
  IsRow,
  GetNeighbors,
  GetSurroundingCells,
} from './board.js';
import { INVASION_SUCCESS_CHANCE } from './Game.js';
import { BIO_DESTROY_CHANCE } from './weapons.js';

// Hvor mye en linje er verdt etter hvor mange celler en spiller har på den.
const BUILD_VALUE = [1, 3, 9, 40];
const BLOCK_VALUE = [0, 1.5, 6, 30];
// Laveste forventede gevinst (motstanderens celler minus egne) før botten
// bruker et våpen.
const WEAPON_THRESHOLD = 1.5;

const other = (playerID) => (playerID === '0' ? '1' : '0');

// Antall egne, motstanderens og tomme celler på en linje, og om linjen er
// ødelagt (en ødelagt celle gjør linjen umulig å vinne).
function lineCounts(G, line, me) {
  const counts = { mine: 0, theirs: 0, empty: 0, dead: false };
  for (const id of line) {
    if (G.destroyed[id]) counts.dead = true;
    else if (G.cells[id] === me) counts.mine++;
    else if (G.cells[id] === null) counts.empty++;
    else counts.theirs++;
  }
  return counts;
}

// Første linje der `who` har tre celler og den fjerde eies av `gapOwner`
// (null for tom). Returnerer { line, gap } eller null.
function nearlyWon(G, who, gapOwner) {
  for (const line of LINES) {
    const c = lineCounts(G, line, who);
    if (c.dead || c.mine !== 3) continue;
    const gap = line.find((id) => G.cells[id] !== who);
    if (G.cells[gap] === gapOwner) return { line, gap };
  }
  return null;
}

// En linje der `who` eier alle fire, men minst én er en fersk okkupasjon som
// ennå ikke teller (fortify). Returnerer { line, fresh } eller null.
function pendingWin(G, who) {
  if (!G.fresh) return null;
  for (const line of LINES) {
    if (!line.every((id) => G.cells[id] === who && !G.destroyed[id])) continue;
    const fresh = line.find((id) => G.fresh[id]);
    if (fresh !== undefined) return { line, fresh };
  }
  return null;
}

// Verdien av å eie en celle: hvor mye den bygger egne linjer og hvor mye
// den stenger motstanderens.
function cellValue(G, id, me) {
  let value = 0;
  for (const line of LINES) {
    if (!line.includes(id)) continue;
    const c = lineCounts(G, line, me);
    if (c.dead) continue;
    if (c.theirs === 0) value += BUILD_VALUE[c.mine];
    if (c.mine === 0) value += BLOCK_VALUE[c.theirs];
  }
  return value;
}

// Hvor mye en celle betyr for eieren: summen av linjene den er med på.
function ownerStake(G, id) {
  const owner = G.cells[id];
  if (owner === null) return 0;
  let stake = 0;
  for (const line of LINES) {
    if (!line.includes(id)) continue;
    const c = lineCounts(G, line, owner);
    if (!c.dead && c.theirs === 0) stake += BUILD_VALUE[c.mine - 1];
  }
  return stake;
}

// Beste vanlige trekk: ta en tom celle eller invadere en av motstanderens.
function bestCellMove(G, me, random) {
  const opponent = other(me);
  let best = null;
  for (let id = 0; id < TOTAL_CELLS; id++) {
    if (G.destroyed[id] || G.cells[id] === me) continue;
    let score = cellValue(G, id, me);
    if (G.cells[id] === opponent) {
      score = INVASION_SUCCESS_CHANCE * (score + ownerStake(G, id));
    }
    score += random() * 0.5;
    if (!best || score > best.score) best = { id, score };
  }
  return best && { move: 'clickCell', args: [best.id] };
}

// Gevinsten av å tømme cellene: motstanderens celler teller positivt, egne
// negativt, og celler på linjer som nesten er fullført teller ekstra.
function hitValue(G, ids, me, chance = 1) {
  let total = 0;
  for (const id of ids) {
    if (G.destroyed[id] || G.cells[id] === null) continue;
    const weight = 1 + ownerStake(G, id) / 20;
    total += G.cells[id] === me ? -1.3 * weight : weight;
  }
  return total * chance;
}

// Alle tre-på-rad (Air Strike), også de korte diagonalene.
function airStrikeTargets() {
  const targets = [];
  for (let a = 0; a < TOTAL_CELLS; a++) {
    for (let b = a + 1; b < TOTAL_CELLS; b++) {
      for (let c = b + 1; c < TOTAL_CELLS; c++) {
        if (IsRow([a, b, c])) targets.push([a, b, c]);
      }
    }
  }
  return targets;
}
const AIR_STRIKE_TARGETS = airStrikeTargets();

// Mulige mål for et våpen, med cellene som rammes og sjansen per celle.
function weaponTargets(G, weapon) {
  const cells = [...Array(TOTAL_CELLS).keys()];
  if (weapon === 'Air Strike') {
    return AIR_STRIKE_TARGETS.map((t) => ({ input: t, hits: t, chance: 1 }));
  }
  if (weapon === 'Artillery') {
    return cells.map((id) => ({
      input: id,
      hits: [id, ...GetNeighbors(id)],
      chance: 1,
    }));
  }
  if (weapon === 'Biological Warfare') {
    return cells.map((id) => ({
      input: id,
      hits: GetSurroundingCells(id),
      chance: BIO_DESTROY_CHANCE,
    }));
  }
  // Dirty Nuke: én celle, som også blir ødelagt for godt.
  return cells
    .filter((id) => !G.destroyed[id])
    .map((id) => ({ input: id, hits: [id], chance: 1, nuke: true }));
}

// Beste våpenmål ({ input, hits, chance, score }), eller null hvis ingen er
// god nok.
function bestWeaponMove(G, me) {
  const weapon = G.strategicWeapon[me];
  if (!weapon) return null;
  let best = null;
  for (const target of weaponTargets(G, weapon)) {
    let score = hitValue(G, target.hits, me, target.chance);
    // En nuke stenger linjene gjennom cellen for alltid.
    if (target.nuke) score += cellValue(G, target.input, other(me)) / 10;
    if (!best || score > best.score) best = { ...target, score };
  }
  if (!best || best.score < WEAPON_THRESHOLD) return null;
  return best;
}

// Fjerner våpenet sikkert minst én av motstanderens celler i linjen?
// Biologisk krigføring er tilfeldig og teller ikke.
function breaksLine(weapon, line) {
  return weapon.chance === 1 && weapon.hits.some((id) => line.includes(id));
}

export function chooseAction(G, me, random = Math.random) {
  const opponent = other(me);
  const win = nearlyWon(G, me, null) ?? nearlyWon(G, me, opponent);
  if (win) return { move: 'clickCell', args: [win.gap] };

  const weapon = bestWeaponMove(G, me);
  // Motstanderen har en hel linje som venter på å bli befestet (fortify):
  // bryt den med våpen, ellers prøv å ta tilbake den ferske cellen.
  const pending = pendingWin(G, opponent);
  if (pending) {
    if (weapon && breaksLine(weapon, pending.line)) {
      return { move: 'useStrategicWeapon', args: [weapon.input] };
    }
    return { move: 'clickCell', args: [pending.fresh] };
  }

  // En trussel blokkeres, med mindre våpenet sikkert bryter linjen.
  const threat = nearlyWon(G, opponent, null);
  if (threat && !(weapon && breaksLine(weapon, threat.line))) {
    return { move: 'clickCell', args: [threat.gap] };
  }
  if (weapon) return { move: 'useStrategicWeapon', args: [weapon.input] };
  return bestCellMove(G, me, random);
}
