export function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export const SIDEBAR_COOKIE = "bb_sidebar"
