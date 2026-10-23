import { PageTransition } from "@/components/transitions/page-transition"

/** Re-mounts per navigation, so each page animates in and out. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
