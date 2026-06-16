// @ts-nocheck
export function drawSummonerTexture(x, S) {
  // 召喚師：召喚陣與青綠靈紋
  x.strokeStyle = 'rgba(120, 240, 210, 0.6)';
  x.lineWidth = 2.5;
  x.beginPath(); x.arc(S / 2, S / 2, 44, 0, 7); x.stroke();
  x.beginPath(); x.arc(S / 2, S / 2, 30, 0, 7); x.stroke();
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; x.beginPath(); x.moveTo(S / 2 + Math.cos(a) * 30, S / 2 + Math.sin(a) * 30); x.lineTo(S / 2 + Math.cos(a) * 44, S / 2 + Math.sin(a) * 44); x.stroke(); }
}
