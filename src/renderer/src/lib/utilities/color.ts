export const PRESET_COLORS = ['transparent', '#ffffff', '#000000'] as const;

/**
 * Check if a background color is one of the built-in presets
 */
export function isPresetColor(color: string): boolean {
  return PRESET_COLORS.includes(color.toLowerCase() as any);
}

/**
 * Normalize 3-digit or 6-digit hex colors to 6-digit with leading #
 */
export function normalizeHex(color: string, fallback = '#38bdf8'): string {
  if (color.startsWith('#')) {
    if (color.length === 7) return color;
    if (color.length === 4) {
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
  }
  return fallback;
}
