import type { Metadata } from "next"
import Link from "next/link"

import { RequestAccessPanel } from "@/features/auth/request-access"

export const metadata: Metadata = {
  title: { absolute: "Request access · iamcandidate" },
  description: "iamcandidate is in development. Ask for an account and the admin will review it.",
}

export default function RequestAccessPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <p className="text-sm font-medium text-brand">Early access</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Request access to iamcandidate</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        iamcandidate is in development. Send a request, and once the admin grants it you can sign in with the email and
        password you choose here.
      </p>
      <div className="mt-8">
        <RequestAccessPanel />
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Already have access?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
