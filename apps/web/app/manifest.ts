import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BorrowBetter",
    short_name: "BorrowBetter",
    description: "Share more. Connect more. Live better.",
    start_url: "/home",
    display: "standalone",
    background_color: "#F4F7F5",
    theme_color: "#0F3B45",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  }
}
