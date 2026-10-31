import type { AutofillProfile, Resume } from "@/lib/types"

/** A profile with nothing filled in. */
export const EMPTY_AUTOFILL: AutofillProfile = {
  firstName: "",
  lastName: "",
  preferredName: "",
  email: "",
  phone: "",
  pronouns: "",
  addressLine: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  linkedin: "",
  github: "",
  portfolio: "",
  currentTitle: "",
  currentCompany: "",
  experienceYears: "",
  noticePeriod: "",
  currentSalary: "",
  expectedSalary: "",
  workAuthorization: "",
  needsSponsorship: "",
  willingToRelocate: "",
  school: "",
  degree: "",
  fieldOfStudy: "",
  graduationYear: "",
  gender: "",
  ethnicity: "",
  disability: "",
  veteran: "",
  summary: "",
  coverLetter: "",
  answers: [],
}

export type AutofillTextField = Exclude<keyof AutofillProfile, "answers" | "updatedAt">

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

/** A point in time from "Mar 2021", "03/2021", "2021" or "Present", as months since year 0. */
function monthOf(text: string, now: Date): number | undefined {
  const value = text.trim().toLowerCase()
  if (!value) return undefined
  if (/present|current|now|today/.test(value)) return now.getFullYear() * 12 + now.getMonth()
  const year = Number(value.match(/(19|20)\d{2}/)?.[0])
  if (!year) return undefined
  const named = MONTHS.findIndex((m) => value.includes(m))
  const numeric = Number(value.match(/\b(0?[1-9]|1[0-2])\s*[/.-]\s*(19|20)\d{2}/)?.[1])
  return year * 12 + (named >= 0 ? named : numeric ? numeric - 1 : 0)
}

/** "Jan 2021 – Present" → [start, end] in months; undefined if it can't be read. */
function spanOf(period: string, now: Date): [number, number] | undefined {
  const [from = "", to = ""] = period.split(/\s+(?:-|–|—|to)\s+|\s*[–—]\s*/i)
  const start = monthOf(from, now)
  const end = to ? monthOf(to, now) : start
  return start !== undefined && end !== undefined && end >= start ? [start, end] : undefined
}

/** Total years across experience periods, overlaps counted once; "" if none can be read. */
export function yearsOfExperience(resume: Resume, now = new Date()): string {
  const spans = resume.experience
    .map((e) => spanOf(e.period, now))
    .filter((s): s is [number, number] => !!s)
    .sort((a, b) => a[0] - b[0])
  if (!spans.length) return ""
  let months = 0
  let [start, end] = spans[0]!
  for (const [s, e] of spans.slice(1)) {
    if (s <= end) end = Math.max(end, e)
    else {
      months += end - start
      ;[start, end] = [s, e]
    }
  }
  months += end - start
  const years = Math.round((months / 12) * 10) / 10
  return years >= 0.1 ? String(years) : ""
}

/**
 * What a structured resume can tell the autofill profile: current role and
 * company (from the first experience entry, the latest by convention), years
 * of experience, latest education and the summary.
 */
export function detailsFromResume(resume: Resume): Partial<Record<AutofillTextField, string>> {
  const latest = resume.experience[0]
  const school = resume.education[0]
  const graduated = school?.period.match(/(19|20)\d{2}(?!.*(19|20)\d{2})/)?.[0] ?? ""
  return {
    currentTitle: latest?.title ?? "",
    currentCompany: latest?.company ?? "",
    experienceYears: yearsOfExperience(resume),
    school: school?.school ?? "",
    degree: school?.degree ?? "",
    graduationYear: graduated,
    summary: resume.summary,
  }
}
