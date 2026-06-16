// @ts-nocheck
export function drawTankTexture(x, S) {
  // 坦克：重型金屬鋼板與螺栓
  x.fillStyle = 'rgba(0,0,0,0.3)';
  for (let i = 0; i < S; i += 32) {
    x.fillRect(i, 0, 6, S);
    x.fillRect(0, i, S, 6);
  }
  x.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  x.lineWidth = 3;
  x.strokeRect(8, 8, S - 16, S - 16);
}
