import type { Metadata } from "next"

import { PortfolioAdmin } from "@/features/portfolio/portfolio-admin"

export const metadata: Metadata = { title: "Portfolio" }

export default function AdminPortfolioPage() {
  return <PortfolioAdmin />
}
