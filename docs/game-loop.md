# Game Loop

## Theme

Collect nightmares, gift gentle dreams, and help critters wake with a reason to face tomorrow.

## Night Flow

1. A critter arrives with a strange dream symptom.
2. The player reads three dream traces.
3. The player chooses a repair action.
4. Correct choices reveal a dream gift and a morning anchor.
5. Incorrect choices bottle a nightmare fragment for later.
6. The night closes with a dawn report.

## Actions

- Listen: find the real wish under the dream.
- Soothe: steady shame, fear, or regret.
- Bottle: seal a sharp nightmare before it spreads.
- Wake: end a dream that is becoming escapism.

## Emotional Rule

Dreams do not replace reality. A successful repair gives the critter a small concrete action for tomorrow.

## Editable Story Configuration

Narrative cases are authored in `data/cases.csv`, which opens cleanly in Excel.
Run the content build step to regenerate `data/cases.json` for the game.

Editable columns:

- `id`: stable unique case id.
- `name`, `species`, `tone`: chart display fields.
- `color`, `mist`: visual presentation fields.
- `need`: one of `listen`, `soothe`, `bottle`, `wake`.
- `intro`: opening dream symptom.
- `clue_1` to `clue_3`: dream traces.
- `dream_gift`: successful dream repair.
- `morning_anchor`: reality-facing action after waking.
