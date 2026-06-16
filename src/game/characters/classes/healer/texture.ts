// @ts-nocheck
export function drawHealerTexture(x, S) {
  // 治療師：聖光十字與白絲質地
  x.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(S / 2, 12); x.lineTo(S / 2, S - 12);
  x.moveTo(12, S / 2); x.lineTo(S - 12, S / 2);
  x.stroke();
}
