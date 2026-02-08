/**
 * Remove white BACKGROUND only – keep the white "W" letter intact.
 * Uses flood-fill from edges: only white pixels connected to the border become transparent.
 */
import sharp from 'sharp';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'wakilfy logo.jpg');
const dst = join(root, 'public', 'brand', 'wakilfy-logo.png');

const THRESHOLD = 235; // White-ish: R,G,B >= this

function isWhite(data, i, channels) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  return r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD;
}

function idx(x, y, w, ch) {
  return (y * w + x) * ch;
}

async function main() {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const toRemove = new Set();

  // Flood-fill from edges: mark white pixels connected to border as "to remove"
  const stack = [];
  for (let x = 0; x < width; x++) {
    stack.push([x, 0], [x, height - 1]);
  }
  for (let y = 1; y < height - 1; y++) {
    stack.push([0, y], [width - 1, y]);
  }

  while (stack.length) {
    const [x, y] = stack.pop();
    const key = `${x},${y}`;
    if (toRemove.has(key)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const i = idx(x, y, width, channels);
    if (!isWhite(data, i, channels)) continue;
    toRemove.add(key);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Only make transparent the white pixels connected to border (background)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y, width, channels);
      if (toRemove.has(`${x},${y}`)) {
        data[i + 3] = 0; // background → transparent
      }
    }
  }

  await sharp(data, {
    raw: { width, height, channels },
  })
    .png()
    .toFile(dst);

  console.log('Saved:', dst);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
