import type { Referral } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

export function seedReferrals(): Referral[] {
  return [
    { id: "ref_1", contactId: "ct_anivar", companyId: "cmp_hm", role: "Frontend Engineer", jobId: "HM-48213", jobUrl: "https://career.hm.com/jobs/48213", requestDate: daysFromNow(-11), followUpDate: daysFromNow(-9), status: "submitted", notes: "Referral submitted through the internal portal.", createdAt: daysFromNow(-11) },
    { id: "ref_2", contactId: "ct_anivar", companyId: "cmp_hm", role: "Mobile Engineer — React Native", jobId: "HM-48877", jobUrl: "https://career.hm.com/jobs/48877", requestDate: daysFromNow(-1), followUpDate: daysFromNow(3), status: "request_sent", notes: "", createdAt: daysFromNow(-1) },
    { id: "ref_3", contactId: "ct_arjun", companyId: "cmp_freshworks", role: "Software Engineer — Frontend", jobId: "FW-20931", jobUrl: "https://freshworks.com/company/careers/20931", requestDate: daysFromNow(-6), followUpDate: daysFromNow(-1), status: "accepted", notes: "Arjun asked for the updated resume.", createdAt: daysFromNow(-6) },
    { id: "ref_4", contactId: "ct_rahul", companyId: "cmp_razorpay", role: "Frontend Engineer II", jobId: "RZP-881", jobUrl: "https://razorpay.com/jobs/881", requestDate: daysFromNow(-9), followUpDate: daysFromNow(-2), status: "no_response", notes: "", createdAt: daysFromNow(-9) },
    { id: "ref_5", contactId: "ct_meera", companyId: "cmp_zoho", role: "React Native Developer", jobId: "ZH-5521", jobUrl: "https://careers.zohocorp.com/5521", status: "not_contacted", notes: "Ask after she is back from leave.", createdAt: daysFromNow(-2) },
    { id: "ref_6", contactId: "ct_emma", companyId: "cmp_postman", role: "Design Systems Engineer", jobId: "PM-4502", jobUrl: "https://postman.com/careers/4502", requestDate: daysFromNow(-20), status: "declined", notes: "Not on the hiring side — suggested reaching the EM directly.", createdAt: daysFromNow(-20) },
  ]
}
