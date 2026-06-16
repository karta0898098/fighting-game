// @ts-nocheck
export function drawChronomancerTexture(x, S) {
  // 時空術士：時鐘刻度與青藍漩渦
  x.strokeStyle = 'rgba(150, 240, 255, 0.6)';
  x.lineWidth = 2;
  x.beginPath(); x.arc(S / 2, S / 2, 50, 0, 7); x.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; x.beginPath(); x.moveTo(S / 2 + Math.cos(a) * 44, S / 2 + Math.sin(a) * 44); x.lineTo(S / 2 + Math.cos(a) * 50, S / 2 + Math.sin(a) * 50); x.stroke(); }
  x.strokeStyle = 'rgba(200, 250, 255, 0.5)';
  x.beginPath(); x.moveTo(S / 2, S / 2); x.lineTo(S / 2, S / 2 - 36); x.moveTo(S / 2, S / 2); x.lineTo(S / 2 + 26, S / 2); x.stroke();
}
