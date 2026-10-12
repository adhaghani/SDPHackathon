import type { ReactNode } from "react"

/** Meetup pin: coral dot with an ink ring and a surface halo, readable on any tile. */
export function MeetupPin({ active = false }: { active?: boolean }) {
  return (
    <span
      className={`block rounded-full border-[3px] border-[#1B1340] bg-[#FF6B4A] shadow-[0_0_0_3px_#fff] ${active ? "size-7" : "size-5"}`}
    />
  )
}

/** Popup body styled as a BorrowBetter card (Leaflet's own popup chrome is reset in globals.css). */
export function MapCard({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-48 max-w-64 rounded-lg border border-hairline bg-surface p-3 text-ink shadow-raised">
      {children}
    </div>
  )
}
