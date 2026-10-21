import type { Task } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

type Seed = Omit<Task, "createdAt" | "description"> & { description?: string }

export function seedTasks(): Task[] {
  const seeds: Seed[] = [
    { id: "tsk_1", title: "Prepare for H&M technical interview", description: "Review React performance patterns, Core Web Vitals and a past system design.", priority: "critical", status: "in_progress", dueDate: daysFromNow(0, 18), related: { type: "application", id: "app_hm_fe", label: "H&M — Frontend Engineer" } },
    { id: "tsk_2", title: "Reply to Apeiron offer", description: "Compare with Nomni timeline before responding.", priority: "high", status: "todo", dueDate: daysFromNow(0, 20), related: { type: "application", id: "app_apeiron_fe", label: "Apeiron — Frontend Engineer" } },
    { id: "tsk_3", title: "Send resume to Anivar for referral", priority: "high", status: "todo", dueDate: daysFromNow(1), related: { type: "contact", id: "ct_anivar", label: "Anivar A Aravind" } },
    { id: "tsk_4", title: "Follow up with Freshworks recruiter", priority: "medium", status: "todo", dueDate: daysFromNow(-1), related: { type: "application", id: "app_fresh_fe", label: "Freshworks — Software Engineer" } },
    { id: "tsk_5", title: "Finish command palette for Personal OS", priority: "medium", status: "in_progress", dueDate: daysFromNow(3), related: { type: "project", id: "prj_pos", label: "Personal OS" } },
    { id: "tsk_6", title: "Write system design notes: rate limiter", priority: "low", status: "todo", dueDate: daysFromNow(5) },
    { id: "tsk_7", title: "Update React Native resume with Expo Router work", priority: "medium", status: "todo", dueDate: daysFromNow(-3) },
    { id: "tsk_8", title: "Research Nomni engineering blog", priority: "low", status: "todo", dueDate: daysFromNow(2), related: { type: "company", id: "cmp_nomni", label: "Nomni" } },
    { id: "tsk_9", title: "Draft Exterva data model", priority: "medium", status: "todo", dueDate: daysFromNow(7), related: { type: "project", id: "prj_exterva", label: "Exterva" } },
    { id: "tsk_10", title: "Submit Tether take-home", priority: "high", status: "done", dueDate: daysFromNow(-2), completedAt: daysFromNow(-2, 21) },
    { id: "tsk_11", title: "Renew Google Cloud certification", priority: "low", status: "done", dueDate: daysFromNow(-5), completedAt: daysFromNow(-6, 12) },
    { id: "tsk_12", title: "Thank-you note to Nomni panel", priority: "medium", status: "done", dueDate: daysFromNow(-5), completedAt: daysFromNow(-5, 19), related: { type: "application", id: "app_nomni_fs", label: "Nomni — Full Stack Engineer" } },
  ]
  return seeds.map((seed) => ({ description: "", ...seed, createdAt: daysFromNow(-7) }))
}
