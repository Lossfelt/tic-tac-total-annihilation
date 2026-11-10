import { useEffect, useRef } from 'react';
import { playSound } from './sound.js';

const WEAPON_SOUND = {
  'Dirty Nuke': 'nuke',
  'Biological Warfare': 'bio',
  Artillery: 'artillery',
  'Air Strike': 'airstrike',
};

// Lyden for et vanlig trekk. Erobring slår mislykket invasjon og revolt, som
// slår vanlig plassering.
const KIND_PRIORITY = ['conquer', 'fail', 'revolt', 'claim'];
const KIND_SOUND = {
  conquer: 'conquer',
  fail: 'fail',
  revolt: 'revolt',
  claim: 'place',
};

function moveSound(blinkKind) {
  const kind = KIND_PRIORITY.find((k) => blinkKind?.includes(k));
  return kind ? KIND_SOUND[kind] : null;
}

// Spiller lyd når noe nytt skjer. Alle verdiene starter på det de er ved
// første visning, så en reload eller sen tilkobling spiller ikke av gamle
// hendelser. Spilleren (eller tilskueren) får samme lyder som animasjonene.
export function useGameSounds({ G, gameover, playerID, armedCount }) {
  const weaponVersion = G.weaponEvent?.version ?? 0;
  const weaponType = G.weaponEvent?.type;
  const prev = useRef({
    weaponVersion,
    blinkVersion: G.blinkVersion,
    armedCount,
    gameover: Boolean(gameover),
  });

  useEffect(() => {
    const p = prev.current;
    if (weaponVersion !== p.weaponVersion) {
      const sound = WEAPON_SOUND[weaponType];
      if (sound) playSound(sound);
    } else if (G.blinkVersion !== p.blinkVersion) {
      const sound = moveSound(G.blinkKind);
      if (sound) playSound(sound);
    }
    p.weaponVersion = weaponVersion;
    p.blinkVersion = G.blinkVersion;
  }, [weaponVersion, weaponType, G.blinkVersion, G.blinkKind]);

  useEffect(() => {
    if (armedCount > prev.current.armedCount) playSound('armed');
    prev.current.armedCount = armedCount;
  }, [armedCount]);

  useEffect(() => {
    const over = Boolean(gameover);
    if (over && !prev.current.gameover) {
      const iLost = playerID != null && gameover.winner !== playerID;
      // Litt forsinkelse, så seierslinjen og siste animasjon får lyde først.
      const timer = setTimeout(() => playSound(iLost ? 'lose' : 'win'), 600);
      prev.current.gameover = over;
      return () => clearTimeout(timer);
    }
    prev.current.gameover = over;
    return undefined;
  }, [gameover, playerID]);
}
