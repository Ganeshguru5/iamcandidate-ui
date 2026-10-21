import type { Resume, UserProfile } from "@/lib/types"

/** Printable, paper-like rendering of a resume (used by preview + editor). */
export function ResumePaper({ resume, profile }: { resume: Resume; profile?: UserProfile }) {
  return (
    <article className="mx-auto w-full max-w-[720px] rounded-lg bg-white p-8 text-[13px] leading-relaxed text-zinc-800 shadow-sm ring-1 ring-black/5 sm:p-10">
      <header className="border-b border-zinc-200 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{profile?.name ?? "Ganeshguru"}</h1>
        <p className="mt-0.5 text-sm font-medium text-zinc-600">{resume.targetRole}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {profile?.email ?? "demo@example.com"} · {profile?.location ?? "Chennai, India"} · github.com/ganeshguru
        </p>
      </header>

      {resume.summary && (
        <section className="mt-4">
          <h2 className="mb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Summary</h2>
          <p>{resume.summary}</p>
        </section>
      )}

      {resume.skills.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Skills</h2>
          <p>{resume.skills.join(" · ")}</p>
        </section>
      )}

      {resume.experience.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Experience</h2>
          <div className="space-y-3">
            {resume.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="font-semibold text-zinc-950">
                    {exp.title} <span className="font-normal text-zinc-600">· {exp.company}</span>
                  </p>
                  <p className="text-xs text-zinc-500">{exp.period}</p>
                </div>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 marker:text-zinc-400">
                  {exp.highlights.filter(Boolean).map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.education.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Education</h2>
          {resume.education.map((edu) => (
            <div key={edu.id} className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p>
                <span className="font-semibold text-zinc-950">{edu.degree}</span> · {edu.school}
              </p>
              <p className="text-xs text-zinc-500">{edu.period}</p>
            </div>
          ))}
        </section>
      )}
    </article>
  )
}

/** Builds a plain-text version for the simulated download. */
export function resumeToText(resume: Resume, profile?: UserProfile): string {
  const lines = [
    profile?.name ?? "Ganeshguru",
    resume.targetRole,
    `${profile?.email ?? "demo@example.com"} · ${profile?.location ?? ""}`,
    "",
    "SUMMARY",
    resume.summary,
    "",
    "SKILLS",
    resume.skills.join(", "),
    "",
    "EXPERIENCE",
    ...resume.experience.flatMap((e) => [`${e.title} — ${e.company} (${e.period})`, ...e.highlights.map((h) => `  • ${h}`), ""]),
    "EDUCATION",
    ...resume.education.map((e) => `${e.degree} — ${e.school} (${e.period})`),
  ]
  return lines.join("\n")
}

export function downloadResume(resume: Resume, profile?: UserProfile) {
  const blob = new Blob([resumeToText(resume, profile)], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${(profile?.name ?? "Resume").replace(/\s+/g, "_")}_${resume.title.replace(/\s+/g, "_")}_${resume.version}.txt`
  link.click()
  URL.revokeObjectURL(url)
}
