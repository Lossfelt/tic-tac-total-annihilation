// @vitest-environment jsdom

// Røyktest for modulnivå-oppsettet i App.jsx. Filen kaller Client(),
// SocketIO() og new LobbyClient() med én gang den importeres, så en feil i
// boardgame.io-importene slår ut her og ikke først i nettleseren.
//
// Grunnen til at dette er verdt en egen test: vi importerer ESM-byggene
// (boardgame.io/dist/esm/...) i stedet for CJS, fordi rolldown i Vite 8 ikke
// klarer å tree-shake bort det Svelte-baserte debug-panelet fra CJS-byggene.
// Se README under "Avhengigheter og sikkerhet".
import { describe, it, expect } from 'vitest';

describe('App-oppsett', () => {
  it('kan importeres, med boardgame.io-klienten satt opp', async () => {
    const mod = await import('./App.jsx');
    expect(typeof mod.default).toBe('function');
  });
});
