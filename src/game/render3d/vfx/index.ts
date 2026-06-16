import { CHARACTERS } from '../../characters/index.ts';

for (const character of CHARACTERS) character.loadVfx();

export { getVfx, hasVfx, registerVfx } from './registry.js';
