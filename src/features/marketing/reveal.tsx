"use client"

import { cn } from "cn"

import { useInView } from "./showcase"

/**
 * Fades and lifts its content in the first time it scrolls into view.
 * `delay` staggers siblings. Styles live in globals.css (.reveal) and are
 * skipped for reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  as?: "div" | "li" | "section" | "figure"
}) {
  const [ref, inView] = useInView<HTMLDivElement>(0.15)
  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-shown={inView}
      className={cn("reveal", className)}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  )
}
