/**
 * Renders the PWA icons and iOS launch screens from the IamCandidate brand mark
 * (src/components/layout/brand.tsx). Re-run after changing the mark:
 *
 *   npm run pwa:assets
 *
 * Writes public/icons/*, public/splash/*, src/app/apple-icon.png and
 * src/app/favicon.ico.
 */
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

// Brand colors: --foreground (ink) and --background (paper) from globals.css.
const INK = "#1b2230"
const PAPER = "#fcfbf8"

// Dark-theme --brand: the teal that reads on the ink tile.
const TEAL = "#42cab4"

// MARK_ACCENT and MARK_BASE from brand.tsx: a trefoil knot on a 24×24 grid.
const MARK_ACCENT = "M17.66 11.53C17.98 11.26 18.26 10.97 18.5 10.67C18.74 10.37 18.94 10.05 19.1 9.74C19.26 9.42 19.37 9.09 19.44 8.78C19.51 8.46 19.54 8.14 19.52 7.84C19.5 7.54 19.43 7.24 19.33 6.97C19.22 6.7 19.07 6.44 18.89 6.22C18.71 5.99 18.48 5.79 18.22 5.62C17.97 5.46 17.68 5.32 17.37 5.22C17.06 5.13 16.72 5.07 16.36 5.05C16.01 5.03 15.63 5.05 15.25 5.11C14.87 5.17 14.48 5.27 14.09 5.41C13.7 5.56 13.31 5.74 12.93 5.96C12.55 6.18 12.17 6.45 11.81 6.74C11.45 7.03 11.11 7.36 10.79 7.71C10.48 8.07 10.18 8.46 9.91 8.86C9.65 9.26 9.41 9.69 9.21 10.13"
const MARK_BASE = "M8.46 15.18C8.53 15.59 8.64 15.98 8.78 16.34C8.92 16.7 9.09 17.04 9.28 17.33C9.48 17.63 9.7 17.89 9.94 18.11C10.18 18.33 10.45 18.52 10.72 18.65C10.99 18.79 11.28 18.88 11.57 18.93C11.86 18.97 12.15 18.97 12.44 18.93C12.73 18.88 13.02 18.78 13.29 18.65C13.56 18.51 13.82 18.33 14.06 18.11C14.3 17.89 14.53 17.62 14.72 17.32C14.92 17.03 15.09 16.69 15.23 16.33C15.36 15.97 15.47 15.58 15.54 15.17C15.61 14.76 15.65 14.32 15.65 13.88C15.65 13.44 15.61 12.98 15.54 12.53C15.46 12.07 15.35 11.61 15.2 11.15C15.05 10.7 14.86 10.25 14.64 9.82C14.43 9.39 14.17 8.97 13.89 8.57M9.89 5.41C9.5 5.26 9.1 5.16 8.72 5.1C8.34 5.04 7.96 5.03 7.61 5.05C7.26 5.07 6.92 5.13 6.61 5.23C6.3 5.33 6.01 5.47 5.75 5.64C5.5 5.8 5.28 6.01 5.1 6.24C4.91 6.46 4.76 6.72 4.66 6.99C4.56 7.27 4.5 7.56 4.48 7.87C4.46 8.17 4.49 8.49 4.56 8.81C4.64 9.13 4.76 9.46 4.92 9.77C5.08 10.09 5.28 10.41 5.53 10.7C5.77 11 6.06 11.29 6.38 11.56C6.7 11.82 7.06 12.07 7.44 12.29C7.82 12.51 8.24 12.71 8.67 12.87C9.1 13.03 9.57 13.16 10.03 13.26C10.5 13.36 10.98 13.42 11.47 13.45C11.95 13.47 12.44 13.46 12.92 13.42"

/** The mark's 24×24 glyph, scaled to `glyph` px and centered on a `size` px canvas. */
function markSvg({ width, height = width, glyph, background, radius = 0 }) {
  const scale = glyph / 24
  const x = (width - glyph) / 2
  const y = (height - glyph) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" rx="${radius}" fill="${background}"/>
  <g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${PAPER}" stroke-width="1.8" stroke-linecap="round">
    <path d="${MARK_BASE}"/>
    <path d="${MARK_ACCENT}" stroke="${TEAL}"/>
  </g>
</svg>`
}

/** Launch screen: the ink tile on paper, as the app looks while it loads. */
function splashSvg(width, height) {
  const tile = Math.round(Math.min(width, height) * 0.22)
  const glyph = tile * 0.8
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
  await png(markSvg({ width: size, glyph: size * 0.8, background: INK, radius: size * 0.22 }), `public/icons/icon-${size}.png`)
}
// Maskable: full-bleed, glyph inside the 80% safe zone.
await png(markSvg({ width: 512, glyph: 512 * 0.62, background: INK }), "public/icons/maskable-512.png")
// iOS home screen: opaque square; iOS rounds the corners itself.
await png(markSvg({ width: 180, glyph: 180 * 0.74, background: INK }), "src/app/apple-icon.png")

for (const [w, h] of SPLASH_SCREENS) {
  await png(splashSvg(w, h), `public/splash/${w}x${h}.png`)
  await png(splashSvg(h, w), `public/splash/${h}x${w}.png`)
}

// Favicon: an .ico wrapping 16/32/48 px PNGs (the format allows PNG entries).
const sizes = [16, 32, 48]
const images = await Promise.all(sizes.map((s) =>
  sharp(Buffer.from(markSvg({ width: s, glyph: s * 0.78, background: INK, radius: s * 0.22 }))).png().toBuffer()))
const header = Buffer.alloc(6 + 16 * sizes.length)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
sizes.forEach((s, i) => {
  const e = 6 + 16 * i
  header.writeUInt8(s, e)
  header.writeUInt8(s, e + 1)
  header.writeUInt16LE(1, e + 4)
  header.writeUInt16LE(32, e + 6)
  header.writeUInt32LE(images[i].length, e + 8)
  header.writeUInt32LE(offset, e + 12)
  offset += images[i].length
})
await writeFile(join(root, "src/app/favicon.ico"), Buffer.concat([header, ...images]))
console.log("✓", "src/app/favicon.ico")
