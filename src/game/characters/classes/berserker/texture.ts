// @ts-nocheck
export function drawBerserkerTexture(x, S) {
  // 狂戰士：血腥尖刺與怒火塗鴉
  x.fillStyle = '#e74c3c';
  for (let i = 0; i < 8; i++) {
    x.beginPath();
    const px = Math.random() * S, py = Math.random() * S;
    x.moveTo(px, py); x.lineTo(px + 10, py + 20); x.lineTo(px - 10, py + 20);
    x.closePath(); x.fill();
  }
}
