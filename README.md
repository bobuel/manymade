# Manymade: The Drowned Archive

**Become someone impossible.**

[Play the archive mission](https://bobuel.github.io/manymade/)

A dark fantasy tactical RPG about a city of stolen identities. Assemble a body,
blood, voice, history, weapon, and inscription; enter a flooded archive; retrieve
one record; and escape its Nameless Warden.

This repository contains the **first complete mission**, not the full planned
RPG. It supports a beginning, consequential choices, tactical battles, alternate
solutions, and an ending.

## Play locally

Requires Node.js 22.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4185. For a production build, use
`npm run build` followed by `npm run preview`.

The game is designed for static GitHub Pages hosting. Gameplay runs entirely in
the browser; no account, API key, backend, or runtime AI service is needed.
Artwork, fonts, and code are bundled locally.

## The mission

- Six mechanical customization categories with three options each: 729 builds.
- Three starting archetypes: storm engineer, phantom envoy, living guardian.
- Custom name, pronouns, frame, skin tone, hair, and clothing palette.
- Five story locations, two optional tactical encounters, three personal oaths,
  and five successful escape methods.
- Shared interactions: conductive water, rooted targets feeding flame, veiled
  strikes, enemy interruption, healing, guard, pulling, and movement.
- Action previews calculated by the same resolver used to commit the action.
- Three seeded conditions and two battlefield water arrangements.
- Local autosaves, export/import, seed links, optional sound, and keyboard
  battlefield controls.

Choose a character, enter the archive, and pursue your oath. In combat, select
an action, select a tile or enemy, review the exact preview, and confirm. You have
two actions per turn. Enemies reveal whether they will attack or advance.
Guard and the start of a new round restore focus.

## Scope and limits

The prologue is intended as a short mission. Active play ends after at most 45
minutes, with forced confrontation at 40 minutes. Pauses, hidden tabs, and the
character workshop do not count toward this limit. The full game's creation-time
policy remains a product decision.

Appearance options are authored modular parts, not arbitrary anatomy. Cosmetic
identity choices are free; the selected inscription gives appearance a mechanical
expression. The prototype uses compact authored story scenes and seeded
conditions, not a procedurally generated city. Infinite replayability and human
enjoyment are goals, not verified claims.

Saves stay in the current browser. Export a backup before clearing site data.
There is no cloud sync or competitive leaderboard. Imported saves are validated
for structural compatibility; local gameplay is not tamper-proof.

## Verification

```sh
npm test
npm run build
npm run test:browser
```

Browser tests require Playwright Chromium (`npx playwright install chromium`).
Rules tests cover all builds, oaths, and world conditions; interaction mechanics;
save validation; the deadline; and combat viability for three presets.
These establish functional behavior, not player enjoyment or device acceptance.

## Project structure

- `src/content.ts`: character options, derived statistics, combination descriptions.
- `src/engine.ts`: deterministic rules, story transitions, combat, timer, saves.
- `src/portrait.ts`: modular character presentation.
- `src/board.ts`: Phaser battlefield and pointer controls.
- `src/main.ts` / `src/style.css`: character workshop, story, combat UI, endings.
- `DESIGN.md`: full product direction and staged execution.
- `QA.md`: verification scope and current release evidence.

## Credits

Product direction: Alexander Aidun. Design, implementation, original modular
character graphics, and verification: Codex in collaboration with the owner.
The archive environment illustration was generated using OpenAI image generation.
Fonts: Cormorant Garamond and DM Sans, distributed by Fontsource under their
included open font licenses. Phaser is MIT licensed. See dependency packages for
their respective licenses.
