export const BURN = (dmg, dur = 3) => ({ kind: 'burn', duration: dur, tick: 0.5, dmg });
export const STUN = (dur) => ({ kind: 'stun', duration: dur });
export const SLOW = (dur, factor = 0.5) => ({ kind: 'slow', duration: dur, factor });
export const ROOT = (dur) => ({ kind: 'root', duration: dur });
export const CHILL = (stacks, dur = 3) => ({ kind: 'chill', stacks, duration: dur, max: 4, freezeDur: 2.0 });
