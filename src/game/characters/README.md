# Characters

Player classes live under `classes/<class-id>/index.ts` and are loaded by
`src/game/characters/index.ts` through `import.meta.glob`. A class normally
exports one `BaseCharacter` instance with static data, optional model/VFX
loaders, and optional runtime hooks.

## `character.tick(state, player, dt)`

`BaseCharacter` accepts a `tick` loader:

```ts
new BaseCharacter(data, {
  tick: tickMyCharacter,
});
```

The simulation calls `character.tick(state, player, dt)` once per alive player
from `tickCharacterTimers` before cooldown and passive recovery updates. Use it
for class-specific state that must advance every simulation frame.

Good uses:

- Regenerate class resources stored on the player, such as
  `player.starOrbit.shards`.
- Advance deterministic timers, queued pulses, delayed attacks, or temporary
  stance windows.
- Emit gameplay VFX through `addFx` when the effect is part of the simulated
  timeline.
- Clear or normalize class-owned state when a timer finishes.

Avoid:

- Do not use `Math.random()` for gameplay decisions. Simulation must remain
  deterministic across clients and tests.
- Do not create render-only Three.js objects here. Put visual randomness and
  particles in the VFX registry instead.
- Do not store state globally. Put per-player state on the player object with a
  class-specific key, for example `player.starOrbit`.
- Do not duplicate generic systems such as cooldown, mana regen, shield decay,
  or normal status-effect ticking.

## State Shape

Class hook state should be explicit and owned by that class:

```ts
player.starOrbit = {
  shards: 0,
  regenTimer: 0,
  visTimer: 0,
  angle: 0,
  burst: null,
};
```

Initialize missing state inside the hook or helper functions so older saves,
tests, and freshly spawned players all work.

## Example: Star Orbit

`classes/star-orbit/orbit.ts` uses `character.tick` to:

- Clamp and regenerate up to three orbiting stars.
- Advance the deterministic orbit angle used by VFX events.
- Emit short-lived orbit VFX often enough to read as a persistent effect.
- Resolve the delayed three-shot ultimate beam sequence.

The hook only schedules deterministic `addFx` events. The flashy star particles,
beam meshes, and random-looking render details live in
`classes/star-orbit/vfx.ts`, where visual randomness cannot change gameplay.
