// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QrCode } from './QrCode.jsx';

afterEach(cleanup);

describe('QrCode', () => {
  it('tegner en SVG med navn og kvadratisk viewBox', () => {
    render(<QrCode value="http://localhost:3000/?match=123456" label="Join" />);

    const svg = screen.getByRole('img', { name: 'Join' });
    const [, , w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
    expect(w).toBe(h);
    expect(w).toBeGreaterThan(20);
  });

  it('har søkemønsteret i tre hjørner og ingenting i det fjerde', () => {
    const { container } = render(
      <QrCode value="https://example.com/?match=1" />,
    );
    const d = container.querySelector('path').getAttribute('d');
    const [, , total] = container
      .querySelector('svg')
      .getAttribute('viewBox')
      .split(' ')
      .map(Number);
    const dark = new Set(
      [...d.matchAll(/M(\d+) (\d+)h1v1h-1z/g)].map((m) => `${m[1]},${m[2]}`),
    );
    const isDark = (x, y) => dark.has(`${x},${y}`);
    const first = 4; // stille sone
    const last = total - 5;

    // Øverste rad i hvert søkemønster er helt mørk (7 moduler).
    for (let i = 0; i < 7; i++) {
      expect(isDark(first + i, first)).toBe(true); // øverst til venstre
      expect(isDark(last - i, first)).toBe(true); // øverst til høyre
      expect(isDark(first + i, last)).toBe(true); // nederst til venstre
    }
  });

  it('gir ulik kode for ulik adresse', () => {
    const a = render(<QrCode value="https://example.com/?match=111111" />);
    const pathA = a.container.querySelector('path').getAttribute('d');
    cleanup();
    const b = render(<QrCode value="https://example.com/?match=222222" />);

    expect(b.container.querySelector('path').getAttribute('d')).not.toBe(pathA);
  });
});
