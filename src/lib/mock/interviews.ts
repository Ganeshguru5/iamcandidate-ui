import type { Interview } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

export function seedInterviews(): Interview[] {
  return [
    { id: "int_1", applicationId: "app_hm_fe", type: "technical", scheduledAt: daysFromNow(1, 15, 30), durationMinutes: 60, interviewers: ["Johan Lind", "Ritu Kapoor"], meetingUrl: "https://meet.example.com/hm-fe", status: "scheduled", notes: "Live coding in React and a discussion on performance.", createdAt: daysFromNow(-3) },
    { id: "int_2", applicationId: "app_tether_fe", type: "recruiter_screen", scheduledAt: daysFromNow(2, 18), durationMinutes: 30, interviewers: ["Lukas Meyer"], meetingUrl: "https://meet.example.com/tether", status: "scheduled", notes: "", createdAt: daysFromNow(-2) },
    { id: "int_3", applicationId: "app_nomni_fs", type: "hr", scheduledAt: daysFromNow(4, 14), durationMinutes: 45, interviewers: ["Sofia Alvarez"], meetingUrl: "https://meet.example.com/nomni", status: "scheduled", notes: "Compensation and notice period discussion.", createdAt: daysFromNow(-1) },
    { id: "int_4", applicationId: "app_tether_fs", type: "system_design", scheduledAt: daysFromNow(6, 17), durationMinutes: 60, interviewers: ["Ana Petrova"], status: "scheduled", notes: "Design a payments dashboard.", createdAt: daysFromNow(-1) },
    { id: "int_5", applicationId: "app_nomni_fs", type: "technical", scheduledAt: daysFromNow(-6, 16), durationMinutes: 75, interviewers: ["Marco Rossi", "Lea Dubois"], status: "completed", notes: "Went well — asked about React Server Components and caching.", createdAt: daysFromNow(-12) },
    { id: "int_6", applicationId: "app_apeiron_fe", type: "final", scheduledAt: daysFromNow(-8, 11), durationMinutes: 45, interviewers: ["Karthik Subramanian"], status: "completed", notes: "Culture fit and architecture discussion.", createdAt: daysFromNow(-14) },
    { id: "int_7", applicationId: "app_hm_fe", type: "recruiter_screen", scheduledAt: daysFromNow(-5, 12), durationMinutes: 30, interviewers: ["Priya Raman"], status: "completed", notes: "", createdAt: daysFromNow(-8) },
    { id: "int_8", applicationId: "app_fresh_sde", type: "technical", scheduledAt: daysFromNow(-28, 15), durationMinutes: 60, interviewers: ["Sanjay P"], status: "completed", notes: "Struggled with the graph problem.", createdAt: daysFromNow(-30) },
  ]
}
