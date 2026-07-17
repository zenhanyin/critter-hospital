# Goodnight Clinic

A browser-playable prototype about collecting critters' nightmares and sending them home with gentle dreams.

Open `index.html` directly, or serve this folder with any static server.

```powershell
python -m http.server 5173
```

Then visit `http://localhost:5173`.

## Branches

- `main`: local development trunk.
- `gh-pages`: GitHub Pages deployment branch.
- `chatgpt-site`: ChatGPT/Sites deployment branch.

## Project Shape

- `index.html`: app shell.
- `styles/`: visual system and responsive layout.
- `src/`: game state and interactions.
- `data/`: dream cases.
- `assets/`: future art atlas folders.
- `docs/`: art direction and game-loop notes.

## Content Pipeline

Edit `data/cases.csv` in Excel, then rebuild generated data:

```powershell
node tools/build-content.js .
```

Audio slots live in `data/audio.json`. Add files under `assets/audio/music/` or `assets/audio/sfx/`, then fill the matching `src` field.
