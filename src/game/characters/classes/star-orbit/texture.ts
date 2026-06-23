// @ts-nocheck
export function drawStarOrbitTexture(x, S) {
  x.strokeStyle = 'rgba(90, 215, 255, 0.65)';
  x.lineWidth = 3;
  x.beginPath(); x.arc(S / 2, S / 2, 46, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = 'rgba(255, 209, 102, 0.7)';
  x.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const px = S / 2 + Math.cos(a) * 35;
    const py = S / 2 + Math.sin(a) * 35;
    x.beginPath(); x.arc(px, py, 7, 0, Math.PI * 2); x.stroke();
  }
  x.fillStyle = 'rgba(242, 247, 255, 0.55)';
  x.beginPath(); x.arc(S / 2, S / 2, 12, 0, Math.PI * 2); x.fill();
}
