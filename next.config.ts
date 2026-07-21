import type { NextConfig } from "next";

// Two build modes from one file:
//  - `next build`                      -> normal build, deployed on a
//    real Node server for browser use. headers() and the default
//    Image Optimization loader both work fine here.
//  - `CAPACITOR_BUILD=true next build` -> static export bundled into
//    the Capacitor app. No Node server ever runs it, so anything that
//    depends on one has to be switched off for this pass.
const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

const nextConfig: NextConfig = {
  ...(isCapacitorBuild && { output: "export" as const }),

  // headers() requires a server to apply on each request — Next
  // errors at build time if this coexists with output: "export".
  ...(!isCapacitorBuild && {
    async headers() {
      return [
        {
          source: "/",
          headers: [
            { key: "Cache-Control", value: "no-cache, must-revalidate" },
          ],
        },
      ];
    },
  }),

  images: {
    // Default loader needs a server to resize/serve images on demand.
    // Doesn't exist inside Capacitor's webview, so images would just
    // fail to load there. unoptimized serves the original file as-is
    // instead — only needed for the Capacitor pass; web build keeps
    // real optimization.
    unoptimized: isCapacitorBuild,
    qualities: [70, 75, 80],
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "tripzido-django.onrender.com",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "tripzido-django.onrender.com",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "tile.openstreetmap.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/staticmap/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
