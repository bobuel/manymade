# Product and execution specification

## Authority and current scope

The owner's instructions define a character-customizable, combinatorial RPG with
customization affecting every gameplay system, a maximum 45-minute adventure, and
repeatable runs. The accepted direction is strange dark fantasy, tactical
turn-based combat, static browser delivery, and an archive mission first.
The owner explicitly authorized a new public GitHub repository with no secrets.
The first mission is not the whole product. No separate infrastructure or paid
runtime services are required.

## Complete product journey

Create or adapt a character; choose an ambition; enter a city with changing
conditions and factions; navigate interconnected districts; develop the build
through discoveries and tradeoffs; resolve a catastrophe; receive an epilogue
reflecting identity, decisions, and objective success; replay a seed or new world.

Appearance, body, voice, background, beliefs, training, and equipment must all be
authorable within an explicit catalogue. Players bind powers to visual
inscriptions and choose mechanical traits independently of gender, skin tone,
or name spelling. The full promise requires meaningful build responses across
traversal, combat, dialogue, resources, faction access, progression, and endings.

## Rules contracts, version 1

The engine owns the canonical Run: character, seed, condition, stage, resources,
elapsed active time, story flags, journal, and optional Combat.
Commands are explicit story choices, tactical actions, end-turn, retreat, and
elapsed active time. The engine validates preconditions, copies the input, and
returns the next state. Preview calls the exact action resolver on a copy.
The rendered intent describes what an enemy would do at the current state.

Traits produce tags and bounded derived statistics. Reactions are explicit and
finite, not recursively executed scripts from content. The renderer consumes
state and produces command requests; it does not own rules. Changes to these
contracts update tests and consumers in the same integrated change.

Saved envelopes identify game, format version, and state. Imports validate shape
and bounds before replacing a run. Invalid imports leave the existing save intact.
Replacement requires an in-app confirmation. Local storage failure is reported;
export remains available. Future incompatible versions need a migration or clear
refusal, never a silent reset.

## Presentation

Painterly flooded gothic archive; charcoal and oxidized teal; ivory type and
muted brass. Cormorant Garamond for story and titles, DM Sans for controls.
Characters use compatible layered graphics. Tactical maps use an isometric
presentation over a square rules grid. UI includes pointer controls and an HTML
keyboard map, visible resource costs, intentions, previews, and action receipts.
Audio is opt-in. Reduced motion is respected.

## Stages and acceptance

### 1. Complete archive mission — current packet

Owns this independent repository. Depends on agreed journey and rules contract.
Deliver editor, contrasted archetypes, five scenes, both fights, environmental
interactions, multiple escapes, oath-aware epilogues, timer, save recovery, and
local browser play. No backend, open world, runtime AI, or account system.

Acceptance: every selectable build has a viable story route; all three presets
demonstrate distinct solutions; battle previews match results; combat can end in
victory or defeat; invalid actions and saves are rejected; deadline resolves;
browser journey and reloading work; assets load at a GitHub project subpath.
Human gameplay acceptance remains separate.

### 2. Full 45-minute adventure

Depends on stage 1 mechanics and owner feedback on the actual mission.
Add connected districts, resource pressures, character development, faction
relationships, rivals, personal objectives, and a catastrophe with several
resolutions. Clarify whether character creation shares the 45-minute budget.
Acceptance includes slow-play, early defeat, save recovery during progression,
deadline from each stage, and finishing without any particular required trait.

### 3. Customization completeness and replay depth

Depends on full adventure contracts for inventory, progression, faction state,
and generation. Expand all character domains and the common action registry.
Assemble authored encounters into seeded compatible worlds. Construct a viable
baseline route before optional challenges. Reject invalid seeds and use a
known-good fallback after bounded retries.

Acceptance: reachability and resource-dependency validation; mechanical coverage
for each trait; no unsupported anatomy; shared seeds reproduce the same world;
repeat human sessions reveal different successful decisions. Horizontal unlocks
add options rather than mandatory power grinding.

### 4. Release quality and wider browser support

Depends on the complete game. Final art, animation, sound, onboarding, controls,
accessibility, browser/device testing, performance and storage budgets.
Verify deployed revision and playable path. Desktop browser checks cannot
establish physical phone acceptance.

## Integration and publication

One integrator maintains rules, UI, tests, and documents; no parallel agents are
required. Publish reviewed source and original game assets. Exclude local build
outputs, dependency directories, credentials, environment files, browser
profiles, and unrelated workspace content. Pages builds use relative paths and
a commit-linked identity. Test and build before deploying, then verify the served
revision and a fresh browser journey.

## Costs and operations

Phaser, TypeScript, and Vite run locally and build static files. Gameplay runs
on the player's device. GitHub hosts source and output using the account's
applicable Pages/Actions allowance. No gameplay server, runtime model charge,
API credential, account database, or cloud-save expense. Domain purchases,
external services, and paid asset acquisition are outside the current scope.
