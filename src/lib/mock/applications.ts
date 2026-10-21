import type { Application, ApplicationStatus, TimelineEvent } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

const STATUS_STEPS: Array<{ status: ApplicationStatus; title: string }> = [
  { status: "applied", title: "Application submitted" },
  { status: "recruiter", title: "Recruiter contacted" },
  { status: "technical", title: "Technical interview scheduled" },
  { status: "hr", title: "Moved to HR round" },
  { status: "offer", title: "Offer received" },
]

function buildTimeline(id: string, status: ApplicationStatus, appliedAgo: number): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { id: `${id}_t0`, date: daysFromNow(-appliedAgo - 2, 10), title: "Saved to wishlist", type: "created" },
  ]
  if (status === "wishlist") return events
  const reached =
    status === "rejected" ? 2 : STATUS_STEPS.findIndex((s) => s.status === status) + 1
  STATUS_STEPS.slice(0, reached).forEach((step, i) => {
    events.push({
      id: `${id}_t${i + 1}`,
      date: daysFromNow(-appliedAgo + i * 2, 11 + i),
      title: step.title,
      type: step.status === "technical" ? "interview" : "status",
    })
  })
  if (status === "rejected") {
    events.push({
      id: `${id}_tr`,
      date: daysFromNow(-appliedAgo + 5, 16),
      title: "Application closed — not moving forward",
      type: "status",
    })
  }
  return events
}

type Seed = Omit<Application, "timeline" | "createdAt" | "updatedAt" | "notes" | "priority" | "appliedDate"> & {
  appliedAgo: number
  notes?: string
  priority?: Application["priority"]
}

