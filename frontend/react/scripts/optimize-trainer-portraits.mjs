/**
 * One-shot: convert selected Drive portraits to responsive WebP.
 * Reads from tmp/trainer-drive/jpg (not committed).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const repoRoot = join(root, "../..");
const srcDir = join(repoRoot, "tmp/trainer-drive/jpg");
const outDir = join(root, "src/assets/trainer-portraits");
const outModule = join(root, "src/assets/trainerPortraits.generated.js");

const picks = [
  "DSC05275.jpg",
  "DSC05277.jpg",
  "DSC05281.jpg",
  "DSC05282.jpg",
  "DSC05293.jpg",
  "DSC05295.jpg",
  "DSC05299.jpg",
];
const WIDTHS = [480, 960];

mkdirSync(outDir, { recursive: true });

const photos = [];
for (let i = 0; i < picks.length; i++) {
  const id = String(i + 1).padStart(2, "0");
  const input = join(srcDir, picks[i]);
  const meta = await sharp(input).rotate().metadata();
  const baseW = meta.width || 1600;
  const baseH = meta.height || 2400;
  const imports = {};
  for (const w of WIDTHS) {
    const targetW = Math.min(w, baseW);
    const outName = `p${id}-${w}.webp`;
    await sharp(input)
      .rotate()
      .resize({ width: targetW, withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toFile(join(outDir, outName));
    imports[w] = outName;
    console.log("[optimize:trainers] wrote", outName);
  }
  const largest = WIDTHS[WIDTHS.length - 1];
  const scale = Math.min(largest, baseW) / baseW;
  photos.push({
    id,
    width: Math.round(baseW * scale),
    height: Math.round(baseH * scale),
    imports,
  });
}

const importLines = [];
const blocks = [];
for (const p of photos) {
  const vars = {};
  for (const w of WIDTHS) {
    const v = `p${p.id}_${w}`;
    vars[w] = v;
    importLines.push(
      `import ${v} from "./trainer-portraits/${p.imports[w]}";`
    );
  }
  const srcSet = WIDTHS.map((w) => `\${${vars[w]}} ${w}w`).join(", ");
  blocks.push(`  {
    src: ${vars[960]},
    srcSet: \`${srcSet}\`,
    width: ${p.width},
    height: ${p.height},
  }`);
}

writeFileSync(
  outModule,
  `/**
 * AUTO-GENERATED trainer portraits from the Evolve Drive shoot.
 * Re-run: node scripts/optimize-trainer-portraits.mjs
 */
${importLines.join("\n")}

export const trainerPortraits = [
${blocks.join(",\n")}
];
`
);
console.log("[optimize:trainers] wrote", outModule, photos.length);
