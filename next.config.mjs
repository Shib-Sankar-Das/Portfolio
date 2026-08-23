/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Certificate uploads run through a Server Action; the default 1 MB body
    // cap would reject files well under our own 10 MB limit.
    serverActions: { bodySizeLimit: "12mb" },
  },
  images: {
    // Serve AVIF first, WebP as fallback, for any future next/image usage.
    // Next.js resizes/compresses with sharp automatically in production.
    formats: ["image/avif", "image/webp"],
    // Allow any local image path, including cache-busting queries like ?v=2.
    localPatterns: [{ pathname: "/**" }],
    // Certificate visuals uploaded through /portfolio_admin live on Cloudinary.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
