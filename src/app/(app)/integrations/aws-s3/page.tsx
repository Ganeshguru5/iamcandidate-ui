import type { Metadata } from "next"

import { AwsView } from "@/features/integrations/aws-view"

export const metadata: Metadata = { title: "AWS S3 backup" }

export default function AwsPage() {
  return <AwsView />
}
