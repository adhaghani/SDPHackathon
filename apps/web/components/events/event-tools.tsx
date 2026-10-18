"use client"

import { CalendarPlusIcon, Share2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"

export function EventTools({
  id,
  title,
  startsAt,
  endsAt,
  location,
}: {
  id: string
  title: string
  startsAt: string
  endsAt: string
  location: string
}) {
  function addToCalendar() {
    try {
      const escape = (value: string) =>
        value
          .replace(/\\/g, "\\\\")
          .replace(/\r?\n/g, "\\n")
          .replace(/,/g, "\\,")
          .replace(/;/g, "\\;")
      const stamp = (value: string) =>
        new Date(value)
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}/, "")
      const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//BorrowLah//Events//EN",
        "BEGIN:VEVENT",
        `UID:${id}@borrowlah`,
        `DTSTAMP:${stamp(new Date().toISOString())}`,
        `DTSTART:${stamp(startsAt)}`,
        `DTEND:${stamp(endsAt)}`,
        `SUMMARY:${escape(title)}`,
        `LOCATION:${escape(location)}`,
        `URL:${window.location.href}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ]
      // Fold long UTF-8 lines as required by the iCalendar format.
      const encoder = new TextEncoder()
      const content =
        lines
          .map((line) => {
            let folded = "",
              length = 0
            for (const character of line) {
              const bytes = encoder.encode(character).length
              if (length + bytes > 75) {
                folded += "\r\n "
                length = 1
              }
              folded += character
              length += bytes
            }
            return folded
          })
          .join("\r\n") + "\r\n"
      const url = URL.createObjectURL(
        new Blob([content], { type: "text/calendar;charset=utf-8" })
      )
      const link = document.createElement("a")
      link.href = url
      link.download = "borrowlah-event.ics"
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.info("Calendar file ready.", {
        id: `event-calendar-${id}`,
        description: "Open the file to add this event to your calendar.",
        duration: 6000,
      })
    } catch {
      toast.error("Couldn’t prepare the calendar file.", {
        id: `event-calendar-${id}`,
        description:
          "Try again, or add the event details to your calendar manually.",
        duration: 8000,
      })
    }
  }
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({ title, url: window.location.href })
      else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Event link copied.", { id: `event-share-${id}` })
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        toast.error("Unable to share this event.", {
          id: `event-share-${id}`,
          description: "Copy the event link from your address bar instead.",
          duration: 8000,
        })
    }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={addToCalendar}>
          <CalendarPlusIcon aria-hidden="true" />
          Add to calendar
        </Button>
        <Button variant="ghost" onClick={() => void share()}>
          <Share2Icon aria-hidden="true" />
          Share event
        </Button>
      </div>
    </div>
  )
}
