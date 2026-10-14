import type { RecyclingCampaign, RecyclingSummary } from "@/components/recycling/types"

export function parseRecyclingSummary(value: Record<string, unknown>): RecyclingSummary {
  const materialBreakdown = Array.isArray(value.material_breakdown)
    ? (value.material_breakdown as Array<Record<string, unknown>>)
    : []
  const recentLogs = Array.isArray(value.recent_logs)
    ? (value.recent_logs as Array<Record<string, unknown>>)
    : []

  return {
    lifetimeKg: Number(value.lifetime_kg ?? 0),
    monthKg: Number(value.month_kg ?? 0),
    co2eKg: value.co2e_kg == null ? null : Number(value.co2e_kg),
    energyKwh: value.energy_kwh == null ? null : Number(value.energy_kwh),
    co2eAvailable: Boolean(value.co2e_available),
    energyAvailable: Boolean(value.energy_available),
    materialBreakdown: materialBreakdown.map((row) => ({
      slug: String(row.slug ?? ""),
      name: String(row.name ?? ""),
      pluralName: String(row.plural_name ?? ""),
      kg: Number(row.kg ?? 0),
    })),
    recentLogs: recentLogs.map((row) => ({
      id: String(row.id ?? ""),
      occurredOn: String(row.occurred_on ?? ""),
      method: row.method === "custom_kg" ? "custom_kg" : "count",
      totalKg: Number(row.total_kg ?? 0),
      photoPaths: Array.isArray(row.photo_paths)
        ? (row.photo_paths as unknown[]).map(String).filter(Boolean)
        : [],
    })),
  }
}

export function parseRecyclingCampaign(value: Record<string, unknown>): RecyclingCampaign {
  if (!value.has_campaign) return { hasCampaign: false }
  return {
    hasCampaign: true,
    campaignId: value.campaign_id ? String(value.campaign_id) : undefined,
    title: value.title ? String(value.title) : undefined,
    startsOn: value.starts_on ? String(value.starts_on) : undefined,
    endsOn: value.ends_on ? String(value.ends_on) : undefined,
    targetKg: Number(value.target_kg ?? 0),
    currentKg: Number(value.current_kg ?? 0),
    percent: Number(value.percent ?? 0),
    status:
      value.status === "completed" || value.status === "ended" || value.status === "cancelled"
        ? value.status
        : "active",
    completed: Boolean(value.completed),
    daysRemaining: Number(value.days_remaining ?? 0),
    rewardBp: value.reward_bp == null ? null : Number(value.reward_bp),
    isContributor: Boolean(value.is_contributor),
  }
}
