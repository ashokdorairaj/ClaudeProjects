import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ['fluent-ffmpeg', '@ffmpeg-installer/ffmpeg', '@ffprobe-installer/ffprobe'],
  turbopack: {
    // Point to the monorepo root so Turbopack can resolve hoisted packages
    // (npm workspaces installs next/react/etc. in hoop-insights/node_modules/)
    root: path.resolve(__dirname, '..'),
  },
};

export default nextConfig;
