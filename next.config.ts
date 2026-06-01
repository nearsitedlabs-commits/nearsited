import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.220.33", "*.local", "localhost"],

  experimental: {
    // Tree-shake icon imports so only used icons are bundled
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
