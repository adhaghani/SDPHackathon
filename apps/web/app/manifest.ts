import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BorrowLah",
    short_name: "BorrowLah",
    description: "Share more. Connect more. Live better.",
    start_url: "/home",
    display: "standalone",
    background_color: "#f4f4ee",
    theme_color: "#d9f45a",
    icons: [
      {
        src: "/brand/borrowlah-icon-light.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  }
}
