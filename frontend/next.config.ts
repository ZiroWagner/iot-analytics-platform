import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://backend:3000/api/v1/:path*",
      },
      {
        source: "/socket.io/:path*",
        destination: "http://backend:3000/socket.io/:path*",
      },
    ];
  },
};

export default nextConfig;
