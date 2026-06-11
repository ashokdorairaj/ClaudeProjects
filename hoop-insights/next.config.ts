import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack from bundling native/binary packages — they are required at runtime
  serverExternalPackages: ['fluent-ffmpeg', '@ffmpeg-installer/ffmpeg', '@ffprobe-installer/ffprobe'],
};

export default nextConfig;
