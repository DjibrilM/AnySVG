/**
 * Format bytes into readable human format (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i] || 'B'}`;
}

/**
 * Format width and height dimensions with multiplication symbol
 */
export function formatDimensions(width: number, height: number): string {
  return `${width.toLocaleString()} × ${height.toLocaleString()}`;
}

/**
 * Calculate and format megapixels count
 */
export function formatMegapixels(width: number, height: number, decimals = 1): string {
  return ((width * height) / 1000000).toFixed(decimals);
}

/**
 * Clean up long filesystem paths for user display (e.g. replace user home with ~)
 */
export function formatDisplayPath(path?: string, fallback = 'Default Folder'): string {
  if (!path) return fallback;
  return path.replace(/^\/Users\/[^/]+/, '~');
}

/**
 * Format savings percentage with minus sign and percent symbol
 */
export function formatSavings(savings?: number): string {
  if (savings === undefined || savings === null) return '0%';
  return `-${savings}%`;
}