export function seedApplications(): Application[] {
  const seeds: Seed[] = [
    { id: "app_hm_fe", companyId: "cmp_hm", role: "Frontend Engineer", location: "Bengaluru", workMode: "hybrid", salary: "₹28–34 LPA", status: "technical", appliedAgo: 9, nextFollowUp: daysFromNow(2), jobId: "HM-48213", jobUrl: "https://career.hm.com/jobs/48213", source: "Referral", recruiterId: "ct_priya", resumeId: "res_frontend", priority: "high", description: "Build and scale the customer-facing commerce experience using React, Next.js and the H&M design system. Partner with design and platform teams to improve Core Web Vitals across markets.", notes: "Team focuses on checkout performance. Brush up on Core Web Vitals and RSC streaming." },
    { id: "app_tether_fe", companyId: "cmp_tether", role: "Senior Frontend Developer", location: "Remote", workMode: "remote", salary: "$70–90k", status: "recruiter", appliedAgo: 6, nextFollowUp: daysFromNow(1), jobId: "TT-1192", jobUrl: "https://tether.io/careers/1192", source: "LinkedIn", recruiterId: "ct_lukas", resumeId: "res_frontend", priority: "high", description: "Own the wallet UI across web and React Native." },
    { id: "app_nomni_fs", companyId: "cmp_nomni", role: "Full Stack Engineer", location: "Remote · EU", workMode: "remote", salary: "€55–65k", status: "hr", appliedAgo: 18, nextFollowUp: daysFromNow(3), jobId: "NM-77", jobUrl: "https://nomni.com/jobs/77", source: "Wellfound", recruiterId: "ct_sofia", resumeId: "res_fullstack", priority: "high", description: "Build ordering flows end-to-end with Next.js and Node.js." },
    { id: "app_apeiron_fe", companyId: "cmp_apeiron", role: "Frontend Engineer", location: "Chennai", workMode: "onsite", salary: "₹18–22 LPA", status: "offer", appliedAgo: 24, nextFollowUp: daysFromNow(0), jobId: "AP-310", jobUrl: "https://apeiron.example.com/careers/310", source: "Company site", recruiterId: "ct_divya", resumeId: "res_frontend", priority: "medium", notes: "Offer letter received. Decision due by Friday." },
    { id: "app_zoho_rn", companyId: "cmp_zoho", role: "React Native Developer", location: "Chennai", workMode: "onsite", salary: "₹16–20 LPA", status: "wishlist", appliedAgo: 0, jobId: "ZH-5521", jobUrl: "https://careers.zohocorp.com/5521", source: "Company site", priority: "medium" },
    { id: "app_fresh_fe", companyId: "cmp_freshworks", role: "Software Engineer — Frontend", location: "Chennai", workMode: "hybrid", salary: "₹22–28 LPA", status: "applied", appliedAgo: 4, nextFollowUp: daysFromNow(-1), jobId: "FW-20931", jobUrl: "https://freshworks.com/company/careers/20931", source: "Referral", recruiterId: "ct_neha", resumeId: "res_frontend", priority: "high" },
    { id: "app_fresh_sde", companyId: "cmp_freshworks", role: "SDE II — Platform UI", location: "Chennai", workMode: "hybrid", status: "rejected", appliedAgo: 34, jobId: "FW-19004", source: "LinkedIn", resumeId: "res_swe", priority: "low" },
    { id: "app_razorpay_fe", companyId: "cmp_razorpay", role: "Frontend Engineer II", location: "Bengaluru", workMode: "hybrid", salary: "₹30–38 LPA", status: "wishlist", appliedAgo: 0, jobId: "RZP-881", jobUrl: "https://razorpay.com/jobs/881", source: "LinkedIn", priority: "medium" },
    { id: "app_postman_fe", companyId: "cmp_postman", role: "Software Engineer, Web", location: "Bengaluru", workMode: "hybrid", status: "applied", appliedAgo: 2, nextFollowUp: daysFromNow(5), jobId: "PM-4410", jobUrl: "https://postman.com/careers/4410", source: "Company site", resumeId: "res_swe", priority: "medium" },
    { id: "app_atlassian_fe", companyId: "cmp_atlassian", role: "Frontend Engineer", location: "Bengaluru", workMode: "hybrid", status: "rejected", appliedAgo: 52, jobId: "ATL-7781", source: "LinkedIn", resumeId: "res_frontend", priority: "low" },
    { id: "app_swiggy_rn", companyId: "cmp_swiggy", role: "React Native Engineer", location: "Bengaluru", workMode: "onsite", status: "rejected", appliedAgo: 44, jobId: "SW-339", source: "Naukri", resumeId: "res_rn", priority: "low" },
    { id: "app_hm_rn", companyId: "cmp_hm", role: "Mobile Engineer — React Native", location: "Bengaluru", workMode: "hybrid", status: "applied", appliedAgo: 11, nextFollowUp: daysFromNow(4), jobId: "HM-48877", source: "Referral", resumeId: "res_rn", priority: "medium" },
    { id: "app_tether_fs", companyId: "cmp_tether", role: "Full Stack Engineer — Payments", location: "Remote", workMode: "remote", status: "technical", appliedAgo: 15, nextFollowUp: daysFromNow(6), jobId: "TT-1240", source: "LinkedIn", resumeId: "res_fullstack", priority: "medium" },
    { id: "app_zoho_fe", companyId: "cmp_zoho", role: "Member Technical Staff — Web", location: "Chennai", workMode: "onsite", status: "applied", appliedAgo: 20, jobId: "ZH-5012", source: "Company site", resumeId: "res_swe", priority: "low" },
    { id: "app_nomni_fe", companyId: "cmp_nomni", role: "Frontend Engineer", location: "Remote · EU", workMode: "remote", status: "recruiter", appliedAgo: 13, nextFollowUp: daysFromNow(2), jobId: "NM-81", source: "Wellfound", resumeId: "res_frontend", priority: "medium" },
    { id: "app_postman_ds", companyId: "cmp_postman", role: "Design Systems Engineer", location: "Bengaluru", workMode: "hybrid", status: "wishlist", appliedAgo: 0, source: "Twitter", priority: "low" },
  ]
  return seeds.map(({ appliedAgo, ...seed }) => ({
    notes: "",
    priority: "medium",
    ...seed,
    appliedDate: seed.status === "wishlist" ? undefined : daysFromNow(-appliedAgo, 11),
    timeline: buildTimeline(seed.id, seed.status, appliedAgo),
    createdAt: daysFromNow(-appliedAgo - 2, 10),
    updatedAt: daysFromNow(-Math.min(appliedAgo, 3)),
  }))
}
