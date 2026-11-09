// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameLog } from './GameLog.jsx';

afterEach(cleanup);

const log = [
  { type: 'conquer', player: '1', cell: 3 },
  { type: 'claim', player: '0', cell: 0 },
];
const matchData = [{ name: 'Levin' }, { name: 'Eva' }];

describe('GameLog', () => {
  it('viser alle oppføringer, nyeste først, med fraksjon og merke', () => {
    render(<GameLog log={log} matchData={matchData} />);

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toMatch(/CONQUER.*Eva conquers Port Orchard/);
    expect(rows[1].textContent).toMatch(/CLAIM.*Levin claims the Salt Marches/);
  });

  it('er sammenfoldet som standard, og knappen åpner og lukker den', async () => {
    const user = userEvent.setup();
    const { container } = render(<GameLog log={log} matchData={matchData} />);
    const toggle = screen.getByRole('button', { name: 'Show all' });
    const root = container.querySelector('.game-log');

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(root.classList.contains('game-log-collapsed')).toBe(true);

    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.textContent).toBe('Show less');
    expect(root.classList.contains('game-log-collapsed')).toBe(false);
  });

  it('kunngjør nye oppføringer i en live-region', () => {
    render(<GameLog log={log} matchData={matchData} />);

    expect(screen.getByRole('list').getAttribute('aria-live')).toBe('polite');
  });
});
