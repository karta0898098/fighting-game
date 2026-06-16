// @ts-nocheck
export function drawNecromancerTexture(x, S) {
  // 死靈法師：枯骨裂紋與幽綠死氣
  x.fillStyle = 'rgba(0, 0, 0, 0.4)';
  x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(120, 200, 140, 0.45)';
  x.lineWidth = 2;
  for (let i = 0; i < 8; i++) { const px = Math.random() * S, py = Math.random() * S; x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 3; j++) x.lineTo(px + (Math.random() - 0.5) * 40, py + j * 18); x.stroke(); }
}
