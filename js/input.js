// 鍵盤輸入：WASD/方向鍵移動，J 攻擊，K 技能1，L 技能2

const KEY_MAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  KeyJ: 'basic',
  KeyK: 'skill1',
  KeyL: 'skill2',
  Semicolon: 'ultimate',
};

export function createInput() {
  const keys = { up: false, down: false, left: false, right: false, basic: false, skill1: false, skill2: false, ultimate: false };
  let enabled = false;

  function setKey(code, down) {
    const action = KEY_MAP[code];
    if (action) keys[action] = down;
    return !!action;
  }

  window.addEventListener('keydown', (e) => {
    if (!enabled) return;
    if (setKey(e.code, true)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    if (!enabled) return;
    if (setKey(e.code, false)) e.preventDefault();
  });
  // 失焦時清空，避免卡鍵
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  return {
    enable() { enabled = true; },
    disable() { enabled = false; for (const k in keys) keys[k] = false; },
    get() {
      return {
        up: keys.up, down: keys.down, left: keys.left, right: keys.right,
        basic: keys.basic, skill1: keys.skill1, skill2: keys.skill2, ultimate: keys.ultimate,
      };
    },
  };
}

export const EMPTY_INPUT = { up: false, down: false, left: false, right: false, basic: false, skill1: false, skill2: false, ultimate: false };
