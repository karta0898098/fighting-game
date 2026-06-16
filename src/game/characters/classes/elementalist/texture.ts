// @ts-nocheck
export function drawElementalistTexture(x, S) {
  // 元素使：三元元素混沌流光
  x.fillStyle = 'rgba(230, 126, 34, 0.5)'; // 火
  x.fillRect(0, 0, S, S/3);
  x.fillStyle = 'rgba(52, 152, 219, 0.5)'; // 冰
  x.fillRect(0, S/3, S, S/3);
  x.fillStyle = 'rgba(241, 196, 15, 0.5)'; // 雷
  x.fillRect(0, 2*S/3, S, S/3);
}
