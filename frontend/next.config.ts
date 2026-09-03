import type { NextConfig } from "next";

// GitHub Pages serves this project site under the repo name.
// Apply the prefix only for GitHub Pages builds so local `next dev`
// and custom server deployments (Hetzner) keep working at the root ("/") instead of 404-ing.
const basePath =
  process.env.DEPLOY_TARGET === "gh-pages" ? "/staff-leave-tracker-frontend" : "";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: true,
  allowedDevOrigins: ['192.168.128.217'],
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    // Backend API kök adresi. Yerelde varsayılan localhost:8000; canlı (GitHub
    // Pages) derlemede gerçek backend URL'i CI ortam değişkeni olarak verilmeli,
    // yoksa lib/api.ts localhost'a düşer ve yayınlanan site API'ye ulaşamaz.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
