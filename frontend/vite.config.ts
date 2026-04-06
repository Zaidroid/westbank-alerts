import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

const port = Number(process.env.PORT || "3000");
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      includeAssets: [
        "favicon.svg",
        "icon-180.png",
        "icon-192.png",
        "icon-512.png",
        "icon-maskable-192.png",
        "icon-maskable-512.png",
      ],
      manifest: false, // we provide our own /public/manifest.json
      workbox: {
        // Cache app shell
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // Don't cache API responses — they must always be fresh
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [
          /^\/alerts/,
          /^\/checkpoints/,
          /^\/stats/,
          /^\/health/,
          /^\/stream/,
          /^\/ws/,
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Leaflet tile layer caching (OpenStreetMap tiles)
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles-cache",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // disable SW in dev to avoid interfering with hot-reload
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom", "leaflet", "react-leaflet"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: false,
    },
    proxy: {
      '/alerts': {
        target: 'http://192.168.0.118:8080',
        changeOrigin: true,
      },
      '/checkpoints/ws': {
        target: 'http://192.168.0.118:8080',
        ws: true,
        changeOrigin: true,
      },
      '/checkpoints': {
        target: 'http://192.168.0.118:8080',
        changeOrigin: true,
      },
      '/stats': {
        target: 'http://192.168.0.118:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://192.168.0.118:8080',
        changeOrigin: true,
      },
      '/stream': {
        target: 'http://192.168.0.118:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://192.168.0.118:8080',
        ws: true,
        changeOrigin: true,
      },
      '/market': {
        target: 'http://192.168.0.118:8080',
        changeOrigin: true,
      },
      '/internet-status': {
        target: 'http://192.168.0.118:8080',
        changeOrigin: true,
      },
      '/weather': {
        target: 'http://192.168.0.118:8080',
        changeOrigin: true,
      },
      '/zones': {
        target: 'http://192.168.0.118:8080',
        changeOrigin: true,
      },
      '/prayer-times': {
        target: 'http://192.168.0.118:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
