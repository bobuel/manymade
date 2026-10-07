# Archive mission verification

Candidate: 0.1.0, first complete mission. See the deployed `build-info.json` for
the exact source commit. This is not the full RPG or a claim of infinite novelty.

## Checks

- All 12 rules tests passed, including 6,561 build/oath/condition routes, all three
  preset builds winning both fights, interaction combinations, input validation,
  action-preview equivalence, save round trips, and deadline behavior.
- Production TypeScript check and Vite build passed.
- Chromium journeys completed all three preset noncombat routes, checked combat
  controls, pause/recovery, reload continuity, and a complete 390px viewport run.
- A manual in-app browser journey completed both sentry and warden fights and
  reached the rescue epilogue. Chained Arc damage matched the preview. The run
  took about three active minutes with the tester already knowing the rules.
- Visual review found and repaired an initial empty battlefield, SVG texture
  loading, scene-transition scroll position, and pointer tile alignment.
- Runtime dependency audit reported zero known vulnerabilities.
- All five browser checks passed, including exact pointer-to-tile alignment and
  save export/import. A rejected malformed import preserved the existing journey.
- Publication scan reviewed all 26 staged files and found no credential patterns
  or private local paths. The repository starts with fresh history and includes
  only this game's code, assets, tests, build configuration, and documentation.
- Public repository and GitHub Pages deployment were verified. All five browser
  checks also passed against the hosted project path. GitHub secret scanning
  reported no alerts; push protection is enabled.
- Final mobile screenshot review exposed a text-field refresh issue in the
  character editor. Identity inputs now update the portrait labels without
  replacing the focused form; the phone test asserts both values are retained.

## Acceptance boundaries

- Functional simulation does not establish human enjoyment or difficulty.
- Browser viewport emulation does not establish physical-device usability.
- Six mechanical choice categories and a bounded appearance catalogue are
  implemented. Full-product character domains remain planned.
- Generation is limited to three conditions and two water arrangements.
- Character creation is untimed; the adventure is limited to 45 active minutes.
- No cloud saves, multiplayer, accounts, runtime AI, or external services.
