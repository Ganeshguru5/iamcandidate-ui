import { notFound } from "next/navigation"

// Pricing is hidden from the public site for now; admins still edit plans at /admin/pricing.
// To bring the page back, render <PricingPage /> from "@/features/pricing/pricing-page" here.
export default function Pricing() {
  notFound()
}
