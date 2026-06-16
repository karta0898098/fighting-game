// @ts-nocheck
export function drawSamuraiTexture(x, S) {
  // 武士：和風波紋與緋紅刀痕
  x.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  x.lineWidth = 2;
  for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(S / 2, S + 20, 30 + i * 22, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
  x.strokeStyle = 'rgba(255, 80, 60, 0.7)';
  x.lineWidth = 4;
  x.beginPath(); x.moveTo(18, 24); x.lineTo(S - 24, S - 40); x.stroke();
}
