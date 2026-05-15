import { Server, Origins } from 'boardgame.io/dist/cjs/server.js';
import { TicTacToe } from './Game.js';
import { nanoid } from 'nanoid';

// I prod settes FRONTEND_URL til Netlify-URL-en på Render. Lokalt utelater vi
// den og lar Origins.LOCALHOST tillate alt på localhost. FRONTEND_URL kan
// være komma-separert hvis du vil tillate flere origins (f.eks.
// Netlify-preview-deploys + main-site).
const frontendUrl = process.env.FRONTEND_URL;
const origins = [Origins.LOCALHOST];
if (frontendUrl) {
  origins.push(...frontendUrl.split(',').map((s) => s.trim()));
}

// 6-sifret match-ID gir 900 000 mulige verdier (mot tidligere 9 000) og
// reduserer kollisjonssjansen dramatisk. Lett å dele verbalt og taste på
// mobil-keypad. Boardgame.io har ingen innebygd kollisjonssjekk her.
const server = Server({
  games: [TicTacToe],
  origins,
  uuid: () => {
    const matchID = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated match ID: ${matchID}`);
    return matchID;
  },
  generateCredentials: () => {
    const credentials = nanoid();
    console.log(`Generated credentials: ${credentials}`);
    return credentials;
  },
});

const PORT = process.env.PORT || 8000;

console.log(
  frontendUrl
    ? `CORS låst til localhost + ${frontendUrl}`
    : 'CORS åpen for localhost (FRONTEND_URL ikke satt)',
);

server.run(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
