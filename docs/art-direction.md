# Art Direction

## Core Tone

Goodnight Clinic is a cozy spooky dream-repair story. Every image should feel like a warm strange dream that a critter almost forgot after waking up.

## Visual Pillars

- Warm midnight colors instead of pure horror darkness.
- DreamWorks-like critter appeal: big expressions, rounded shapes, visible emotion.
- Light gothic storybook props: old wood, moon windows, paper charts, glass bottles, bells, thread, seeds, letters.
- Nightmare details should feel sad, strange, or sharp, but never gross.

## Palette

- Midnight blue: primary background.
- Warm lamp gold: safety, clinic warmth, dream gifts.
- Moon mint: healing, soothing, repaired dreams.
- Soft violet: memory, ache, dream magic.
- Berry pink: tenderness and character warmth.
- Red coral: rare danger accent only.

## First Asset Batch

- Backgrounds: midnight reception desk, nightmare bottle room, dream-weaving room, dawn porch.
- Critters: Moonbun, Moss Fox, Glass Hamster, Cloud Cat, Lantern Deer, Unknown Kit.
- States: normal, nightmare-touched, repaired dream.
- Props: nightmare bottle, letter, seed, wind chime, moon biscuit, dream thread, blank name tag.

## Generated V1 Sheets

- `assets/atlas/goodnight-clinic-atlas-v1.png`: image-2 style board for critters, props, clinic scene, and emotional state direction.
- `assets/atlas/goodnight-clinic-ui-layer-v1.png`: image-2 UI component sheet for status bars, meters, cards, buttons, icons, and decorative separators.
- `assets/atlas/critters.svg`: current playable SVG sprite atlas using the same character IDs as `data/cases.csv`.
- `assets/atlas/clinic-stage.svg`: current playable stage background.

Use the generated PNG sheets as the visual source of truth for future slicing or repainting. Keep playable assets addressed through `assets/atlas/manifest.json` so the game can swap SVG placeholders for final PNG/WebP sprites without changing story logic.
