// @vitest-environment jsdom

// Komponenttester for Board.js. Dekker bevisst bare interaksjonslogikken som
// er skjør: målvalget for strategiske våpen, og recycle-bekreftelsen.
// Presentasjon og layout er ikke testet, og skal ikke være det her.
//
// Spillreglene testes i Game.test.js. Her er `moves` en mock, så testene sier
// bare hva brettet ber serveren om, ikke hva serveren gjør med det.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act } from 'react';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicTacToeBoard } from './Board.jsx';
import {
  NUKE_DURATION_MS,
  NUKE_IMPACT_MS,
  getWeaponTiming,
} from './weaponAnimation.js';

afterEach(cleanup);

// Minimal, gyldig spilltilstand. Testene overstyrer bare det de bryr seg om.
function makeProps(overrides = {}) {
  const { G: gOverrides, ctx: ctxOverrides, ...rest } = overrides;
  return {
    G: {
      cells: Array(16).fill(null),
      destroyed: Array(16).fill(false),
      blink: Array(16).fill(false),
      blinkVersion: 0,
      log: [],
      Rareium: { 0: 50, 1: 50 },
      rareiumAtWeapon: { 0: 100, 1: 100 },
      strategicWeapon: { 0: null, 1: null },
      weaponEvent: { type: null, cells: [], before: null, version: 0 },
      ...gOverrides,
    },
    ctx: { currentPlayer: '0', gameover: null, ...ctxOverrides },
    matchData: [{ name: 'Queendom' }, { name: 'Canadia' }],
    playerID: '0',
    isActive: true,
    moves: {
      clickCell: vi.fn(),
      useStrategicWeapon: vi.fn(),
      recycleStrategicWeapon: vi.fn(),
    },
    onPlayAgain: vi.fn(),
    ...rest,
  };
}

const armed = (weapon, overrides = {}) =>
  makeProps({ G: { strategicWeapon: { 0: weapon, 1: null } }, ...overrides });

// Cellene er knapper med territorienavn som tilgjengelig navn, så vi henter
// dem på posisjon i stedet for på tekst.
const cellButtons = () =>
  screen.getAllByRole('button').filter((b) => b.className.includes('cell'));

const clickCells = async (user, ids) => {
  for (const id of ids) {
    await user.click(cellButtons()[id]);
  }
};

const armWeapon = async (user) => {
  await user.click(
    screen.getByRole('button', {
      name: /Air Strike|Artillery|Biological|Dirty Nuke/,
    }),
  );
};

describe('strategiske våpen: målvalg', () => {
  it('sender et enkelt mål som id, ikke som array', async () => {
    const user = userEvent.setup();
    const props = armed('Artillery');
    render(<TicTacToeBoard {...props} />);

    await armWeapon(user);
    await clickCells(user, [5]);

    expect(props.moves.useStrategicWeapon).toHaveBeenCalledWith(5);
  });

  it('sender flere mål som array når våpenet krever det', async () => {
    const user = userEvent.setup();
    const props = armed('Air Strike'); // krever 3 mål
    render(<TicTacToeBoard {...props} />);

    await armWeapon(user);
    await clickCells(user, [0, 1, 2]);

    expect(props.moves.useStrategicWeapon).toHaveBeenCalledWith([0, 1, 2]);
  });

  it('avfyrer ikke før alle målene er valgt', async () => {
    const user = userEvent.setup();
    const props = armed('Air Strike');
    render(<TicTacToeBoard {...props} />);

    await armWeapon(user);
    await clickCells(user, [0, 1]);

    expect(props.moves.useStrategicWeapon).not.toHaveBeenCalled();
    expect(screen.getByText('2 / 3 selected')).toBeDefined();
  });

  // Regresjonstest: trekket ble tidligere sendt fra en useEffect som reagerte
  // på at mållisten ble full. Kjørte effekten på nytt, ble trekket sendt to
  // ganger. Nå avfyres det fra klikk-handleren, som bare skjer én gang.
  it('sender trekket nøyaktig én gang', async () => {
    const user = userEvent.setup();
    const props = armed('Artillery');
    render(<TicTacToeBoard {...props} />);

    await armWeapon(user);
    await clickCells(user, [5]);

    expect(props.moves.useStrategicWeapon).toHaveBeenCalledTimes(1);
  });

  it('går tilbake til vanlige trekk etter at våpenet er brukt', async () => {
    const user = userEvent.setup();
    const props = armed('Artillery');
    render(<TicTacToeBoard {...props} />);

    await armWeapon(user);
    await clickCells(user, [5]);
    await clickCells(user, [7]);

    expect(props.moves.clickCell).toHaveBeenCalledWith(7);
    expect(props.moves.useStrategicWeapon).toHaveBeenCalledTimes(1);
  });

  it('lar spilleren angre våpenvalget uten å sende et trekk', async () => {
    const user = userEvent.setup();
    const props = armed('Air Strike');
    render(<TicTacToeBoard {...props} />);

    await armWeapon(user);
    await clickCells(user, [0]);
    await armWeapon(user); // klikk igjen deaktiverer
    await clickCells(user, [3]);

    expect(props.moves.useStrategicWeapon).not.toHaveBeenCalled();
    expect(props.moves.clickCell).toHaveBeenCalledWith(3);
  });

  it('lar spilleren fjerne et valgt Air Strike-mål', async () => {
    const user = userEvent.setup();
    const props = armed('Air Strike');
    render(<TicTacToeBoard {...props} />);

    await armWeapon(user);
    await clickCells(user, [0, 1, 0]);

    expect(screen.getByText('1 / 3 selected')).toBeDefined();
  });

  it('beholder valget og viser melding når Air Strike ikke er på rad', async () => {
    const user = userEvent.setup();
    const props = armed('Air Strike');
    render(<TicTacToeBoard {...props} />);

    await armWeapon(user);
    await clickCells(user, [0, 1, 5]);

    expect(props.moves.useStrategicWeapon).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/straight line/);
    expect(screen.getByText('3 / 3 selected')).toBeDefined();

    // Retter valget: fjern 5, velg 2.
    await clickCells(user, [5, 2]);
    expect(props.moves.useStrategicWeapon).toHaveBeenCalledWith([0, 1, 2]);
  });
});

