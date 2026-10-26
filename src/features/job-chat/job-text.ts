import type { ExtractedJob, WorkMode } from "@/lib/types"

/**
 * Reads a job from text copied off a posting (for sites knot can't fetch,
 * like Naukri). Labelled lines ("Location: Pune") win; otherwise the block
 * above the description is read the way job boards lay it out: title,
 * company, then experience / salary / location lines. Anything unsure is
 * left blank for the user to fill in.
 */

/** Pasted text this long (links aside) is read as a job posting. */
const MIN_JOB_TEXT = 200

export function looksLikeJobText(text: string): boolean {
  return text.trim().length >= MIN_JOB_TEXT && text.split("\n").filter((line) => line.trim()).length >= 3
}

const clean = (value: string) =>
  value
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim()

/** "remote" | "hybrid" | "onsite" | "" from a short label. */
export function workModeFrom(value: string): WorkMode | "" {
  const s = value.toLowerCase()
  if (/\bhybrid\b/.test(s)) return "hybrid"
  if (/\bremote\b|work from home|\bwfh\b/.test(s)) return "remote"
  if (/on-?site|in[- ]office|work from office|\bwfo\b/.test(s)) return "onsite"
  return ""
}

const looksLikeSalary = (value: string) =>
  /[₹$€£]|\b(lpa|lakh|lakhs|lacs|crore|inr|usd|eur|gbp|ctc)\b|\/\s?(yr|year|hr|hour|mo|month)\b|\d+\s?k\b|not disclosed/i.test(
    value,
  )

const LABELS: [keyof ExtractedJob, RegExp][] = [
  ["role", /^(job title|title|position|designation|job role)\s*[:\-–]\s*(.+)$/i],
  ["company", /^(company|company name|organi[sz]ation|employer|hiring company)\s*[:\-–]\s*(.+)$/i],
  ["location", /^(location|locations|job location|work location|city)\s*[:\-–]\s*(.+)$/i],
  ["salary", /^(salary|ctc|compensation|pay|package|stipend)\s*[:\-–]\s*(.+)$/i],
  ["workMode", /^(work ?mode|workplace(?: type)?|work type|work from)\s*[:\-–]\s*(.+)$/i],
  ["jobId", /^(job id|job code|req(?:uisition)? id|reference(?: no\.?)?)\s*[:#\-–]\s*(.+)$/i],
]

/** Headings that start the description; everything above is the header block. */
const DESCRIPTION_HEADING =
  /^(job description|about the (job|role|position|opportunity)|description|job summary|responsibilities|key responsibilities|roles? (and|&) responsibilities|what you('| wi)ll do)\s*:?$/i

/** Header lines that are page chrome or stats, not job details. */
const NOISE =
  /^(posted|openings|applicants|job applicants|send me jobs|apply|apply on company site|save|saved|register to apply|login to apply|share|easy apply|be an early applicant|follow|reviews?|\d[\d.,]*\s*(reviews?|ratings?)|[\d.]+\s*\|.*reviews?|new|actively hiring|urgently hiring|job highlights|job match score)\b|^[\d.]+\s*★?$/i

const EXPERIENCE = /^\d+\s*(-|to|–)\s*\d+\s*(yrs?|years?)|^\d+\+?\s*(yrs?|years?)|^fresher/i

export function parseJobText(text: string): ExtractedJob {
  const job: ExtractedJob = {
    role: "",
    company: "",
    location: "",
    workMode: "",
    salary: "",
    jobId: "",
    jobUrl: "",
    source: "",
    description: "",
  }
  const lines = text
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean)

  // Labelled lines anywhere in the text.
  for (const line of lines) {
    for (const [key, pattern] of LABELS) {
      const value = clean(line.match(pattern)?.[2] ?? "")
      if (!value || job[key]) continue
      if (key === "workMode") job.workMode = workModeFrom(value)
      else if (key === "salary" && /not disclosed/i.test(value)) continue
      else job[key] = value.slice(0, 200)
    }
  }

  const headingAt = lines.findIndex((line) => DESCRIPTION_HEADING.test(line))
  const header = headingAt > 0 ? lines.slice(0, headingAt) : lines.slice(0, 8)

  // Unlabelled header lines, in the order job boards show them.
  const plain: string[] = []
  for (const line of header) {
    if (LABELS.some(([, pattern]) => pattern.test(line))) continue
    if (line.length > 100 || NOISE.test(line) || EXPERIENCE.test(line)) continue
    if (looksLikeSalary(line) && line.length < 80) {
      if (!job.salary && !/not disclosed/i.test(line)) job.salary = line
      continue
    }
    // A bare "Hybrid" / "Remote" line, or a "Hybrid - Pune" location.
    const mode = workModeFrom(line)
    if (mode && !job.workMode) job.workMode = mode
    const rest = line.replace(/^(hybrid|remote|on-?site|work from (home|office))\s*[-–:]?\s*/i, "")
    if (rest) plain.push(rest)
  }
  if (!job.role) job.role = plain.shift() ?? ""
  else if (plain[0] === job.role) plain.shift()
  if (!job.company) job.company = plain.shift() ?? ""
  // Locations are short and free of sentence punctuation.
  if (!job.location) job.location = plain.find((line) => line.length <= 80 && !/[.!?]$/.test(line)) ?? ""
  if (!job.workMode) job.workMode = workModeFrom(job.location)

  const body = headingAt >= 0 ? lines.slice(headingAt + (headingAt > 0 ? 1 : 0)) : lines
  job.description = text.trim() && body.length ? keepParagraphs(text, body[0] ?? "") : ""
  return job
}

/** The pasted text from `firstLine` on, with its line breaks kept. */
function keepParagraphs(text: string, firstLine: string): string {
  const raw = text.replace(/\r\n/g, "\n")
  const rawLines = raw.split("\n")
  const start = Math.max(
    0,
    rawLines.findIndex((line) => clean(line) === firstLine),
  )
  return rawLines
    .slice(start)
    .map((line) => line.replace(/ /g, " ").replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 20000)
}
