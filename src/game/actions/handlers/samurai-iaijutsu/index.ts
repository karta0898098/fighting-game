import { startSamuraiIaijutsu } from '../../../characters/classes/samurai/iaijutsu.ts';
import type { ActionContext } from '../../../types';

export function samurai_iaijutsu(ctx: ActionContext) {
  startSamuraiIaijutsu(ctx);
}

export const handlers = { samurai_iaijutsu };
