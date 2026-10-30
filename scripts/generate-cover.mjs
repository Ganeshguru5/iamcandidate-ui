/**
 * Renders the IamCandidate brand images: the two-tone wordmark ("Iam" in
 * teal, "Candidate" in ink) on the light paper theme.
 *
 *   node scripts/generate-cover.mjs
 *
 * Writes iamcandidate-cover.png (2400×1500, wordmark + app mock) at the repo
 * root, and the 1600×1200 project card to ../ganesh-portfolio/public/Images/
 * when that repo sits next to this one.
 */
import { readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

// The mark's paths, read from brand.tsx so the cover never drifts from it.
const brand = await readFile(join(root, "src/components/layout/brand.tsx"), "utf8")
const MARK_ACCENT = brand.match(/MARK_ACCENT =\s*"([^"]+)"/)[1]
const MARK_BASE = brand.match(/MARK_BASE =\s*"([^"]+)"/)[1]

// globals.css, light theme.
const PAPER = "#fcfbf8"
const PAPER_2 = "#f4f2ec"
const INK = "#1b2230"
const MUTED = "#5d6676"
const BORDER = "#e6e2d9"
const BRAND = "#13877d"
const BRAND_SOFT = "#e3f2ef"
const TEAL_ON_INK = "#42cab4"

const W = 2400
const H = 1500
const SANS = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
const MONO = "Consolas, 'Cascadia Mono', 'Courier New', monospace"

function mark(x, y, size) {
  const glyph = size * 0.66
  const s = glyph / 24
  const o = (size - glyph) / 2
  return `<g transform="translate(${x} ${y})">
    <rect width="${size}" height="${size}" rx="${size * 0.28}" fill="${INK}"/>
    <g transform="translate(${o} ${o}) scale(${s})" fill="none" stroke="${PAPER}" stroke-width="2" stroke-linecap="round">
      <path d="${MARK_BASE}"/>
      <path d="${MARK_ACCENT}" stroke="${TEAL_ON_INK}"/>
    </g>
  </g>`
}

/** "Iam" in teal, "Candidate" in ink. */
function wordmark(x, y, size, weight = 700) {
  return `<text x="${x}" y="${y}" font-family="${SANS}" font-size="${size}" font-weight="${weight}" letter-spacing="${-size * 0.03}"><tspan fill="${BRAND}">Iam</tspan><tspan fill="${INK}">Candidate</tspan></text>`
}

function text(x, y, value, { size = 24, weight = 400, fill = INK, family = SANS, anchor = "start", spacing = 0 } = {}) {
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${spacing}">${value}</text>`
}

function chip(x, y, label) {
  const w = label.length * 17 + 44
  return {
    w,
    svg: `<g transform="translate(${x} ${y})">
      <rect width="${w}" height="56" rx="28" fill="#ffffff" stroke="${BORDER}" stroke-width="2"/>
      ${text(w / 2, 37, label, { size: 26, family: MONO, fill: INK, anchor: "middle" })}
    </g>`,
  }
}

function chips(x, y, labels, maxRight) {
  let cx = x
  let cy = y
  const out = []
  for (const label of labels) {
    const { w, svg } = chip(cx, cy, label)
    if (cx + w > maxRight) {
      cx = x
      cy += 72
      out.push(chip(cx, cy, label).svg)
    } else {
      out.push(svg)
    }
    cx += w + 14
  }
  return out.join("\n")
}

/* ------------------------------------------------------------------ */
/* App mock                                                            */
/* ------------------------------------------------------------------ */

const APP = { x: 1240, y: 250, w: 1300, h: 860 }
const SIDEBAR = 290

function navItem(y, label, active = false) {
  const x = APP.x + 20
  return `${active ? `<rect x="${x}" y="${y - 34}" width="${SIDEBAR - 40}" height="52" rx="14" fill="${BRAND_SOFT}"/>` : ""}
    <rect x="${x + 20}" y="${y - 17}" width="18" height="18" rx="5" fill="none" stroke="${active ? BRAND : "#9aa1ad"}" stroke-width="2.4"/>
    ${text(x + 56, y, label, { size: 23, weight: active ? 600 : 400, fill: active ? BRAND : "#3a4252" })}`
}

