import { describe, it, expect } from 'vitest';
import { formatLogEntry, logIcon } from './gameLog.js';

const matchData = [
  { id: 0, name: 'Levin' },
  { id: 1, name: 'Eva' },
];

describe('formatLogEntry', () => {
  it('bruker spillernavn fra matchData', () => {
    expect(
      formatLogEntry({ type: 'conquer', player: '0', cell: 3 }, matchData),
    ).toBe('Levin conquers Port Orchard');
    expect(
      formatLogEntry({ type: 'claim', player: '1', cell: 0 }, matchData),
    ).toBe('Eva claims the Salt Marches');
    expect(
      formatLogEntry({ type: 'fail', player: '1', cell: 3 }, matchData),
    ).toBe('Eva attempts to invade Port Orchard, but fails');
  });

  it('faller tilbake til "Player N" uten navn eller matchData', () => {
    const entry = { type: 'claim', player: '0', cell: 0 };

    expect(formatLogEntry(entry, [{}, {}])).toBe(
      'Player 0 claims the Salt Marches',
    );
    expect(formatLogEntry(entry, undefined)).toBe(
      'Player 0 claims the Salt Marches',
    );
  });

  it('formaterer revolt uten spillernavn', () => {
    expect(
      formatLogEntry({ type: 'revolt', player: '1', cell: 4 }, matchData),
    ).toBe('The people of Port Crater revolt against foreign rule');
  });

  it('formaterer recycle og alle våpen', () => {
    expect(
      formatLogEntry(
        { type: 'recycle', player: '0', weapon: 'Artillery', refund: 70 },
        matchData,
      ),
    ).toBe('Levin recycles Artillery and recovers 70% Rareium');
    expect(
      formatLogEntry(
        { type: 'Air Strike', player: '1', cells: [0, 1, 2] },
        matchData,
      ),
    ).toBe(
      "Eva launches an Air Strike at the Salt Marches, the Corn Belt Desert, Hudson's Pit",
    );
    expect(
      formatLogEntry(
        { type: 'Dirty Nuke', player: '0', cells: [0] },
        matchData,
      ),
    ).toContain('Levin detonates a Dirty Nuke at the Salt Marches');
    expect(
      formatLogEntry({ type: 'Artillery', player: '0', cells: [0] }, matchData),
    ).toContain('Artillery Strike');
    expect(
      formatLogEntry(
        { type: 'Biological Warfare', player: '0', cells: [0] },
        matchData,
      ),
    ).toContain('Biological Weapon');
  });
});

describe('logIcon', () => {
  it('bruker våpenikonet for våpen og egne ikoner for resten', () => {
    expect(logIcon({ type: 'Dirty Nuke' })).toBe('☢️');
    expect(logIcon({ type: 'claim' })).toBe('🚩');
    expect(logIcon({ type: 'revolt' })).toBe('✊');
    expect(logIcon({ type: 'ukjent' })).toBe('•');
  });
});
