// @ts-nocheck
export function drawMageTexture(x, S) {
  // 法師：奧術星辰與邊緣法線
  x.fillStyle = 'rgba(255, 255, 255, 0.25)';
  for (let i = 0; i < 15; i++) {
    x.beginPath(); x.arc(Math.random() * S, Math.random() * S, 2 + Math.random() * 3, 0, 7); x.fill();
  }
  x.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  x.lineWidth = 3;
  x.strokeRect(15, 15, S - 30, S - 30);
}
