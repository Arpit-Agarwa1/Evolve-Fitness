/**
 * After `vite build`, writes dist/sitemap.xml and dist/robots.txt with absolute URLs.
 * Set VITE_SITE_URL in .env.production or pass env when building.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");

function resolveBaseUrl() {
  let base = "https://evolvestudio.fitness";
  if (process.env.VITE_SITE_URL?.trim()) {
    return process.env.VITE_SITE_URL.trim().replace(/\/$/, "");
  }
  const envPath = join(root, ".env.production");
  if (existsSync(envPath)) {
    const text = readFileSync(envPath, "utf8");
    const m = text.match(/^\s*VITE_SITE_URL\s*=\s*(.+)$/m);
    if (m) {
      return m[1]
        .trim()
        .replace(/\/$/, "")
        .replace(/^["']|["']$/g, "");
    }
  }
  return base;
}

const base = resolveBaseUrl();

const entries = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/programs", priority: "0.9", changefreq: "weekly" },
  { loc: "/trainers", priority: "0.9", changefreq: "weekly" },
  { loc: "/membership", priority: "0.9", changefreq: "weekly" },
  { loc: "/register", priority: "0.85", changefreq: "monthly" },
  { loc: "/contact", priority: "0.9", changefreq: "monthly" },
];

if (!existsSync(dist)) {
  console.warn("[write-sitemap-robots] dist/ missing — run vite build first.");
  process.exit(0);
}

const urlBlocks = entries
  .map(
    (e) => `  <url>
    <loc>${base}${e.loc}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlBlocks}
</urlset>
`;

writeFileSync(join(dist, "sitemap.xml"), sitemap, "utf8");

const robots = `User-agent: *
Allow: /

Disallow: /admin

Sitemap: ${base}/sitemap.xml
`;

writeFileSync(join(dist, "robots.txt"), robots, "utf8");
console.log(`[write-sitemap-robots] wrote sitemap + robots for ${base}`);
