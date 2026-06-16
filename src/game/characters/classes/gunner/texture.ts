// @ts-nocheck
export function drawGunnerTexture(x, S) {
  // 槍手：彈孔與機械瞄準格紋
  x.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  x.lineWidth = 1.5;
  for (let i = 0; i < S; i += 22) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, S); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke(); }
  x.fillStyle = 'rgba(40, 30, 10, 0.55)';
  for (let i = 0; i < 10; i++) { x.beginPath(); x.arc(Math.random() * S, Math.random() * S, 2 + Math.random() * 2.5, 0, 7); x.fill(); }
}
