# Tic Tac Total Annihilation

Et post-apokalyptisk 4x4 tic-tac-toe-spill der to fraksjoner (Mexican
Queendom og Pan-Canadia Inuit Alliance) kjemper om territorier i USAs
ruiner, med strategiske våpen som låses opp via ressursen Rareium.

Bygget på [boardgame.io](https://boardgame.io/) med React frontend og en
egen multiplayer-server.

## Kjøre lokalt

```sh
npm install
npm run serve   # starter backend på port 8000
npm start       # starter frontend på port 3000 i ny terminal
```

## Deploy

- Frontend: Vercel (planlegges flyttet til Netlify, se PLAN.md Fase 2)
- Backend: Render

Frontend leser backend-URL fra `REACT_APP_BACKEND_URL`. Sett denne i
hosting-plattformens env-vars.

## Status og videre arbeid

Se [PLAN.md](PLAN.md) for prosjektets utviklingsplan og pågående
forbedringer.
