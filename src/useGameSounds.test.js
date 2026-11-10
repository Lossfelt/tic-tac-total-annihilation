// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameSounds, REVOLT_DELAY_MS } from './useGameSounds.js';
import { playSound } from './sound.js';

vi.mock('./sound.js', () => ({ playSound: vi.fn() }));

const makeG = (overrides = {}) => ({
  weaponEvent: { type: null, version: 0 },
  blinkVersion: 0,
  blinkKind: Array(16).fill(null),
  ...overrides,
});

const props = (G, extra = {}) => ({
  G,
  gameover: undefined,
  playerID: '0',
  armedCount: 0,
  ...extra,
});

describe('useGameSounds', () => {
  beforeEach(() => vi.clearAllMocks());

  it('spiller ingenting ved første visning', () => {
    const G = makeG({ blinkVersion: 3, blinkKind: ['claim', ...Array(15)] });
    renderHook(() => useGameSounds(props(G)));
    expect(playSound).not.toHaveBeenCalled();
  });

  it('spiller plasseringslyd for et vanlig trekk', () => {
    const { rerender } = renderHook((p) => useGameSounds(p), {
      initialProps: props(makeG()),
    });
    const kinds = Array(16).fill(null);
    kinds[5] = 'claim';
    rerender(props(makeG({ blinkVersion: 1, blinkKind: kinds })));
    expect(playSound).toHaveBeenCalledWith('place');
  });

  it('erobring går foran plassering i samme runde', () => {
    const { rerender } = renderHook((p) => useGameSounds(p), {
      initialProps: props(makeG()),
    });
    const kinds = Array(16).fill(null);
    kinds[1] = 'claim';
    kinds[2] = 'conquer';
    rerender(props(makeG({ blinkVersion: 1, blinkKind: kinds })));
    expect(playSound).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith('conquer');
  });

  it('spiller revolt litt etter trekklyden', () => {
    vi.useFakeTimers();
    const { rerender } = renderHook((p) => useGameSounds(p), {
      initialProps: props(makeG()),
    });
    const kinds = Array(16).fill(null);
    kinds[1] = 'claim';
    kinds[7] = 'revolt';
    rerender(props(makeG({ blinkVersion: 1, blinkKind: kinds })));
    expect(playSound).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith('place');
    vi.advanceTimersByTime(REVOLT_DELAY_MS + 10);
    expect(playSound).toHaveBeenLastCalledWith('revolt');
    vi.useRealTimers();
  });

  it('spiller våpenlyd, ikke trekklyd, når våpen brukes', () => {
    const { rerender } = renderHook((p) => useGameSounds(p), {
      initialProps: props(makeG()),
    });
    rerender(
      props(
        makeG({
          blinkVersion: 1,
          weaponEvent: { type: 'Dirty Nuke', version: 1 },
        }),
      ),
    );
    expect(playSound).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith('nuke');
  });

  it('spiller lyd når et våpen mottas', () => {
    const G = makeG();
    const { rerender } = renderHook((p) => useGameSounds(p), {
      initialProps: props(G),
    });
    rerender(props(G, { armedCount: 1 }));
    expect(playSound).toHaveBeenCalledWith('armed');
  });

  it('spiller seier eller tap når spillet er over', () => {
    vi.useFakeTimers();
    const G = makeG();
    const { rerender } = renderHook((p) => useGameSounds(p), {
      initialProps: props(G),
    });
    rerender(props(G, { gameover: { winner: '1' } }));
    vi.advanceTimersByTime(700);
    expect(playSound).toHaveBeenCalledWith('lose');
    vi.useRealTimers();
  });
});
