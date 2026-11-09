// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AboutPopup from './AboutPopup.jsx';

afterEach(cleanup);

describe('AboutPopup', () => {
  it('flytter fokus inn i dialogen og tilbake når den lukkes', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const { unmount } = render(<AboutPopup onClose={() => {}} />);
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Close' }),
    );

    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('holder Tab innenfor dialogen', async () => {
    const user = userEvent.setup();
    render(<AboutPopup onClose={() => {}} />);
    const close = screen.getByRole('button', { name: 'Close' });

    // Close er eneste fokuserbare element, så Tab og Shift+Tab blir her.
    await user.tab();
    expect(document.activeElement).toBe(close);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(close);
  });

  it('lukkes med Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AboutPopup onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
