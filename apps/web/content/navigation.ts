import { BarChart3, CalendarDays, House, Package } from "lucide-react"

export const residentNavigation = [
  { href: "/home", label: "Home", icon: House },
  { href: "/borrow", label: "Borrow", icon: Package },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/rewards", label: "Impact", icon: BarChart3 },
] as const
