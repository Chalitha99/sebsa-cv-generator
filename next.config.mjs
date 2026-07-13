/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16 uses Turbopack by default.
  // Turbopack doesn't need the canvas alias because it only bundles what's actually imported.
  // We add an empty turbopack config to silence the webpack/turbopack config mismatch warning.
  turbopack: {},

  // The webpack config below is kept for environments that explicitly opt-in to webpack
  // (e.g. `next build --webpack`). It resolves pdfjs-dist's optional canvas dependency.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    return config;
  },
};

export default nextConfig;
