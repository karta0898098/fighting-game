// @ts-nocheck
export function drawPaladinTexture(x, S) {
  // 聖騎士：聖光十字盾紋與金色光輝
  x.strokeStyle = 'rgba(255, 248, 200, 0.8)';
  x.lineWidth = 6;
  x.beginPath(); x.moveTo(S / 2, 14); x.lineTo(S / 2, S - 14); x.moveTo(20, S * 0.42); x.lineTo(S - 20, S * 0.42); x.stroke();
  x.fillStyle = 'rgba(255, 215, 0, 0.35)';
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; x.beginPath(); x.arc(S / 2 + Math.cos(a) * 52, S / 2 + Math.sin(a) * 52, 3, 0, 7); x.fill(); }
}
