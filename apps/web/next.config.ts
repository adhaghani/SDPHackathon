import type { NextConfig } from "next"

const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: storageUrl
      ? [
          {
            protocol: storageUrl.protocol === "https:" ? "https" : "http",
            hostname: storageUrl.hostname,
            port: storageUrl.port,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // Local Supabase uses loopback. Hosted deployments keep the default block.
    dangerouslyAllowLocalIP:
      !!storageUrl &&
      ["127.0.0.1", "localhost", "[::1]"].includes(storageUrl.hostname),
    maximumRedirects: 0,
    minimumCacheTTL: 60,
  },
  experimental: {
    // Photo suggestions accept up to 4 MB of base64 plus form-data overhead.
    serverActions: { bodySizeLimit: "5mb" },
  },
}

export default nextConfig
