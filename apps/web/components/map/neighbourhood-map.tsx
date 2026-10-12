"use client"

import "leaflet/dist/leaflet.css"
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"
import L from "leaflet"

const demoIcon = (color: string) =>
  L.divIcon({
    className: "inline-flex size-4 items-center justify-center rounded-full border-2 border-white shadow",
    html: `<span style="display:block;width:12px;height:12px;border-radius:9999px;background:${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })

const locations = [
  { name: "Anggun neighbourhood", position: [3.0738, 101.5183] as [number, number], color: "#C9B8FF" },
  { name: "Bestari neighbourhood", position: [3.0868, 101.5213] as [number, number], color: "#FF6B4A" },
  { name: "Cahaya neighbourhood", position: [3.0998, 101.5183] as [number, number], color: "#C9B8FF" },
  { name: "Damai neighbourhood", position: [3.1128, 101.5213] as [number, number], color: "#7BE0B0" },
]

export function NeighbourhoodMap() {
  return (
    <MapContainer
      center={[3.0938, 101.5183]}
      zoom={15}
      scrollWheelZoom={false}
      className="bb-card h-[420px] w-full overflow-hidden"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location) => (
        <Marker key={location.name} position={location.position} icon={demoIcon(location.color)}>
          <Popup>
            <strong>{location.name}</strong>
            <br />
            Neighbourhood-level demo location only.
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
