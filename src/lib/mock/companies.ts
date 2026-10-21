import type { Company } from "@/lib/types"
import { daysFromNow } from "@/lib/utils/dates"

type Seed = Omit<Company, "createdAt" | "notes"> & { notes?: string; age: number }

export function seedCompanies(): Company[] {
  const seeds: Seed[] = [
    { id: "cmp_hm", name: "H&M", industry: "Retail & E-commerce", website: "https://hm.com", location: "Bengaluru, India", size: "10,000+", status: "active", age: 40, description: "Global fashion retailer with a large digital engineering hub in Bengaluru building the e-commerce platform.", notes: "Frontend platform team uses Next.js and an in-house design system. Anivar works on the checkout team." },
    { id: "cmp_tether", name: "Tether", industry: "Fintech / Crypto", website: "https://tether.io", location: "Remote", size: "200–500", status: "active", age: 35, description: "Issuer of USDT and builder of wallet and payments infrastructure. Fully remote engineering org." },
    { id: "cmp_nomni", name: "Nomni", industry: "Hospitality SaaS", website: "https://nomni.com", location: "Remote · EU", size: "50–200", status: "active", age: 30, description: "Ordering and loyalty platform for restaurants. Small, product-minded frontend team." },
    { id: "cmp_apeiron", name: "Apeiron", industry: "Enterprise Software", website: "https://apeiron.example.com", location: "Chennai, India", size: "50–200", status: "active", age: 28, description: "Builds operations tooling (fleet, HR, inventory) for mid-size enterprises." },
    { id: "cmp_zoho", name: "Zoho", industry: "SaaS", website: "https://zoho.com", location: "Chennai, India", size: "10,000+", status: "target", age: 25, description: "Suite of 50+ business applications built in-house. Strong product engineering culture." },
    { id: "cmp_freshworks", name: "Freshworks", industry: "SaaS", website: "https://freshworks.com", location: "Chennai, India", size: "5,000+", status: "active", age: 22, description: "Customer and employee experience software (Freshdesk, Freshservice)." },
    { id: "cmp_razorpay", name: "Razorpay", industry: "Fintech", website: "https://razorpay.com", location: "Bengaluru, India", size: "1,000–5,000", status: "researching", age: 15, description: "Payments and banking platform for Indian businesses." },
    { id: "cmp_atlassian", name: "Atlassian", industry: "Developer Tools", website: "https://atlassian.com", location: "Bengaluru, India", size: "10,000+", status: "closed", age: 60, description: "Makers of Jira, Confluence and Trello." },
    { id: "cmp_postman", name: "Postman", industry: "Developer Tools", website: "https://postman.com", location: "Bengaluru, India", size: "500–1,000", status: "target", age: 12, description: "API platform used by more than 30M developers." },
    { id: "cmp_swiggy", name: "Swiggy", industry: "Consumer Tech", website: "https://swiggy.com", location: "Bengaluru, India", size: "5,000+", status: "paused", age: 50, description: "Food and grocery delivery platform." },
  ]
  return seeds.map(({ age, ...seed }) => ({ notes: "", ...seed, createdAt: daysFromNow(-age) }))
}