function stat(x, y, label, value, note, noteColor = BRAND) {
  return `<g transform="translate(${x} ${y})">
    <rect width="300" height="160" rx="22" fill="#ffffff" stroke="${BORDER}" stroke-width="2"/>
    ${text(28, 46, label, { size: 21, fill: MUTED })}
    ${text(28, 108, value, { size: 54, weight: 700, spacing: -1.5 })}
    ${text(28, 140, note, { size: 19, weight: 500, fill: noteColor })}
  </g>`
}

const STAGES = [
  { name: "Applied", color: "#4f7cf0", cards: [["Frontend Eng.", "Stripe", 0.25], ["UI Developer", "Notion", 0.2]] },
  { name: "Screening", color: "#e39b2d", cards: [["Product Eng.", "Vercel", 0.45], ["Full-stack", "Figma", 0.4]] },
  { name: "Interview", color: "#8b5cf6", cards: [["SDE II", "Atlassian", 0.7], ["Web Eng.", "Canva", 0.6]] },
  { name: "Offer", color: BRAND, cards: [["Frontend", "Razorpay", 0.95]] },
]

function board(x, y) {
  const colW = 216
  const out = [
    `<rect x="${x}" y="${y}" width="${colW * 4 + 3 * 16 + 48}" height="470" rx="24" fill="#ffffff" stroke="${BORDER}" stroke-width="2"/>`,
    text(x + 28, y + 52, "Pipeline", { size: 26, weight: 600 }),
    text(x + colW * 4 + 3 * 16 + 20, y + 52, "This month", { size: 20, fill: MUTED, anchor: "end" }),
  ]
  STAGES.forEach((stage, i) => {
    const cx = x + 24 + i * (colW + 16)
    out.push(`<circle cx="${cx + 8}" cy="${y + 98}" r="6" fill="${stage.color}"/>`)
    out.push(text(cx + 24, y + 105, stage.name, { size: 19, fill: MUTED }))
    stage.cards.forEach(([role, company, progress], j) => {
      const cy = y + 128 + j * 150
      out.push(`<g transform="translate(${cx} ${cy})">
        <rect width="${colW}" height="132" rx="16" fill="${PAPER}" stroke="${BORDER}" stroke-width="2"/>
        ${text(20, 42, role, { size: 21, weight: 600 })}
        ${text(20, 72, company, { size: 18, fill: MUTED })}
        <rect x="20" y="104" width="${colW - 40}" height="7" rx="3.5" fill="#ebe8e1"/>
        <rect x="20" y="104" width="${(colW - 40) * progress}" height="7" rx="3.5" fill="${stage.color}"/>
      </g>`)
    })
  })
  return out.join("\n")
}

