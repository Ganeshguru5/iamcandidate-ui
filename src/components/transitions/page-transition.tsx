import { ViewTransition } from "react"

/**
 * Animates page content on navigation. Used from `template.tsx`, which
 * re-mounts on every navigation, so enter/exit fire (a layout would persist).
 *
 * Sidebar links tag navigations with `nav-down` / `nav-up` (moving down or up
 * the list); everything else (other links, browser back) gets a soft fade.
 */
const MOTION = { "nav-down": "nav-down", "nav-up": "nav-up", default: "page-fade" }

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={MOTION} exit={MOTION} default="none">
      {children}
    </ViewTransition>
  )
}

/** Sidebar position decides direction: further down the list moves "down". */
export function navDirection(fromIndex: number, toIndex: number): string[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return []
  return [toIndex > fromIndex ? "nav-down" : "nav-up"]
}
