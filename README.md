# Capicuu

**El marcador de dominó** — Menos papel. Más dominó.

Capicuu is a free, offline-first Progressive Web App for keeping score while you play physical Puerto Rican and Dominican dominoes.

## Features

- Fast mobile scoreboard for 2 teams (parejas)
- Thumb-friendly keypad and quick-add amounts
- Hand history with undo, edit, and delete
- Automatic winner detection and rematch
- Local persistence (no accounts, no backend)
- Spanish (default) and English
- Light / dark / system theme
- Installable PWA with offline support
- Optional Buy Me a Coffee support link

## Quick start

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
npm run preview
```

## Buy Me a Coffee

Copy `.env.example` to `.env` and set:

```
VITE_BUY_ME_A_COFFEE_URL=https://buymeacoffee.com/capicuu
```

Defaults to https://buymeacoffee.com/capicuu.

## Visit / install email notices

Capicuu can email you when someone opens the live link (once per day per browser) or installs the app. GitHub Pages is static, so this uses free [Web3Forms](https://web3forms.com):

1. Create a key at https://web3forms.com with `dvaldes8.cs@gmail.com`
2. Put it in `.env`:

```
VITE_WEB3FORMS_ACCESS_KEY=your_access_key_here
```

3. Rebuild and redeploy (`CAPICUU_BASE=/capicuu/ npm run build` then publish `dist`)

Localhost does not send notices.

## Brand assets

Original SVG logos live in `src/assets/logos/`. Regenerate PNG PWA icons with:

```bash
npm run icons
```

## Stack

React · TypeScript · Vite · LocalStorage · vite-plugin-pwa
