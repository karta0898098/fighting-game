// @ts-nocheck
export function drawNinjaTexture(x, S) {
  // 忍者：夜行緊身網格與忍具線條
  x.fillStyle = 'rgba(0,0,0,0.5)';
  x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  x.lineWidth = 1;
  for (let i = 0; i < S; i += 6) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i, S); x.stroke();
    x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke();
  }
}
