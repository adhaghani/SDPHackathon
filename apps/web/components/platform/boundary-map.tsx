"use client"

import { useCallback, useEffect } from "react"
import { useMap } from "react-leaflet"
import type { FeatureGroup } from "leaflet"
import type { Polygon } from "geojson"
import {
  Map,
  MapTileLayer,
  MapZoomControl,
  MapSearchControl,
  MapDrawControl,
  MapDrawPolygon,
  MapDrawEdit,
  MapDrawDelete,
  MapDrawUndo,
  MapPolygon,
  MapTooltip,
} from "@workspace/ui/components/map"
import type { Boundary } from "@/lib/validation/township"

export type MapTownship = {
  id: string
  name: string
  boundary: Boundary | null
  lifecycle: string
}

function Search() {
  const map = useMap()
  return (
    <MapSearchControl
      position="top-3 left-3"
      className="max-w-[calc(100%-5rem)]"
      placeholder="Find a town or place…"
      onPlaceSelect={(feature) => {
        const [lng, lat] = feature.geometry.coordinates
        if (lat !== undefined && lng !== undefined) map.flyTo([lat, lng], 14)
      }}
    />
  )
}

function FitMap({
  boundary,
  townships,
}: {
  boundary?: Boundary | null
  townships: MapTownship[]
}) {
  const map = useMap()
  const coordinates =
    boundary?.coordinates[0] ??
    townships
      .filter((t) => t.lifecycle !== "archived")
      .flatMap((t) => t.boundary?.coordinates[0] ?? [])
  const bounds = JSON.stringify(coordinates.map((p) => [p[1], p[0]]))
  useEffect(() => {
    let frame = 0
    const refresh = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        map.invalidateSize({ animate: false })
        const points = JSON.parse(bounds) as [number, number][]
        if (points.length)
          map.fitBounds(points, {
            padding: [48, 48],
            maxZoom: 16,
            animate: false,
          })
      })
    }
    const observer = new ResizeObserver(refresh)
    observer.observe(map.getContainer())
    refresh()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [map, bounds])
  return null
}

export function BoundaryMap({
  initialBoundary,
  onChange,
  townships = [],
  currentId,
}: {
  initialBoundary?: Boundary | null
  onChange?: (boundary: Boundary | null) => void
  townships?: MapTownship[]
  currentId?: string
}) {
  const changed = useCallback(
    (group: FeatureGroup) => {
      const layers = group.getLayers()
      // A township has one outer boundary. Drawing again replaces the old one.
      layers.slice(0, -1).forEach((layer) => group.removeLayer(layer))
      const collection = group.toGeoJSON() as {
        features: { geometry: Polygon }[]
      }
      onChange?.(
        (collection.features[0]?.geometry as Boundary | undefined) ?? null
      )
    },
    [onChange]
  )
  const center = initialBoundary?.coordinates[0]?.[0]
  return (
    <div
      role="region"
      aria-label="Interactive township boundary map"
      className="relative isolate h-[28rem] overflow-hidden rounded-xl border border-hairline bg-muted sm:h-[34rem]"
    >
      <Map
        center={center ? [center[1]!, center[0]!] : [3.139, 101.687]}
        zoom={center ? 13 : 6}
        scrollWheelZoom
        className="min-h-0 rounded-none"
      >
        <MapTileLayer />
        <FitMap boundary={initialBoundary} townships={townships} />
        <Search />
        <MapZoomControl position="top-3 right-3" />
        {townships
          .filter(
            (t) =>
              t.id !== currentId && t.boundary && t.lifecycle !== "archived"
          )
          .map((t) => (
            <MapPolygon
              key={t.id}
              positions={t.boundary!.coordinates[0]!.map(
                (p) => [p[1]!, p[0]!] as [number, number]
              )}
              pathOptions={{ color: "#57534e", fillOpacity: 0.12, weight: 2 }}
            >
              <MapTooltip>{t.name}</MapTooltip>
            </MapPolygon>
          ))}
        {onChange ? (
          <MapDrawControl
            initialBoundary={initialBoundary as Polygon | null}
            onLayersChange={changed}
            position="bottom-3 left-3"
          >
            <MapDrawPolygon
              allowIntersection={false}
              showArea
              shapeOptions={{
                color: "#111111",
                fillColor: "#D9F45A",
                fillOpacity: 0.35,
                weight: 2,
              }}
            />
            <MapDrawUndo />
            <MapDrawEdit />
            <MapDrawDelete />
          </MapDrawControl>
        ) : initialBoundary ? (
          <MapPolygon
            positions={initialBoundary.coordinates[0]!.map(
              (p) => [p[1]!, p[0]!] as [number, number]
            )}
            pathOptions={{
              color: "#111111",
              fillColor: "#D9F45A",
              fillOpacity: 0.35,
            }}
          />
        ) : null}
      </Map>
    </div>
  )
}
