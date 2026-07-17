# Audio Plan

## Music Direction

- Warm midnight music box, soft piano, brushed bells.
- Light dreamlike pads for suspense, but no harsh horror drones.
- Dawn music should feel hopeful and grounded.

## First Audio Slots

Configured in `data/audio.json`.

- `clinicNight`: main clinic loop.
- `dawnReport`: end-of-night loop.
- `openClinic`: tiny bell when a shift starts.
- `choice`: paper tap or wooden button.
- `success`: repaired dream chime.
- `mistake`: bottled nightmare thrum.
- `closeNight`: soft dawn swell.

## File Targets

- Music: `assets/audio/music/*.ogg`
- Effects: `assets/audio/sfx/*.ogg`

Keep `src` empty in `data/audio.json` until an audio file is ready. Once an asset exists, set `src` to the playable path, for example:

```json
"src": "assets/audio/sfx/dream-repaired-chime.ogg"
```
