/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.deepgram.com",
        port: "",
        pathname: "/examples/avatars/**",
      },
    ],
  },
};

export default nextConfig;
