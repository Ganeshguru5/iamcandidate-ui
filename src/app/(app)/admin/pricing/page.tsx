import type { Metadata } from "next"

import { PricingAdmin } from "@/features/pricing/pricing-admin"

export const metadata: Metadata = { title: "Pricing" }

export default function AdminPricingPage() {
  return <PricingAdmin />
}
