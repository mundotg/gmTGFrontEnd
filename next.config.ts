import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // <--- ISTO É O QUE PERMITE O DOCKER IGUAL À VERCEL
  images: {
    unoptimized: false, // Mantém a otimização de imagem ligada
  },
  experimental: {
    // Esta app não tem `app/layout.tsx`: cada secção traz o seu root layout
    // com <html>/<body> — (landing), auth, home, task, clouds… Sem um layout
    // único, não há onde compor um `app/not-found.tsx`, e a documentação do
    // Next aponta precisamente este caso ("Your app has multiple root
    // layouts") como a razão de existir o `global-not-found`.
    globalNotFound: true,
  },
};

export default nextConfig;
