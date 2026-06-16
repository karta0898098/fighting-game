// @ts-nocheck
export function drawHexerTexture(x, S) {
  // 咒術師：詛咒符文與紫色裂紋
  x.strokeStyle = 'rgba(180, 120, 220, 0.55)';
  x.lineWidth = 2;
  for (let i = 0; i < 10; i++) { const px = Math.random() * S, py = Math.random() * S; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 50, py + (Math.random() - 0.5) * 50); x.lineTo(px + (Math.random() - 0.5) * 40, py + 30); x.stroke(); }
  x.fillStyle = 'rgba(220, 160, 255, 0.5)';
  for (let i = 0; i < 16; i++) { x.beginPath(); x.arc(Math.random() * S, Math.random() * S, 1.5 + Math.random() * 2, 0, 7); x.fill(); }
}
