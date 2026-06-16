// @ts-nocheck
export function drawBardTexture(x, S) {
  // 吟遊詩人：音符與五線譜流光
  x.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  x.lineWidth = 2;
  for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(0, i * S / 6); x.lineTo(S, i * S / 6); x.stroke(); }
  x.fillStyle = 'rgba(255, 230, 245, 0.7)';
  for (let i = 0; i < 7; i++) { const py = ((i % 5) + 1) * S / 6; x.beginPath(); x.arc(16 + i * 16, py, 4, 0, 7); x.fill(); x.fillRect(16 + i * 16 + 3, py - 16, 1.6, 16); }
}
