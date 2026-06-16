// @ts-nocheck
export const publicAsset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  const clamp = (val) => Math.max(0, Math.min(255, Math.floor(val)));
  const rh = clamp(r).toString(16).padStart(2, '0');
  const gh = clamp(g).toString(16).padStart(2, '0');
  const bh = clamp(b).toString(16).padStart(2, '0');
  return `#${rh}${gh}${bh}`;
}

export function generateTextureSprite(baseHex, drawTexture) {
  if (typeof document === 'undefined') return '';

  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const x = cv.getContext('2d');

  const c = hexToRgb(baseHex);
  const lightColor = rgbToHex(c.r + (255 - c.r) * 0.25, c.g + (255 - c.g) * 0.25, c.b + (255 - c.b) * 0.25);
  const darkColor = rgbToHex(c.r * 0.4, c.g * 0.4, c.b * 0.4);

  const grad = x.createLinearGradient(0, 0, 0, S);
  grad.addColorStop(0, lightColor);
  grad.addColorStop(0.5, baseHex);
  grad.addColorStop(1, darkColor);
  x.fillStyle = grad;
  x.fillRect(0, 0, S, S);

  x.lineWidth = 2.5;
  if (drawTexture) drawTexture(x, S);

  return cv.toDataURL();
}

export function characterPortrait(slug) {
  return publicAsset('assets/characters/' + slug + '/portrait.svg');
}

export function characterSprite(slug, baseHex, hasPortrait = false, drawTexture = null) {
  return hasPortrait ? characterPortrait(slug) : generateTextureSprite(baseHex, drawTexture);
}
