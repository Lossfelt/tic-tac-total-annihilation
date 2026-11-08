// Metadata for de strategiske våpnene, delt mellom spillregler (Game.js) og
// grensesnitt (Board.jsx). Selve reglene for hva et våpen gjør ligger i
// WEAPON_HANDLERS i Game.js, siden de trenger brettgeometrien der.
// Rekkefølgen er viktig: tilfeldig utdeling velger etter indeks.

export const BIO_DESTROY_CHANCE = 0.5;

export const WEAPONS = {
  Artillery: {
    icon: '💥',
    targetCount: 1,
    description: 'Destroys 1 target and its 4 orthogonal neighbours.',
    instruction: 'Select 1 target cell',
  },
  'Air Strike': {
    icon: '✈️',
    targetCount: 3,
    description:
      'Destroys 3 cells in a row (horizontal, vertical or diagonal).',
    instruction: 'Select 3 cells in a row',
  },
  'Biological Warfare': {
    icon: '☣️',
    targetCount: 1,
    description: `Each cell in a 3x3 area has a ${Math.round(BIO_DESTROY_CHANCE * 100)}% chance to be destroyed.`,
    instruction: 'Select 1 target cell (3x3 area)',
  },
  'Dirty Nuke': {
    icon: '☢️',
    targetCount: 1,
    description:
      'Permanently destroys 1 target cell. The cell cannot be claimed again.',
    instruction: 'Select 1 target cell',
  },
};

export const strategicWeapons = Object.keys(WEAPONS);
