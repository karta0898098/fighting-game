// @ts-nocheck
export function drawAssassinTexture(x, S) {
  // 刺客：暗影束帶與紫色格紋
  x.fillStyle = '#110b1a';
  for (let i = 0; i < S; i += 12) {
    x.fillRect(0, i, S, 3);
  }
  x.strokeStyle = 'rgba(155, 89, 182, 0.6)';
  x.lineWidth = 4;
  x.beginPath(); x.moveTo(0, 0); x.lineTo(S, S); x.moveTo(S, 0); x.lineTo(0, S); x.stroke();
}
