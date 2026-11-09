// @vitest-environment jsdom

// Gjenopptakelse etter reload: en lagret økt brukes bare hvis matchen finnes.
// boardgame.io er mocket, så testen sier bare hva App gjør med svaret.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

const getMatch = vi.fn();

vi.mock('boardgame.io/dist/esm/react.js', () => {
  const MatchClient = () => <div data-testid="match-client" />;
  return { Client: () => MatchClient };
});
vi.mock('boardgame.io/dist/esm/multiplayer.js', () => ({
  SocketIO: () => ({}),
}));
vi.mock('boardgame.io/dist/esm/client.js', () => ({
  LobbyClient: class {
    getMatch(...args) {
      return getMatch(...args);
    }
  },
}));

const { default: App } = await import('./App.jsx');

const saved = {
  name: 'Ada',
  matchID: '123456',
  playerID: '0',
  credentials: 'secret',
};

beforeEach(() => {
  sessionStorage.clear();
  getMatch.mockReset();
});
afterEach(cleanup);

describe('App: gjenopptakelse', () => {
  it('går inn i matchen når den lagrede økten fortsatt finnes', async () => {
    sessionStorage.setItem('ttta-session', JSON.stringify(saved));
    getMatch.mockResolvedValue({
      players: [{ id: 0, name: 'Ada' }, { id: 1 }],
    });

    render(<App />);

    expect(await screen.findByTestId('match-client')).toBeDefined();
    expect(getMatch).toHaveBeenCalledWith('TicTacToe', '123456');
  });

  it('havner i lobbyen med melding når matchen er borte', async () => {
    sessionStorage.setItem('ttta-session', JSON.stringify(saved));
    getMatch.mockRejectedValue(new Error('404'));

    render(<App />);

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.getByRole('alert').textContent).toMatch(
      /no longer available/,
    );
    expect(screen.queryByTestId('match-client')).toBeNull();
    await waitFor(() =>
      expect(sessionStorage.getItem('ttta-session')).toBeNull(),
    );
  });

  it('gir opp når spilleren ikke lenger står i matchen', async () => {
    sessionStorage.setItem('ttta-session', JSON.stringify(saved));
    getMatch.mockResolvedValue({ players: [{ id: 0 }, { id: 1 }] });

    render(<App />);

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.queryByTestId('match-client')).toBeNull();
  });

  it('viser lobbyen uten kall når det ikke finnes en lagret økt', () => {
    render(<App />);

    expect(getMatch).not.toHaveBeenCalled();
    expect(screen.queryByTestId('match-client')).toBeNull();
  });
});
