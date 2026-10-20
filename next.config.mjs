/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["mysql2"],
  },
  async redirects() {
    return [
      { source: "/parts/:brand", destination: "/brands/:brand", permanent: true },
      { source: "/sitemap_index.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/details", destination: "/", permanent: true },
      { source: "/garage", destination: "/", permanent: true },
      { source: "/cart", destination: "/", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: 'https', hostname: 'media-public.canva.com'},
      { protocol: 'https', hostname: 'facebook.com'}
    ],
  },
};

export default nextConfig;
