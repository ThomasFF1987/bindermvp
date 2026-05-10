import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'assets.tcgdex.net' },
      { hostname: 'images.pokemontcg.io' },
    ],
  },
};

export default nextConfig;
