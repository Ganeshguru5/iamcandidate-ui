import { apiClient } from "@/lib/api/client"
import type { PricingConfig } from "@/lib/types"

import type { PricingService } from "../contracts"

/** Only fields the API accepts (it rejects unknown ones like `updatedAt`). */
function toInput({ currency, note, plans }: PricingConfig) {
  return { currency, note, plans }
}

export class ApiPricingService implements PricingService {
  getPublic(): Promise<PricingConfig> {
    return apiClient.get("/pricing")
  }

  getAdmin(): Promise<PricingConfig> {
    return apiClient.get("/admin/pricing")
  }

  save(config: PricingConfig): Promise<PricingConfig> {
    return apiClient.put("/admin/pricing", toInput(config))
  }

  reset(): Promise<PricingConfig> {
    return apiClient.post("/admin/pricing/reset")
  }
}
