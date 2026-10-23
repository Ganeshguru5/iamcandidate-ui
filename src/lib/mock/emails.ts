import type { Email, EmailTemplate, SmtpConfig } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

const ME = { name: "Alex Morgan", email: "demo@example.com" }

export function seedEmails(): Email[] {
  return [
    { id: "em_1", folder: "inbox", from: { name: "Maya Patel", email: "maya.patel@example.com" }, to: [ME.email], cc: [], subject: "Brightwave Retail — Technical interview confirmed", body: "Hi Alex Morgan,\n\nThanks for your time on the recruiter call. I'm happy to confirm your technical interview with Johan and Ritu tomorrow at 3:30 PM IST.\n\nThe session will be 60 minutes: ~40 minutes of live coding in React and ~20 minutes on performance and architecture.\n\nBest of luck!\nPriya", date: daysFromNow(0, 9, 12), read: false, starred: true, applicationId: "app_brightwave_fe", contactId: "ct_maya" },
    { id: "em_2", folder: "inbox", from: { name: "Nina Kapoor", email: "nina.kapoor@example.com" }, to: [ME.email], cc: [], subject: "Offer — Frontend Engineer, Northwind", body: "Hi Alex Morgan,\n\nWe're delighted to extend you an offer for the Frontend Engineer role. Please find the offer letter attached. We'd appreciate your decision by Friday.\n\nWarm regards,\nDivya", date: daysFromNow(-1, 17, 40), read: false, starred: true, applicationId: "app_northwind_fe", contactId: "ct_nina" },
    { id: "em_3", folder: "inbox", from: { name: "Elias Weber", email: "elias@example.com" }, to: [ME.email], cc: [], subject: "Re: Senior Frontend Developer — next steps", body: "Hey,\n\nThanks for applying! I'd love to set up an intro call this week. Does Wednesday at 6 PM IST work for you?\n\nCheers,\nLukas", date: daysFromNow(-2, 13, 5), read: true, starred: false, applicationId: "app_ledgerline_fe", contactId: "ct_elias" },
    { id: "em_4", folder: "inbox", from: { name: "Jordan Reyes", email: "jordan.reyes@example.com" }, to: [ME.email], cc: [], subject: "Re: Referral request — Mobile Engineer", body: "Hey! Sure, happy to refer you. Send me the job ID and your latest resume and I'll submit it this week.\n\n— Jordan", date: daysFromNow(-1, 10, 22), read: true, starred: false, contactId: "ct_jordan" },
    { id: "em_5", folder: "inbox", from: { name: "Sofia Marin", email: "sofia@example.com" }, to: [ME.email], cc: [], subject: "Hearthly — HR conversation", body: "Hi Alex Morgan,\n\nGreat news — the team enjoyed the technical round. The next step is a 45-minute conversation about compensation and logistics. I've sent an invite.\n\nSofia", date: daysFromNow(-3, 15, 0), read: true, starred: false, applicationId: "app_hearthly_fs", contactId: "ct_sofia" },
    { id: "em_6", folder: "inbox", from: { name: "Freshpath Careers", email: "no-reply@freshpath.example.com" }, to: [ME.email], cc: [], subject: "We received your application", body: "Thanks for applying to Software Engineer — Frontend. Our team will review your application and get back to you.", date: daysFromNow(-4, 11, 30), read: true, starred: false, applicationId: "app_freshpath_fe" },
    { id: "em_7", folder: "sent", from: ME, to: ["jordan.reyes@example.com"], cc: [], subject: "Referral request — Mobile Engineer (HM-48877)", body: "Hi Jordan,\n\nHope you're doing well! I came across the Mobile Engineer — React Native role at Brightwave Retail (Job ID HM-48877) and think it's a great fit. Would you be open to referring me?\n\nThanks a lot,\nAlex Morgan", date: daysFromNow(-1, 9, 45), read: true, starred: false, contactId: "ct_jordan", templateId: "tpl_referral" },
    { id: "em_8", folder: "sent", from: ME, to: ["elias@example.com"], cc: [], subject: "Re: Senior Frontend Developer — next steps", body: "Hi Elias,\n\nWednesday at 6 PM IST works great. Looking forward to it!\n\nBest,\nAlex Morgan", date: daysFromNow(-2, 14, 10), read: true, starred: false, applicationId: "app_ledgerline_fe", contactId: "ct_elias" },
    { id: "em_9", folder: "sent", from: ME, to: ["leah.f@example.com"], cc: [], subject: "Following up — Software Engineer, Frontend", body: "Hi Leah,\n\nI wanted to follow up on my application for the Software Engineer — Frontend role. I'm very excited about the work Freshpath is doing on Freshdesk and would love to chat.\n\nBest,\nAlex Morgan", date: daysFromNow(-3, 10, 0), read: true, starred: false, applicationId: "app_freshpath_fe", contactId: "ct_leah", templateId: "tpl_followup" },
    { id: "em_10", folder: "drafts", from: ME, to: ["sofia@example.com"], cc: [], subject: "Thank you — Hearthly technical round", body: "Hi Sofia,\n\nThank you for coordinating the technical round. I really enjoyed the conversation with Marco and Lea about…", date: daysFromNow(-5, 19, 0), read: true, starred: false, applicationId: "app_hearthly_fs", contactId: "ct_sofia" },
  ]
}

