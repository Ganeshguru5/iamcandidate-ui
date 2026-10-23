import { apiClient, uploadToPresignedUrl } from "@/lib/api/client"
import type { PortfolioContent } from "@/lib/types"

import type { PortfolioService } from "../contracts"

/** Only fields the API accepts (it rejects unknown ones like `updatedAt`). */
function toInput({ profile, experience, projects, agentSkills, toolkit, testimonials }: PortfolioContent) {
  return { profile, experience, projects, agentSkills, toolkit, testimonials }
}

export class ApiPortfolioService implements PortfolioService {
  get(): Promise<PortfolioContent | null> {
    return apiClient.get("/portfolio")
  }

  save(content: PortfolioContent): Promise<PortfolioContent> {
    return apiClient.put("/admin/portfolio", toInput(content))
  }

  async uploadImage(file: File, onProgress?: (percent: number) => void): Promise<string> {
    const ticket = await apiClient.post<{ uploadUrl: string; headers: Record<string, string>; url: string }>(
      "/admin/portfolio/upload-url",
      { fileName: file.name, contentType: file.type, sizeBytes: file.size },
    )
    await uploadToPresignedUrl(ticket.uploadUrl, file, ticket.headers, onProgress)
    return ticket.url
  }
}
