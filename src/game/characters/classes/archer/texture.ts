// @ts-nocheck
export function drawArcherTexture(x, S) {
  // 弓箭手：皮甲拼貼與林地迷彩
  x.fillStyle = 'rgba(46, 204, 113, 0.5)';
  for (let i = 0; i < 12; i++) {
    x.fillRect(Math.random() * (S - 20), Math.random() * (S - 10), 20, 10);
  }
}
