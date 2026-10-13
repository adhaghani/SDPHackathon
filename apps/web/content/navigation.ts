import {
  ActivityIcon,
  AwardIcon,
  BarChart3Icon,
  BookOpenIcon,
  CalendarDays,
  HandHelpingIcon,
  House,
  Leaf,
  MapIcon,
  Package,
  ScaleIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersRoundIcon,
  UserRoundIcon,
  WalletIcon,
  WarehouseIcon,
  GiftIcon,
  MessageCircleIcon,
} from "lucide-react"

export const residentNavigation = [
  { href: "/home", label: "Home", icon: House },
  { href: "/borrow", label: "Borrow", icon: Package },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/rewards", label: "Impact", icon: Leaf },
] as const

export const sidebarNavigation = [
  { href: "/home", label: "Home", icon: House },
  { href: "/borrow", label: "Borrow", icon: Package },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/community", label: "Community", icon: HandHelpingIcon },
  { href: "/guests", label: "Guest passes", icon: UserRoundIcon },
  { href: "/challenges", label: "Challenges", icon: StarIcon },
  { href: "/rewards", label: "Impact & rewards", icon: Leaf },
  { href: "/help", label: "Help", icon: MessageCircleIcon },
] as const

export const adminNavigation = [
  { href: "/admin", label: "Township Pulse", icon: ActivityIcon },
  { href: "/admin/insights", label: "Insights", icon: BarChart3Icon },
  { href: "/admin/map", label: "Map", icon: MapIcon, flag: "leaflet" },
  { href: "/admin/hubs", label: "Hubs", icon: WarehouseIcon, flag: "equipment_hubs" },
  { href: "/admin/members", label: "Members", icon: UsersRoundIcon },
  { href: "/admin/moderation", label: "Moderation", icon: ShieldCheckIcon },
  { href: "/admin/support", label: "Support", icon: MessageCircleIcon },
  { href: "/admin/disputes", label: "Disputes", icon: ScaleIcon },
  { href: "/admin/budget", label: "Budget", icon: WalletIcon },
  { href: "/admin/rewards", label: "Rewards economy", icon: GiftIcon },
  { href: "/admin/badges", label: "Awards", icon: AwardIcon },
  { href: "/admin/methodology", label: "Methodology", icon: BookOpenIcon },
  { href: "/admin/guests", label: "Guest access", icon: UserRoundIcon },
  { href: "/help", label: "Help", icon: MessageCircleIcon },
] as const

