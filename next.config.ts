import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // <--- ISTO É O QUE PERMITE O DOCKER IGUAL À VERCEL
  images: {
    unoptimized: false, // Mantém a otimização de imagem ligada
  },
};

export default nextConfig;
