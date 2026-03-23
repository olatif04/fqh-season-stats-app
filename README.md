# FQH Season Stats App

A React + Vite app for tracking FQH games and season stats.

## Features

- Add, edit, and delete games
- Track players and goalies under the same name across the season
- Combined assists and points totals for everyone, including goalies
- Track goalie W, L, and Goalie GP
- Automatic season stats table with PPG
- Click into older games for a clean game-detail view
- Export either a single game card or the season stats table as a PNG
- Change PNG export colors for background, card, text, and accent
- Import/export full data as JSON
- Browser local storage persistence

## Logo setup

Put your square PNG logo here:

`public/logo.png`

Use this exact filename:

`logo.png`

The app will automatically use it in the export PNG cards.

## Local setup

```bash
npm install
npm run dev
```

## Production build

```bash
npm install
npm run build
npm run preview
```

## Vercel

This is a standard Vite app.

- Push this folder to GitHub
- Import the repo into Vercel
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

## Data storage

Right now the app stores data in browser local storage. That is fine for a single-user workflow.

If you want syncing across devices later, add a backend like Supabase.
