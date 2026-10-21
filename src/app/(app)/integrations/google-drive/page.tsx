import type { Metadata } from "next"

import { DriveBrowser } from "@/features/integrations/drive-browser"

export const metadata: Metadata = { title: "Google Drive" }

export default function GoogleDrivePage() {
  return <DriveBrowser />
}