function appMock() {
  const { x, y, w, h } = APP
  const main = x + SIDEBAR + 40
  return `<g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="32" fill="#ffffff" stroke="${BORDER}" stroke-width="2"/>
  </g>
  <clipPath id="app"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="32"/></clipPath>
  <g clip-path="url(#app)">
    <rect x="${x}" y="${y}" width="${SIDEBAR}" height="${h}" fill="${PAPER_2}"/>
    <line x1="${x + SIDEBAR}" y1="${y}" x2="${x + SIDEBAR}" y2="${y + h}" stroke="${BORDER}" stroke-width="2"/>
    ${mark(x + 28, y + 30, 46)}
    ${wordmark(x + 88, y + 64, 27)}
    ${navItem(y + 150, "Dashboard", true)}
    ${text(x + 40, y + 228, "CAREER", { size: 16, weight: 600, fill: "#8d94a0", spacing: 2 })}
    ${navItem(y + 282, "Applications")}
    ${navItem(y + 340, "Interviews")}
    ${navItem(y + 398, "Contacts")}
    ${navItem(y + 456, "Résumés")}
    ${text(x + 40, y + 534, "WORKSPACE", { size: 16, weight: 600, fill: "#8d94a0", spacing: 2 })}
    ${navItem(y + 588, "Documents")}
    ${navItem(y + 646, "Notes")}
    ${navItem(y + 704, "Tasks")}
    ${navItem(y + 762, "Projects")}

    ${text(main, y + 84, "Good morning, Ganesh", { size: 40, weight: 700, spacing: -1 })}
    ${text(main, y + 122, "3 follow-ups due today · 2 interviews this week", { size: 21, fill: MUTED })}
    <rect x="${x + w - 330}" y="${y + 46}" width="300" height="54" rx="27" fill="${PAPER}" stroke="${BORDER}" stroke-width="2"/>
    ${text(x + w - 300, y + 81, "Search everything", { size: 20, fill: "#8d94a0" })}
    ${text(x + w - 60, y + 81, "⌘K", { size: 18, fill: "#8d94a0", family: MONO, anchor: "end" })}

    ${stat(main, y + 160, "Applications", "48", "+6 this week")}
    ${stat(main + 320, y + 160, "Interviews", "7", "3 upcoming", "#8b5cf6")}
    ${stat(main + 640, y + 160, "Response rate", "32%", "+4.1% vs last month")}

    ${board(main, y + 350)}
  </g>`
}

function palette() {
  const x = 1060
  const y = 1040
  const w = 560
  const rows = [
    ["#8b5cf6", "Interview · Atlassian SDE II", "Tomorrow", true],
    ["#e39b2d", "Note · Interview prep checklist", "Notes"],
    [BRAND, "Task · Send thank-you email", "Tasks"],
  ]
  return `<g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="284" rx="26" fill="#ffffff" stroke="${BORDER}" stroke-width="2"/>
  </g>
  ${text(x + 30, y + 54, "interv", { size: 25 })}
  <rect x="${x + 104}" y="${y + 30}" width="3" height="32" fill="${BRAND}"/>
  <rect x="${x + w - 74}" y="${y + 28}" width="48" height="32" rx="8" fill="${PAPER_2}"/>
  ${text(x + w - 50, y + 50, "esc", { size: 17, family: MONO, fill: MUTED, anchor: "middle" })}
  <line x1="${x}" y1="${y + 84}" x2="${x + w}" y2="${y + 84}" stroke="${BORDER}" stroke-width="2"/>
  ${rows
    .map(([color, label, meta, active], i) => {
      const ry = y + 100 + i * 58
      return `${active ? `<rect x="${x + 14}" y="${ry}" width="${w - 28}" height="52" rx="14" fill="${BRAND_SOFT}"/>` : ""}
      <circle cx="${x + 40}" cy="${ry + 26}" r="6" fill="${color}"/>
      ${text(x + 60, ry + 34, label, { size: 21, weight: active ? 600 : 400, fill: active ? INK : "#3a4252" })}
      ${text(x + w - 34, ry + 33, meta, { size: 17, fill: MUTED, anchor: "end" })}`
    })
    .join("\n")}`
}

/* ------------------------------------------------------------------ */
/* Cover                                                               */
/* ------------------------------------------------------------------ */

const LEFT = 150

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.6" fill="#1b2230" fill-opacity="0.07"/>
    </pattern>
    <radialGradient id="glow" cx="78%" cy="18%" r="60%">
      <stop offset="0" stop-color="${BRAND}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${BRAND}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="8%" cy="95%" r="45%">
      <stop offset="0" stop-color="${BRAND}" stop-opacity="0.08"/>
      <stop offset="1" stop-color="${BRAND}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#1b2230" flood-opacity="0.12"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>

  ${mark(LEFT, 330, 128)}
  ${wordmark(LEFT - 6, 640, 150, 800)}
  <rect x="${LEFT}" y="682" width="96" height="8" rx="4" fill="${BRAND}"/>

  ${text(LEFT, 790, "Your job search, documents", { size: 60, weight: 700, spacing: -1.5 })}
  <text x="${LEFT}" y="866" font-family="${SANS}" font-size="60" font-weight="700" letter-spacing="-1.5" fill="${INK}">and notes, <tspan fill="${BRAND}">in one calm place.</tspan></text>

  ${text(LEFT, 950, "Applications, contacts, interviews, résumés and tasks —", { size: 32, fill: MUTED })}
  ${text(LEFT, 996, "one fast, keyboard-first workspace.", { size: 32, fill: MUTED })}

  ${chips(LEFT, 1070, ["Next.js 16", "React 19", "TypeScript", "Tailwind 4", "AWS SAM · S3"], 1010)}

  ${appMock()}
  ${palette()}