describe('recycle-bekreftelse', () => {
  const openConfirm = async (user) =>
    user.click(
      screen.getByRole('button', { name: 'Recycle strategic weapon' }),
    );

  const confirmDialog = () => screen.queryByRole('alertdialog');

  it('ber om bekreftelse før våpenet resirkuleres', async () => {
    const user = userEvent.setup();
    const props = armed('Artillery');
    render(<TicTacToeBoard {...props} />);

    await openConfirm(user);

    expect(confirmDialog()).not.toBeNull();
    expect(props.moves.recycleStrategicWeapon).not.toHaveBeenCalled();

    await user.click(
      within(confirmDialog()).getByRole('button', { name: 'Recycle' }),
    );

    expect(props.moves.recycleStrategicWeapon).toHaveBeenCalledTimes(1);
    expect(confirmDialog()).toBeNull();
  });

  it('avbryter uten å resirkulere', async () => {
    const user = userEvent.setup();
    const props = armed('Artillery');
    render(<TicTacToeBoard {...props} />);

    await openConfirm(user);
    await user.click(
      within(confirmDialog()).getByRole('button', { name: 'Cancel' }),
    );

    expect(props.moves.recycleStrategicWeapon).not.toHaveBeenCalled();
    expect(confirmDialog()).toBeNull();
  });

  // Dette er grunnen til at Board.js beholder en useEffect med en
  // eslint-disable for react-hooks/set-state-in-effect. Forsvinner våpenet
  // mens dialogen står åpen, må flagget nullstilles, ellers spretter dialogen
  // opp igjen av seg selv neste gang spilleren får et våpen.
  it('lukker dialogen, og husker den ikke, når våpenet forsvinner', async () => {
    const user = userEvent.setup();
    const props = armed('Artillery');
    const { rerender } = render(<TicTacToeBoard {...props} />);

    await openConfirm(user);
    expect(confirmDialog()).not.toBeNull();

    // Våpenet blir brukt opp, eller turen går til en spiller uten våpen.
    const disarmed = {
      ...props,
      G: { ...props.G, strategicWeapon: { 0: null, 1: null } },
    };
    rerender(<TicTacToeBoard {...disarmed} />);
    expect(confirmDialog()).toBeNull();

    // Spilleren får et nytt våpen. Dialogen skal ikke komme tilbake av seg selv.
    rerender(<TicTacToeBoard {...props} />);
    expect(confirmDialog()).toBeNull();
  });
});

