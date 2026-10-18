/** Only send known public storage objects through the server image optimizer. */
export function canOptimizeImage(src: string) {
  if (src.startsWith("/") && !src.startsWith("//"))
    return !/\.svg(?:[?#]|$)/i.test(src)
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!storageUrl) return false
  try {
    const url = new URL(src)
    return (
      url.origin === new URL(storageUrl).origin &&
      url.pathname.startsWith("/storage/v1/object/public/") &&
      !/\.svg$/i.test(url.pathname)
    )
  } catch {
    return false
  }
}
