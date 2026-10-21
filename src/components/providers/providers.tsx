"use client"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useApplyTheme } from "@/lib/store/theme"

export function Providers({ children }: { children: React.ReactNode }) {
  useApplyTheme()
  return (
    <TooltipProvider delay={300}>
      {children}
      <Toaster position="bottom-right" closeButton />
    </TooltipProvider>
  )
}
