// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Lobby from './Lobby.jsx';

afterEach(cleanup);

const renderLobby = (props = {}) =>
  render(
    <Lobby
      name="Ada"
      pendingAction={null}
      lobbyError=""
      onSubmitName={() => {}}
      onCreate={() => {}}
      onJoin={() => {}}
      {...props}
    />,
  );

describe('Lobby', () => {
  it('fyller ut match-ID fra invitasjonslenken og bruker den ved Join', async () => {
    const onJoin = vi.fn();
    renderLobby({ initialMatchID: '654321', onJoin });

    expect(screen.getByPlaceholderText('Match ID').value).toBe('654321');
    expect(screen.getByText('you were invited')).toBeDefined();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Join' }));
    expect(onJoin).toHaveBeenCalledWith('654321');
  });

  it('viser aske bak lobbyen, skjult for skjermlesere', () => {
    renderLobby();

    const ash = screen.getByTestId('lobby-ash');
    expect(ash.getAttribute('aria-hidden')).toBe('true');
    expect(ash.children.length).toBeGreaterThan(10);
  });

  it('har tomt felt uten invitasjon', () => {
    renderLobby();

    expect(screen.getByPlaceholderText('Match ID').value).toBe('');
    expect(screen.getByText('or join existing')).toBeDefined();
  });

  it('ber om navn før noe annet', async () => {
    const onSubmitName = vi.fn();
    renderLobby({ name: '', onSubmitName });
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Enter your name'), 'Eva');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmitName).toHaveBeenCalledWith('Eva');
  });
});
