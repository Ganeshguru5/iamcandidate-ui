import { PageTransition } from "@/components/transitions/page-transition"

/** Re-mounts when the page below this segment changes, so it animates in and out. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
