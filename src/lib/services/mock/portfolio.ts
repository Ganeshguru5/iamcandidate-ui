import type { PortfolioContent } from "@/lib/types"
import { networkDelay } from "@/lib/utils/delay"

import type { PortfolioService } from "../contracts"
import { read, write } from "./db"

export class MockPortfolioService implements PortfolioService {
  async get(): Promise<PortfolioContent | null> {
    await networkDelay()
    // Demo data saved before the portfolio existed has no entry.
    return read("portfolio") ?? null
  }

  async save(content: PortfolioContent): Promise<PortfolioContent> {
    await networkDelay()
    const saved = { ...content, updatedAt: new Date().toISOString() }
    write("portfolio", saved)
    return saved
  }

  /** Demo mode has no S3: the image is kept inline as a data URL. */
  async uploadImage(file: File, onProgress?: (percent: number) => void): Promise<string> {
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("Couldn't read the image"))
      reader.readAsDataURL(file)
    })
    onProgress?.(100)
    return url
  }
}