</svg>`

const out = join(root, "iamcandidate-cover.png")
await writeFile(out, await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer())
console.log("✓", out)

/* ------------------------------------------------------------------ */
/* Portfolio project card (1600×1200)                                  */
/* ------------------------------------------------------------------ */

function tabBar(cx, y) {
  const items = ["Dashboard", "Applications", "Chat", "Tasks"]
  const itemW = 168
  const barW = itemW * items.length + 24
  const x = cx - (barW + 24 + 120) / 2
  return `<g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${barW}" height="120" rx="60" fill="#ffffff" stroke="${BORDER}" stroke-width="2"/>
    <circle cx="${x + barW + 24 + 60}" cy="${y + 60}" r="60" fill="#ffffff" stroke="${BORDER}" stroke-width="2"/>
  </g>
  ${items
    .map((label, i) => {
      const ix = x + 12 + i * itemW
      const active = i === 1
      return `${active ? `<rect x="${ix}" y="${y + 12}" width="${itemW}" height="96" rx="48" fill="${BRAND_SOFT}"/>` : ""}
      ${text(ix + itemW / 2, y + 70, label, { size: 27, weight: active ? 600 : 400, fill: active ? BRAND : "#3a4252", anchor: "middle" })}`
    })
    .join("\n")}
  ${[-14, 0, 14].map((d) => `<rect x="${x + barW + 24 + 38}" y="${y + 58 + d}" width="44" height="5" rx="2.5" fill="${INK}"/>`).join("")}`
}

const CW = 1600
const CH = 1200
const card = `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">
  <defs>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.6" fill="#1b2230" fill-opacity="0.07"/>
    </pattern>
    <radialGradient id="glow" cx="50%" cy="30%" r="55%">
      <stop offset="0" stop-color="${BRAND}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${BRAND}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-30%" width="140%" height="180%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#1b2230" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="${CW}" height="${CH}" fill="${PAPER}"/>
  <rect width="${CW}" height="${CH}" fill="url(#dots)"/>
  <rect width="${CW}" height="${CH}" fill="url(#glow)"/>

  <g filter="url(#shadow)">${mark(CW / 2 - 105, 170, 210)}</g>
  <text x="${CW / 2}" y="560" text-anchor="middle" font-family="${SANS}" font-size="150" font-weight="800" letter-spacing="-4.5"><tspan fill="${BRAND}">Iam</tspan><tspan fill="${INK}">Candidate</tspan></text>
  ${text(CW / 2, 650, "Your job search, in one calm place", { size: 50, fill: MUTED, anchor: "middle" })}
  ${text(CW / 2, 740, "Applications · Contacts · Chat · Résumés · Documents", { size: 34, weight: 500, fill: BRAND, anchor: "middle" })}

  ${tabBar(CW / 2, 930)}
</svg>`

const portfolioImages = join(root, "../ganesh-portfolio/public/Images")
try {
  await writeFile(join(portfolioImages, "iamcandidate.png"), await sharp(Buffer.from(card)).png({ compressionLevel: 9 }).toBuffer())
  console.log("✓", join(portfolioImages, "iamcandidate.png"))
} catch (error) {
  if (error.code !== "ENOENT") throw error
  console.log("· skipped the portfolio card (no ../ganesh-portfolio)")
}
