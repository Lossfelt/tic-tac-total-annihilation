// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { WeaponIcon, RecycleIcon, RadiationIcon } from './icons.jsx';
import { strategicWeapons } from './weapons.js';

afterEach(cleanup);

describe('ikoner', () => {
  it.each(strategicWeapons)('har et ikon for %s', (weapon) => {
    const { container } = render(<WeaponIcon weapon={weapon} />);
    const svg = container.querySelector('svg');

    expect(svg).not.toBeNull();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('gir ingenting for et ukjent våpen', () => {
    const { container } = render(<WeaponIcon weapon="Ukjent" />);

    expect(container.firstChild).toBeNull();
  });

  it('tegner biofare-ikonet som én fylt bane på 48 x 48', () => {
    const { container } = render(<WeaponIcon weapon="Biological Warfare" />);
    const svg = container.querySelector('svg');
    const paths = container.querySelectorAll('path');

    expect(svg.getAttribute('viewBox')).toBe('0 0 48 48');
    expect(paths).toHaveLength(1);
    expect(paths[0].getAttribute('d')).not.toMatch(/NaN|undefined/);
  });

  it('tegner strålingssymbolet med tre sektorer og recycle med to piler', () => {
    const rad = render(<RadiationIcon />);
    expect(rad.container.querySelectorAll('path')).toHaveLength(3);
    cleanup();
    const rec = render(<RecycleIcon />);
    expect(rec.container.querySelectorAll('g')).toHaveLength(2);
  });
});
