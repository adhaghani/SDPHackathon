import { afterEach, describe, expect, it, vi } from "vitest"
import { canOptimizeImage } from "@/lib/image-source"

afterEach(() => vi.unstubAllEnvs())

describe("public image optimizer boundary", () => {
  it("allows public objects only from the configured storage origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://storage.test")
    expect(
      canOptimizeImage(
        "https://storage.test/storage/v1/object/public/item-photos/photo.webp"
      )
    ).toBe(true)
    expect(
      canOptimizeImage(
        "https://other.test/storage/v1/object/public/item-photos/photo.webp"
      )
    ).toBe(false)
    expect(
      canOptimizeImage(
        "https://storage.test/storage/v1/object/sign/private/photo.webp?token=x"
      )
    ).toBe(false)
    expect(canOptimizeImage("https://storage.test/auth/v1/user")).toBe(false)
  })
  it("keeps SVGs, blobs and previews on direct delivery", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://storage.test")
    for (const src of [
      "/demo/item.svg",
      "blob:test",
      "data:image/png;base64,a",
      "https://storage.test/storage/v1/object/public/a.svg",
    ]) {
      expect(canOptimizeImage(src)).toBe(false)
    }
    expect(canOptimizeImage("/photo.webp")).toBe(true)
  })
})