describe('Dirty Nuke-animasjon', () => {
  const nukeEvent = (version, before) => ({
    type: 'Dirty Nuke',
    cells: [5],
    version,
    before,
  });
  // Brettet etter treffet: celle 5 er ødelagt. Før: eid av spiller 1.
  const afterG = (version) => ({
    destroyed: Object.assign(Array(16).fill(false), { 5: true }),
    weaponEvent: nukeEvent(version, {
      cells: Object.assign(Array(16).fill(null), { 5: '1' }),
      destroyed: Array(16).fill(false),
    }),
  });
  const overlay = () => screen.queryByTestId('nuke-animation');

  afterEach(() => vi.useRealTimers());

  it('spiller ikke av en gammel hendelse ved første visning', () => {
    render(<TicTacToeBoard {...makeProps({ G: afterG(3) })} />);

    expect(overlay()).toBeNull();
  });

  it('spiller av animasjonen når en ny hendelse kommer', () => {
    const props = makeProps();
    const { rerender } = render(<TicTacToeBoard {...props} />);

    rerender(<TicTacToeBoard {...makeProps({ G: afterG(1) })} />);

    expect(overlay()).not.toBeNull();
  });

  it('viser brettet fra før treffet frem til lysglimtet, så det nye', () => {
    vi.useFakeTimers();
    const { rerender } = render(<TicTacToeBoard {...makeProps()} />);
    rerender(<TicTacToeBoard {...makeProps({ G: afterG(1) })} />);

    // Før treffet: cellen er eid, ikke ødelagt.
    expect(cellButtons()[5].className).toContain('cell-canadia');
    expect(cellButtons()[5].className).not.toContain('cell-destroyed');

    act(() => vi.advanceTimersByTime(NUKE_IMPACT_MS));

    expect(cellButtons()[5].className).toContain('cell-destroyed');
    expect(cellButtons()[5].className).not.toContain('cell-canadia');
    expect(overlay()).not.toBeNull();
  });

  it('blokkerer trekk mens animasjonen går, og slipper dem etterpå', () => {
    vi.useFakeTimers();
    const { rerender } = render(<TicTacToeBoard {...makeProps()} />);
    rerender(<TicTacToeBoard {...makeProps({ G: afterG(1) })} />);

    expect(cellButtons()[0].disabled).toBe(true);

    // Fasene går i to steg, og hvert steg registrerer neste timer etter render.
    act(() => vi.advanceTimersByTime(NUKE_IMPACT_MS));
    act(() => vi.advanceTimersByTime(NUKE_DURATION_MS - NUKE_IMPACT_MS));

    expect(overlay()).toBeNull();
    expect(cellButtons()[0].disabled).toBe(false);
  });

  it('animerer ikke andre våpen enn Dirty Nuke', () => {
    const { rerender } = render(<TicTacToeBoard {...makeProps()} />);
    const G = afterG(1);
    G.weaponEvent.type = 'Artillery';

    rerender(<TicTacToeBoard {...makeProps({ G })} />);

    expect(overlay()).toBeNull();
  });
});

describe('seierseffekt', () => {
  const won = (extra) =>
    makeProps({
      ctx: { currentPlayer: '0', gameover: { winner: '0', ...extra } },
    });

  it('tegner en strek gjennom vinnercellene', () => {
    render(<TicTacToeBoard {...won({ winningLine: [4, 5, 6, 7] })} />);

    expect(screen.getByTestId('win-line')).not.toBeNull();
  });

  it('viser bare glør, ingen strek, ved seier ved dominans', () => {
    render(<TicTacToeBoard {...won({})} />);

    expect(screen.getByTestId('win-effect')).not.toBeNull();
    expect(screen.queryByTestId('win-line')).toBeNull();
  });

  it('lar vinnerteksten vente på streken bare når det finnes en linje', () => {
    const { container, rerender } = render(
      <TicTacToeBoard {...won({ winningLine: [4, 5, 6, 7] })} />,
    );
    const overlay = () => container.querySelector('.winner-overlay');
    expect(overlay().className).toContain('winner-overlay-after-line');

    rerender(<TicTacToeBoard {...won({})} />);
    expect(overlay().className).not.toContain('winner-overlay-after-line');
  });

  it('viser ingen seierseffekt før spillet er over', () => {
    render(<TicTacToeBoard {...makeProps()} />);

    expect(screen.queryByTestId('win-effect')).toBeNull();
  });
});

describe('våpen mottatt', () => {
  const weaponButton = () =>
    screen.getByRole('button', {
      name: /Dirty Nuke|Air Strike|Artillery|Biological|No weapon/,
    });

  it('har ingen effekt på et våpen som allerede finnes ved første visning', () => {
    render(<TicTacToeBoard {...armed('Artillery')} />);

    expect(weaponButton().className).not.toContain('just-armed');
  });

  it('spiller effekten når spilleren får et nytt våpen', () => {
    const { rerender } = render(<TicTacToeBoard {...makeProps()} />);

    rerender(<TicTacToeBoard {...armed('Artillery')} />);

    expect(weaponButton().className).toContain('just-armed');
  });

  it('fjerner effekten når våpenet er brukt', () => {
    const { rerender } = render(<TicTacToeBoard {...makeProps()} />);
    rerender(<TicTacToeBoard {...armed('Artillery')} />);

    rerender(<TicTacToeBoard {...makeProps()} />);

    expect(weaponButton().className).not.toContain('just-armed');
  });
});

