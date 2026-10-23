import type { Metadata } from "next"

import { PricingPage } from "@/features/pricing/pricing-page"

export const metadata: Metadata = {
  title: "Pricing",
  description: "knot plans and prices. Start free and upgrade when your job search picks up.",
}

export default function Pricing() {
  return <PricingPage />
}
