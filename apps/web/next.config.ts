import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    // Photo suggestions accept up to 4 MB of base64 plus form-data overhead.
    serverActions: { bodySizeLimit: "5mb" },
  },
}

export default nextConfig
