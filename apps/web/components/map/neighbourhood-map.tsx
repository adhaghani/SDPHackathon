"use client"

import { ShieldCheckIcon } from "lucide-react"

import { neighbourhoodCenters, townshipCenter } from "@/components/map/geo"
import { MapCard } from "@/components/map/map-parts"
import {
  Map,
  MapCircle,
  MapControlContainer,
  MapFullscreenControl,
  MapPopup,
  MapTileLayer,
  MapTooltip,
  MapZoomControl,
} from "@workspace/ui/components/map"

export function NeighbourhoodMap() {
  const areas = Object.entries(neighbourhoodCenters)

  return (
    <div className="relative isolate overflow-hidden rounded-lg border border-hairline bg-lilac-tint">
      <Map center={townshipCenter} zoom={14} scrollWheelZoom={false} className="h-[28rem] min-h-0 rounded-none">
        <MapTileLayer />
        <MapZoomControl position="top-3 left-3" />
        <MapFullscreenControl position="top-3 right-3" />
        {areas.map(([name, center]) => (
          <MapCircle
            key={name}
            center={center}
            radius={480}
            className="fill-lilac stroke-ink stroke-[1.5]"
          >
            <MapTooltip permanent direction="center">
              <span className="px-1 text-xs font-bold">{name}</span>
            </MapTooltip>
            <MapPopup>
              <MapCard>
                <p className="font-bold">{name}</p>
                <p className="mt-0.5 text-sm text-ink-muted">Neighbourhood area, approximate. Use Insights for participation by neighbourhood.</p>
              </MapCard>
            </MapPopup>
          </MapCircle>
        ))}
        <MapControlContainer className="bottom-3 left-3 max-w-[calc(100%-1.5rem)]">
          <div className="flex items-start gap-2 rounded-lg bg-surface px-3 py-2 text-ink shadow-raised">
            <ShieldCheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-sm font-bold">{areas.length} neighbourhoods</p>
              <p className="text-xs text-ink-muted">Area-level only. No resident addresses.</p>
            </div>
          </div>
        </MapControlContainer>
      </Map>
    </div>
  )
}
