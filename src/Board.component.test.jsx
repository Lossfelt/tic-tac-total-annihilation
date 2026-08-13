// @vitest-environment jsdom

// Komponenttester for Board.js. Dekker bevisst bare interaksjonslogikken som
// er skjør: målvalget for strategiske våpen, og recycle-bekreftelsen.
// Presentasjon og layout er ikke testet, og skal ikke være det her.
//
// Spillreglene testes i Game.test.js. Her er `moves` en mock, så testene sier
// bare hva brettet ber serveren om, ikke hva serveren gjør med det.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicTacToeBoard } from './Board.jsx';

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
