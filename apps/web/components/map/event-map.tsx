"use client"

import Link from "next/link"
import { MapPinIcon } from "lucide-react"

import { pointFor } from "@/components/map/geo"
import { MapCard, MeetupPin } from "@/components/map/map-parts"
import {
  Map,
  MapCircle,
  MapControlContainer,
  MapFullscreenControl,
  MapMarker,
  MapPopup,
  MapTileLayer,
  MapZoomControl,
} from "@workspace/ui/components/map"
import { cn } from "@workspace/ui/lib/utils"

export type EventMapMarker = {
  id: string
  title: string
  location: string
  neighbourhood?: string | null
  facility?: string | null
}

export function EventMap({
  markers = [],
  neighbourhood,
  className,
}: {
  markers?: EventMapMarker[]
  neighbourhood?: string | null
  className?: string
}) {
  const single = markers.length <= 1
  const primary = markers[0]
  const areaCenter = pointFor(neighbourhood ?? primary?.neighbourhood, undefined, "area")
  const fallback: EventMapMarker = { id: "meetup", title: "Meetup point", location: "Shared township space", neighbourhood }
  const points = markers.length ? markers : [fallback]
  const first = points[0] ?? fallback
  const center = single ? pointFor(first.neighbourhood, first.facility, first.title || first.location) : areaCenter

  return (
    <div className={cn("relative isolate overflow-hidden rounded-lg border border-hairline bg-lilac-tint", className)}>
      <Map center={center} zoom={single ? 16 : 14} scrollWheelZoom={false} className="h-72 min-h-0 rounded-none sm:h-[22rem]">
        <MapTileLayer />
        <MapZoomControl position="top-3 left-3" />
        <MapFullscreenControl position="top-3 right-3" />
        <MapCircle
          center={areaCenter}
          radius={single ? 260 : 650}
            className="fill-lilac stroke-lilac stroke-2"
        />
        {points.map((marker) => {
          const position = pointFor(marker.neighbourhood, marker.facility, marker.title || marker.location)
          return (
            <MapMarker
              key={marker.id}
              position={position}
              icon={<MeetupPin active={single} />}
              iconSize={single ? [28, 28] : [20, 20]}
              iconAnchor={single ? [14, 14] : [10, 10]}
              popupAnchor={[0, -12]}
            >
              <MapPopup>
                <MapCard>
                  <p className="font-bold">{marker.title}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">{marker.location}</p>
                  {marker.neighbourhood ? <p className="mt-0.5 text-xs text-ink-muted">{marker.neighbourhood}</p> : null}
                  {!single ? (
                    <Link href={`/events/${marker.id}`} className="mt-2 inline-block text-sm font-bold underline underline-offset-4">
                      View event
                    </Link>
                  ) : null}
                </MapCard>
              </MapPopup>
            </MapMarker>
          )
        })}
        <MapControlContainer className="bottom-3 left-3 max-w-[calc(100%-1.5rem)]">
          {single ? (
            <p className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm font-bold text-ink shadow-raised">
              <MapPinIcon aria-hidden="true" className="size-4 shrink-0 text-ink" />
              <span className="truncate">{first.location}</span>
            </p>
          ) : (
            <div className="rounded-lg bg-surface px-3 py-2 text-ink shadow-raised">
              <p className="text-sm font-bold tabular-nums">
                {points.length} meetup {points.length === 1 ? "point" : "points"}
              </p>
              <p className="text-xs text-ink-muted">Tap a pin for details</p>
            </div>
          )}
        </MapControlContainer>
      </Map>
    </div>
  )
}
