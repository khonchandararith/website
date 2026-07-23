import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network IP addresses in development mode
  allowedDevOrigins: [
    "localhost:3000",
    "172.24.240.1",
    "172.16.0.80",
    "192.168.1.1",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
