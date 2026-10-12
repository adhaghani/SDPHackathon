export type MapPoint = [number, number]

/** Approximate neighbourhood centres for the demo township. Shared spaces only, never homes. */
export const neighbourhoodCenters: Record<string, MapPoint> = {
  Anggun: [3.0738, 101.5183],
  Bestari: [3.0868, 101.5213],
  Cahaya: [3.0998, 101.5183],
  Damai: [3.1128, 101.5213],
}

export const townshipCenter: MapPoint = [3.0938, 101.5183]

const facilityOffsets: Record<string, MapPoint> = {
  "Clubhouse hall": [0.0012, 0.0018],
  "Badminton courts": [0.0018, 0.003],
  "Community garden": [-0.0014, -0.0022],
  "Multipurpose field": [0.0022, -0.001],
}

function hashOffset(value: string): MapPoint {
  let hash = 0
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) % 1000
  return [((hash % 9) - 4) * 0.00018, (((hash * 7) % 9) - 4) * 0.00022]
}

export function pointFor(neighbourhood?: string | null, facility?: string | null, seed = ""): MapPoint {
  const base = neighbourhoodCenters[neighbourhood ?? ""] ?? townshipCenter
  const offset = facility ? facilityOffsets[facility] : hashOffset(seed || neighbourhood || "event")
  return [base[0] + (offset?.[0] ?? 0), base[1] + (offset?.[1] ?? 0)]
}
