import { CHARACTERS } from '../../characters/index.ts';
import './boss.js';

for (const character of CHARACTERS) character.loadVfx();

export { getVfx, hasVfx, registerVfx } from './registry.js';
