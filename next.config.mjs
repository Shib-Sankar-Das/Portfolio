/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Serve AVIF first, WebP as fallback, for any future next/image usage.
    // Next.js resizes/compresses with sharp automatically in production.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
