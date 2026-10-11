import { Award, CalendarDays, House, Package, Users } from "lucide-react"

export const residentNavigation = [
  { href: "/home", label: "Home", icon: House },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/borrow", label: "Borrow", icon: Package },
  { href: "/rewards", label: "Rewards", icon: Award },
  { href: "/community", label: "Community", icon: Users },
] as const
