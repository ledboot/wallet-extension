/**
 * PixelAvatar – a deterministic pixel-art avatar generated from a seed string
 * (typically an account address or key).
 *
 * Usage:
 *   <PixelAvatar seed={account.address} size={40} />
 */

interface PixelAvatarProps {
  /** Seed string used to derive the pixel pattern and colors (e.g. account address). */
  seed: string;
  /** Width & height in pixels. Defaults to 40. */
  size?: number;
  /** Border-radius in pixels. Defaults to size * 0.2. */
  borderRadius?: number;
  /** Extra CSS class names applied to the outer wrapper. */
  className?: string;
}

export function PixelAvatar({
  seed,
  size = 40,
  borderRadius,
  className = '',
}: PixelAvatarProps) {
  const GRID = 8;
  const radius = borderRadius ?? Math.round(size * 0.2);

  // Build GRID×GRID pixel matrix – mirrored left-right for a symmetrical look
  const half = Math.ceil(GRID / 2);
  const pixels: boolean[][] = [];

  for (let r = 0; r < GRID; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < half; c++) {
      const charIdx = (r * half + c) % (seed.length || 1);
      row.push((seed.charCodeAt(charIdx) + r + c) % 3 !== 0);
    }
    // Mirror left half → right half (e.g. [a,b,c,d] → [a,b,c,d,d,c,b,a])
    const mirrored = [...row, ...[...row].reverse()];
    pixels.push(mirrored.slice(0, GRID));
  }

  // Two complementary colors derived from the seed
  const h1 =
    ((seed.charCodeAt(0) || 0) * 37 + (seed.charCodeAt(2) || 0) * 13) % 360;
  const h2 = (h1 + 140) % 360;
  const colorA = `hsl(${h1},65%,60%)`;
  const colorB = `hsl(${h2},65%,72%)`;

  const cellSize = size / GRID;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${GRID}, ${cellSize}px)`,
      }}
    >
      {pixels.flat().map((on, i) => (
        <div key={i} style={{ backgroundColor: on ? colorA : colorB }} />
      ))}
    </div>
  );
}