export function seedEmailTemplates(): EmailTemplate[] {
  return [
    { id: "tpl_referral", name: "Referral Request", channel: "email", category: "referral", subject: "Referral request — {{role}} ({{jobId}})", body: "Hi {{name}},\n\nHope you're doing well! I came across the {{role}} role at {{company}} (Job ID {{jobId}}) and I think it's a strong fit for my background in React and Next.js.\n\nJob link: {{jobUrl}}\n\nWould you be open to referring me? I've attached my latest resume and I'm happy to share anything else that helps.\n\nThanks a lot,\n{{senderName}}", usageCount: 14, createdAt: daysFromNow(-90), updatedAt: daysFromNow(-10) },
    { id: "tpl_recruiter", name: "Recruiter Outreach", channel: "email", category: "outreach", subject: "Interest in {{role}} at {{company}}", body: "Hi {{name}},\n\nI'm a frontend engineer with 4+ years of experience building React and Next.js products, and I'm very interested in the {{role}} position at {{company}}.\n\nI'd love to learn more about the team and share how I can contribute. Would you have 15 minutes this week?\n\nBest,\n{{senderName}}", usageCount: 9, createdAt: daysFromNow(-80), updatedAt: daysFromNow(-20) },
    { id: "tpl_followup", name: "Application Follow-up", channel: "email", category: "follow_up", subject: "Following up — {{role}}", body: "Hi {{name}},\n\nI wanted to follow up on my application for the {{role}} role at {{company}}. I'm excited about the opportunity and would love to discuss how I can help the team.\n\nBest,\n{{senderName}}", usageCount: 11, createdAt: daysFromNow(-70), updatedAt: daysFromNow(-3) },
    { id: "tpl_thanks", name: "Interview Thank You", channel: "email", category: "interview", subject: "Thank you — {{role}} interview", body: "Hi {{name}},\n\nThank you for taking the time to speak with me about the {{role}} role at {{company}}. I enjoyed our conversation and I'm even more excited about the opportunity.\n\nPlease let me know if there's anything else I can provide.\n\nBest regards,\n{{senderName}}", usageCount: 6, createdAt: daysFromNow(-60), updatedAt: daysFromNow(-30) },
    { id: "tpl_li_connect", name: "Connection request: referral", channel: "linkedin", category: "referral", subject: "", body: "Hi {{name}}, I'm applying for the {{role}} role at {{company}} and would love to connect. I'd really appreciate a quick chat about the team, or a referral if you think I'd be a good fit. Thank you!", usageCount: 7, createdAt: daysFromNow(-40), updatedAt: daysFromNow(-5) },
    { id: "tpl_li_referral", name: "Referral request", channel: "linkedin", category: "referral", subject: "", body: "Hi {{name}}, thanks for connecting!\n\nI'm applying for the {{role}} role at {{company}} (Job ID: {{jobId}}) and it lines up closely with my experience.\n\n{{jobUrl}}\n\nWould you be open to referring me? I can send my resume and a short summary for the referral form, whatever makes it easiest for you.\n\nThanks so much,\n{{senderName}}", usageCount: 5, createdAt: daysFromNow(-40), updatedAt: daysFromNow(-12) },
    { id: "tpl_li_followup", name: "Referral follow-up", channel: "linkedin", category: "referral", subject: "", body: "Hi {{name}}, just following up on my message about the {{role}} role at {{company}}. No pressure at all if you're busy. If it helps, I can send a two-line summary for the referral form. Thanks again!", usageCount: 2, createdAt: daysFromNow(-30), updatedAt: daysFromNow(-30) },
    { id: "tpl_cold", name: "Cold Outreach", channel: "email", category: "outreach", subject: "Quick question about {{company}}", body: "Hi {{name}},\n\nI've been following {{company}}'s work and really admire what your team is building. I'm a frontend engineer exploring new opportunities and would value 10 minutes of your perspective on the engineering culture.\n\nThanks in advance,\n{{senderName}}", usageCount: 4, createdAt: daysFromNow(-50), updatedAt: daysFromNow(-50) },
  ]
}

export function seedSmtpConfig(): SmtpConfig {
  return {
    host: "smtp.example.com",
    port: 587,
    username: "demo@example.com",
    password: "demo-smtp-pass",
    encryption: "tls",
    senderName: "Alex Morgan",
    senderEmail: "demo@example.com",
    lastTestedAt: daysFromNow(-2, 10),
  }
}
