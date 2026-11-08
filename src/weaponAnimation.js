// Tidsrammer for våpenanimasjonene. Brukes både av Board.jsx (som styrer når
// brettet byttes og når klikk igjen er tillatt) og av CSS-animasjonene via
// variabelen --nk-dur, slik at de aldri kommer ut av synk.
export const NUKE_DURATION_MS = 5500;

// Når brettet bytter fra "før" til "etter". Skal ligge på toppen av
// lysglimtet (ca. 5 % av varigheten), så spilleren ikke ser cellene forsvinne.
export const NUKE_IMPACT_MS = 300;
