export const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lightness = Math.round(l * 100);

  return `${h} ${s}% ${lightness}%`;
};

export const generateGradient = (primary: string, accent: string): string => {
  const primaryHsl = hexToHsl(primary);
  const accentHsl = hexToHsl(accent);
  return `linear-gradient(135deg, hsl(${primaryHsl}) 0%, hsl(${accentHsl}) 100%)`;
};

export const generateShadow = (color: string, opacity: number = 0.15): string => {
  const hsl = hexToHsl(color);
  return `0 2px 8px -2px hsl(${hsl} / ${opacity})`;
};

