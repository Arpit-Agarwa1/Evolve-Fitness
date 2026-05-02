/**
 * Build theme-integrated logos from `public/brand/evolve-logo-og.png`.
 * Run: `npm run build:brand`
 *
 * 1. Trim excess black plate.
 * 2. Nav: keep top band = main “EVOLVE” wordmark (drop small tagline).
 * 3. Footer: full trimmed lockup (wordmark + tagline).
 * 4. Key near-black to alpha so assets sit on `--ev-bg` / glass nav.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const src = join(root, "public/brand/evolve-logo-og.png");
const outNav = join(root, "public/brand/evolve-logo-nav.png");
const outFooter = join(root, "public/brand/evolve-logo-footer.png");

/** After trim, nav uses this top fraction of height (drops “THE LUXURY FITNESS”). */
const NAV_MAIN_RATIO = 0.72;

/** Pixels this close to black become transparent (theme merge). */
const BLACK_MAX = 38;

/**
 * @param {Buffer} rgbaBuffer
 * @param {number} width
 * @param {number} height
 */
function keyBlackToAlpha(rgbaBuffer, width, height) {
  const px = new Uint8ClampedArray(
    rgbaBuffer.buffer,
    rgbaBuffer.byteOffset,
    rgbaBuffer.byteLength
  );
  const ch = 4;
  if (px.length !== width * height * ch) {
    throw new Error("Buffer size mismatch");
  }

  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const isOrange =
      r > 105 && r > g + 12 && r > b + 12 && g < 175 && b < 140 && sat > 0.18;
    const isLight = max > 112;
    if (isOrange || isLight) continue;

    const lum = (r + g + b) / 3;
    if (lum <= BLACK_MAX) {
      px[i + 3] = 0;
    } else if (lum <= BLACK_MAX + 42) {
      const t = (lum - BLACK_MAX) / 42;
      px[i + 3] = Math.round(px[i + 3] * t);
    }
  }

  return rgbaBuffer;
}

/**
 * @param {Buffer} inputPng
 * @param {{ cropTagline?: boolean }} opts
 */
async function toKeyedRaw(inputPng, opts = {}) {
  const meta = await sharp(inputPng).metadata();
  if (!meta.width || !meta.height) throw new Error("Missing dimensions");

  let pipeline = sharp(inputPng);
  if (opts.cropTagline) {
    const cropH = Math.max(1, Math.round(meta.height * NAV_MAIN_RATIO));
    pipeline = sharp(inputPng).extract({
      left: 0,
      top: 0,
      width: meta.width,
      height: cropH,
    });
  }

  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 4) throw new Error("Expected RGBA");

  const keyed = keyBlackToAlpha(data, info.width, info.height);
  return {
    buffer: keyed,
    width: info.width,
    height: info.height,
  };
}

async function main() {
  const trimmedBuf = await sharp(readFileSync(src))
    .trim({ threshold: 28 })
    .toBuffer();

  const navKeyed = await toKeyedRaw(trimmedBuf, { cropTagline: true });
  const footerKeyed = await toKeyedRaw(trimmedBuf, { cropTagline: false });

  const navRaw = {
    raw: {
      width: navKeyed.width,
      height: navKeyed.height,
      channels: 4,
    },
  };

  await sharp(navKeyed.buffer, navRaw)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .resize({ width: 520, kernel: sharp.kernel.lanczos3 })
    .toFile(outNav);

  const footerRaw = {
    raw: {
      width: footerKeyed.width,
      height: footerKeyed.height,
      channels: 4,
    },
  };

  await sharp(footerKeyed.buffer, footerRaw)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .resize({ width: 640, kernel: sharp.kernel.lanczos3 })
    .toFile(outFooter);

  console.log("Wrote", outNav, outFooter);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
