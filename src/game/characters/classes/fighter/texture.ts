// @ts-nocheck
export function drawFighterTexture(x, S) {
  // 格鬥家：武僧服飾滾邊與修煉印記
  x.strokeStyle = '#000000';
  x.lineWidth = 6;
  x.strokeRect(0, 0, S, S);
  x.strokeRect(20, 20, S - 40, S - 40);
}
