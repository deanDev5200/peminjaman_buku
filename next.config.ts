import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["skanbara.my.id"],
  output: 'standalone',
};

export default nextConfig;
