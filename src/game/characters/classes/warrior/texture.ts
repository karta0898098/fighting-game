// @ts-nocheck
export function drawWarriorTexture(x, S) {
  // 戰士：鎧甲板甲線條與金色裝飾
  x.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  for (let i = 0; i < S; i += 16) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i, S); x.stroke();
    x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke();
  }
  x.fillStyle = 'rgba(255, 215, 0, 0.4)';
  for (let i = 16; i < S; i += 32) {
    x.beginPath(); x.arc(i, i, 4, 0, 7); x.fill();
  }
}
