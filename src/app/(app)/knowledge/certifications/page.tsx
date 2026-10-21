import type { Metadata } from "next"

import { CertificationsView } from "@/features/certifications/certifications-view"

export const metadata: Metadata = { title: "Certifications" }

export default function CertificationsPage() {
  return <CertificationsView />
}
