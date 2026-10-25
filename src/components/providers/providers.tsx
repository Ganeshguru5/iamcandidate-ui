"use client"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useApplyTheme } from "@/lib/store/theme"

import { ServiceWorkerRegistration } from "./service-worker"

export function Providers({ children }: { children: React.ReactNode }) {
  useApplyTheme()
  return (
    <TooltipProvider delay={300}>
      {children}
      <ServiceWorkerRegistration />
      <Toaster
        position="bottom-right"
        closeButton
        offset={{ bottom: "calc(24px + env(safe-area-inset-bottom))" }}
        mobileOffset={{ bottom: "calc(16px + env(safe-area-inset-bottom))" }}
      />
    </TooltipProvider>
  )
}
