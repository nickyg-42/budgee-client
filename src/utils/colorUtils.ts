/**
 * Generate visually distinct colors for subcategory breakdowns
 * by varying hue and lightness from a base hex color.
 */

function hexToHSL(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / d + 2) / 6;
    else hue = ((r - g) / d + 4) / 6;
  }

  return [hue * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate `count` distinct colors based on a base hex color.
 * Spreads across hue shifts and lightness levels to maximize visual distinction.
 */
export function generateSubcategoryColors(baseHex: string, count: number): string[] {
  if (count <= 0) return [];
  if (count === 1) return [baseHex];

  const [baseH, baseS, baseL] = hexToHSL(baseHex);
  const colors: string[] = [];

  // Hue shifts: alternate positive/negative, stepping by 18 degrees
  const hueShifts = [0, 25, -25, 50, -50, 75, -75, 100, -100, 130, -130];
  // Lightness offsets to add further variation
  const lightnessOffsets = [0, 10, -10, 20, -15, 5, -5];

  for (let i = 0; i < count; i++) {
    const hShift = hueShifts[i % hueShifts.length];
    const lOffset = lightnessOffsets[i % lightnessOffsets.length];
    const h = ((baseH + hShift) % 360 + 360) % 360;
    const s = Math.max(25, Math.min(90, baseS - (i * 3)));
    const l = Math.max(30, Math.min(75, baseL + lOffset));
    colors.push(hslToHex(h, s, l));
  }

  return colors;
}
