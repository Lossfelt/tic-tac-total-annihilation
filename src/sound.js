// Enkel lydavspilling. Lydfilene ligger i public/sounds og er laget med
// ElevenLabs. Valget om mute huskes i localStorage, men alt fungerer uten
// lagring (privat modus, blokkerte data).

const KEY = 'ttta-muted';
const VOLUME = 0.6;
// Justering per lyd (1 = standard), for lyder som ble for sterke eller svake.
const GAIN = { conquer: 0.6 };

export const SOUNDS = [
  'place',
  'conquer',
  'fail',
  'revolt',
  'armed',
  'nuke',
  'bio',
  'artillery',
  'jet',
  'boom',
  'win',
  'lose',
];

let muted = readMuted();
const listeners = new Set();

function readMuted() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export const isMuted = () => muted;

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem(KEY, value ? '1' : '0');
  } catch {
    // Lagring er valgfri.
  }
  listeners.forEach((fn) => fn());
}

export function subscribeMuted(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Spiller en lyd én gang og gir tilbake Audio-elementet (eller null), så kallet
// kan stoppe den tidlig. Feiler stille hvis nettleseren blokkerer avspilling
// (ingen klikk ennå) eller miljøet ikke har Audio (tester).
export function playSound(name) {
  if (muted || typeof Audio === 'undefined') return null;
  try {
    const audio = new Audio(`/sounds/${name}.mp3`);
    audio.volume = VOLUME * (GAIN[name] ?? 1);
    audio.play()?.catch(() => {});
    return audio;
  } catch {
    // Lyd er valgfri.
    return null;
  }
}
