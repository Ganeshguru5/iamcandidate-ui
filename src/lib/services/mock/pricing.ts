import { seedPricing } from "@/lib/mock/pricing"
import type { PricingConfig } from "@/lib/types"
import { networkDelay } from "@/lib/utils/delay"

import type { PricingService } from "../contracts"
import { read, write } from "./db"

/** Demo data saved before pricing existed has no `pricing` entry. */
function current(): PricingConfig {
  return read("pricing") ?? seedPricing()
}

export class MockPricingService implements PricingService {
  async getPublic(): Promise<PricingConfig> {
    await networkDelay()
    const config = current()
    return { ...config, plans: config.plans.filter((p) => p.visible) }
  }

  async getAdmin(): Promise<PricingConfig> {
    await networkDelay()
    return current()
  }

  async save(config: PricingConfig): Promise<PricingConfig> {
    await networkDelay()
    const saved = { ...config, updatedAt: new Date().toISOString() }
    write("pricing", saved)
    return saved
  }

  async reset(): Promise<PricingConfig> {
    return this.save(seedPricing())
  }
}
