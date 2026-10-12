export const TRUST_TIERS = {
  building: { label: "Building", min: 0 },
  trusted: { label: "Trusted", min: 40 },
  highly_trusted: { label: "Highly trusted", min: 75 },
} as const

export type TrustTier = keyof typeof TRUST_TIERS

export function trustTier(score: number): TrustTier {
  if (score >= 75) return "highly_trusted"
  if (score >= 40) return "trusted"
  return "building"
}

export function trustTierLabel(tier: string | null | undefined): string {
  if (tier && tier in TRUST_TIERS) return TRUST_TIERS[tier as TrustTier].label
  return "Building"
}

export type TrustScorePayload = {
  score?: number
  tier?: string
  reasons?: Array<{ label?: string; delta?: number }>
  pending_dispute?: boolean
}

export function parseTrustScore(value: unknown): TrustScorePayload | null {
  if (!value || typeof value !== "object") return null
  return value as TrustScorePayload
}