describe('Air Strike-animasjon', () => {
  const ids = [4, 5, 6];
  const event = {
    type: 'Air Strike',
    cells: ids,
    version: 1,
    before: {
      cells: ids.reduce(
        (cells, i) => Object.assign(cells, { [i]: '0' }),
        Array(16).fill(null),
      ),
      destroyed: Array(16).fill(false),
    },
  };
  const timing = getWeaponTiming(event);
  const owned = (id) => cellButtons()[id].className.includes('cell-queendom');
  const overlay = () => screen.queryByTestId('air-strike-animation');

  afterEach(() => vi.useRealTimers());

  it('tømmer cellene én og én når bombene treffer', () => {
    vi.useFakeTimers();
    const { rerender } = render(<TicTacToeBoard {...makeProps()} />);
    rerender(<TicTacToeBoard {...makeProps({ G: { weaponEvent: event } })} />);

    expect(overlay()).not.toBeNull();
    expect(ids.every(owned)).toBe(true);

    act(() => vi.advanceTimersByTime(timing.hits[0].t));
    expect(owned(4)).toBe(false);
    expect(owned(5)).toBe(true);
    expect(owned(6)).toBe(true);

    act(() => vi.advanceTimersByTime(timing.hits[1].t - timing.hits[0].t));
    expect(owned(5)).toBe(false);
    expect(owned(6)).toBe(true);
  });

  it('bytter til det nye brettet og slipper trekk når animasjonen er ferdig', () => {
    vi.useFakeTimers();
    const { rerender } = render(<TicTacToeBoard {...makeProps()} />);
    rerender(<TicTacToeBoard {...makeProps({ G: { weaponEvent: event } })} />);

    expect(cellButtons()[0].disabled).toBe(true);

    act(() => vi.advanceTimersByTime(timing.durationMs));

    expect(overlay()).toBeNull();
    expect(cellButtons()[0].disabled).toBe(false);
  });
});

describe('tilgjengelighet', () => {
  it('gir hver celle et navn med territorium og status', () => {
    const cells = Array(16).fill(null);
    cells[1] = '0';
    cells[2] = '1';
    const destroyed = Array(16).fill(false);
    destroyed[3] = true;
    render(<TicTacToeBoard {...makeProps({ G: { cells, destroyed } })} />);

    expect(
      screen.getByRole('button', { name: 'the Salt Marches: unclaimed' }),
    ).toBeDefined();
    expect(
      screen.getByRole('button', {
        name: 'the Corn Belt Desert: Mexican Queendom',
      }),
    ).toBeDefined();
    expect(
      screen.getByRole('button', {
        name: "Hudson's Pit: Pan-Canadia Inuit Alliance",
      }),
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Port Orchard: destroyed' }),
    ).toBeDefined();
  });

  it('kunngjør turbytte og logg i live-regioner', () => {
    render(<TicTacToeBoard {...makeProps()} />);

    expect(screen.getByRole('status').textContent).toMatch(/Current turn/);
    expect(
      document.querySelector('.game-log ul').getAttribute('aria-live'),
    ).toBe('polite');
  });

  it('kunngjør vinneren', () => {
    const ctx = { gameover: { winner: '1' } };
    render(<TicTacToeBoard {...makeProps({ ctx })} />);

    expect(screen.getByRole('status').textContent).toMatch(/Canadia/);
  });
});

describe('matchstatus', () => {
  const status = () => document.querySelector('.match-status');

  it('viser ventemelding med match-ID når motstanderen ikke har blitt med', () => {
    const props = makeProps({
      matchID: '123456',
      matchData: [{ id: 0, name: 'Queendom' }, { id: 1 }],
    });
    render(<TicTacToeBoard {...props} />);

    expect(status().textContent).toMatch(/Waiting for an opponent/);
    expect(status().textContent).toMatch(/123456/);
  });

  it('varsler når motstanderen er frakoblet', () => {
    const props = makeProps({
      matchData: [
        { id: 0, name: 'Queendom', isConnected: true },
        { id: 1, name: 'Canadia', isConnected: false },
      ],
    });
    render(<TicTacToeBoard {...props} />);

    expect(status().textContent).toMatch(/Canadia disconnected/);
  });

  it('viser ingenting når begge spillerne er tilkoblet', () => {
    const props = makeProps({
      matchData: [
        { id: 0, name: 'Queendom', isConnected: true },
        { id: 1, name: 'Canadia', isConnected: true },
      ],
    });
    render(<TicTacToeBoard {...props} />);

    expect(status()).toBeNull();
  });
});
