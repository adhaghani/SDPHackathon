export type RecyclingUnit = {
  id: string
  slug: string
  name: string
  unitLabel: string
  kgPerUnit: number
}

export type RecyclingMaterial = {
  id: string
  slug: string
  name: string
  pluralName: string
  units: RecyclingUnit[]
}

export type RecyclingSummary = {
  lifetimeKg: number
  monthKg: number
  co2eKg: number | null
  energyKwh: number | null
  co2eAvailable: boolean
  energyAvailable: boolean
  materialBreakdown: Array<{ slug: string; name: string; pluralName: string; kg: number }>
  recentLogs: Array<{
    id: string
    occurredOn: string
    method: "count" | "custom_kg"
    totalKg: number
    photoPaths: string[]
  }>
}

export type RecyclingCampaign = {
  hasCampaign: boolean
  campaignId?: string
  title?: string
  startsOn?: string
  endsOn?: string
  targetKg?: number
  currentKg?: number
  percent?: number
  status?: "active" | "completed" | "ended" | "cancelled"
  completed?: boolean
  daysRemaining?: number
  rewardBp?: number | null
  isContributor?: boolean
}
