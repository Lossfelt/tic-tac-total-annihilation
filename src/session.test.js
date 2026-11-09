// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSession, saveSession, clearSession } from './session.js';

const session = {
  name: 'Ada',
  matchID: '123456',
  playerID: '0',
  credentials: 'secret',
};

describe('session', () => {
  beforeEach(() => sessionStorage.clear());

  it('gir null når ingenting er lagret', () => {
    expect(loadSession()).toBeNull();
  });

  it('lagrer og leser tilbake plassen, også for spiller 0', () => {
    saveSession(session);

    expect(loadSession()).toEqual(session);
  });

  it('fjerner plassen', () => {
    saveSession(session);
    clearSession();

    expect(loadSession()).toBeNull();
  });

  it('ignorerer ugyldig eller ufullstendig innhold', () => {
    sessionStorage.setItem('ttta-session', '{ikke json');
    expect(loadSession()).toBeNull();

    sessionStorage.setItem('ttta-session', JSON.stringify({ matchID: '1' }));
    expect(loadSession()).toBeNull();
  });
});
