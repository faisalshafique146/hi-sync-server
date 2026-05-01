export function createInitials(fullName = '') {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';
}

export function colorFromString(input = '') {
  let hash = 0;

  for (const char of input) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 55% 42%)`;
}

export function buildAssetUrl(req, assetPath) {
  if (!assetPath) {
    return null;
  }

  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }

  const origin = `${req.protocol}://${req.get('host')}`;
  return `${origin}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
}
