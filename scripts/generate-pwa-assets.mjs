/**
 * Renders the PWA icons and iOS launch screens from the knot brand mark
 * (src/components/layout/brand.tsx). Re-run after changing the mark:
 *
 *   npm run pwa:assets
 *
 * Writes public/icons/*, public/splash/* and src/app/apple-icon.png.
 */
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

// Brand colors: --foreground (ink) and --background (paper) from globals.css.
const INK = "#1b2230"
const PAPER = "#fcfbf8"

/** The mark's 24×24 glyph, scaled to `glyph` px and centered on a `size` px canvas. */
function markSvg({ width, height = width, glyph, background, radius = 0 }) {
  const scale = glyph / 24
  const x = (width - glyph) / 2
  const y = (height - glyph) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" rx="${radius}" fill="${background}"/>
  <g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${PAPER}" stroke-width="2.2">
    <path d="M5 12a7 7 0 0 1 7-7h0a7 7 0 0 1 7 7v0a7 7 0 0 1-7 7" stroke-linecap="round"/>
    <circle cx="12" cy="12" r="2.2" fill="${PAPER}" stroke="none"/>
  </g>
</svg>`
}

/** Launch screen: the ink tile on paper, as the app looks while it loads. */
function splashSvg(width, height) {
  const tile = Math.round(Math.min(width, height) * 0.22)
  const glyph = tile * 0.57
  const x = (width - tile) / 2
  const y = (height - tile) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${PAPER}"/>
  <svg x="${x}" y="${y}" width="${tile}" height="${tile}">${markSvg({ width: tile, glyph, background: INK, radius: tile * 0.28 })
    .replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg>
</svg>`
}

// Portrait pixel sizes of the devices in src/lib/pwa/splash-screens.ts.
const SPLASH_SCREENS = [
  [1320, 2868], [1260, 2736], [1290, 2796], [1206, 2622], [1179, 2556],
  [1284, 2778], [1170, 2532], [1125, 2436], [1242, 2688], [828, 1792],
  [1242, 2208], [750, 1334], [640, 1136], [2064, 2752], [2048, 2732],
  [1668, 2420], [1668, 2388], [1640, 2360], [1668, 2224], [1620, 2160],
  [1536, 2048], [1488, 2266],
]

async function png(svg, file) {
  const out = join(root, file)
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer())
  console.log("✓", file)
}

// "any" icons: rounded tile with transparent corners, for browsers and Android.
for (const size of [192, 512]) {
  await png(markSvg({ width: size, glyph: size * 0.57, background: INK, radius: size * 0.22 }), `public/icons/icon-${size}.png`)
}
// Maskable: full-bleed, glyph inside the 80% safe zone.
await png(markSvg({ width: 512, glyph: 512 * 0.45, background: INK }), "public/icons/maskable-512.png")
// iOS home screen: opaque square; iOS rounds the corners itself.
await png(markSvg({ width: 180, glyph: 180 * 0.52, background: INK }), "src/app/apple-icon.png")

for (const [w, h] of SPLASH_SCREENS) {
  await png(splashSvg(w, h), `public/splash/${w}x${h}.png`)
  await png(splashSvg(h, w), `public/splash/${h}x${w}.png`)
}
