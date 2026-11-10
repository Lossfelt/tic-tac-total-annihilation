import { describe, it, expect } from 'vitest';
import { chooseAction } from './botStrategy.js';

// Brett som tekst, fire rader: '.' tom, '0' og '1' eier, 'x' ødelagt.
function makeG(rows, weapon = null) {
  const flat = rows.join('').split('');
  return {
    cells: flat.map((c) => (c === '0' || c === '1' ? c : null)),
    destroyed: flat.map((c) => c === 'x'),
    strategicWeapon: [null, weapon],
  };
}

const noise = () => 0;

describe('chooseAction', () => {
  it('fullfører egen linje når én celle mangler', () => {
    const G = makeG(['111.', '00..', '0...', '....']);
    expect(chooseAction(G, '1', noise)).toEqual({
      move: 'clickCell',
      args: [3],
    });
  });

  it('blokkerer motstanderen som mangler én celle', () => {
    const G = makeG(['000.', '1...', '1...', '....']);
    expect(chooseAction(G, '1', noise)).toEqual({
      move: 'clickCell',
      args: [3],
    });
  });

  it('ignorerer en linje med en ødelagt celle', () => {
    const G = makeG(['000x', '1...', '....', '....']);
    const { args } = chooseAction(G, '1', noise);
    expect(args[0]).not.toBe(3);
  });

  it('bruker artilleri der det rammer flest av motstanderens celler', () => {
    const G = makeG(['.0..', '000.', '.0..', '1...'], 'Artillery');
    expect(chooseAction(G, '1', noise)).toEqual({
      move: 'useStrategicWeapon',
      args: [5],
    });
  });

  it('sparer våpenet når det bare ville truffet egne celler', () => {
    const G = makeG(['11..', '....', '..0.', '....'], 'Artillery');
    expect(chooseAction(G, '1', noise).move).toBe('clickCell');
  });

  it('velger alltid et lovlig trekk på et nesten fullt brett', () => {
    const G = makeG(['0101', '1010', '0x01', '10x.']);
    const { move, args } = chooseAction(G, '1', noise);
    expect(move).toBe('clickCell');
    expect(G.destroyed[args[0]]).toBe(false);
    expect(G.cells[args[0]]).not.toBe('1');
  });
});
