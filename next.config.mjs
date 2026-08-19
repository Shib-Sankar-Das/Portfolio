/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Serve AVIF first, WebP as fallback, for any future next/image usage.
    // Next.js resizes/compresses with sharp automatically in production.
    formats: ["image/avif", "image/webp"],
    // Allow any local image path, including cache-busting queries like ?v=2.
    localPatterns: [{ pathname: "/**" }],
  },
};

export default nextConfig;
