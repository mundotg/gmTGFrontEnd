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
  async rewrites() {
    const rawNexusUrl = process.env.NEXT_PUBLIC_NEXUS_URL || "";
    let nexusHost = process.env.NEXT_PUBLIC_NEXUS_HOST || "";
    if (!nexusHost && rawNexusUrl) {
      try {
        const u = new URL(rawNexusUrl);
        // Se for um domínio dedicado na raiz (sem /nexus-cognitiva no path)
        if (u.pathname === "" || u.pathname === "/") {
          nexusHost = u.hostname;
        }
      } catch {}
    }

    if (nexusHost) {
      return {
        beforeFiles: [
          {
            source: "/",
            has: [{ type: "host", value: nexusHost }],
            destination: "/nexus-cognitiva",
          },
          {
            source: "/artigo/:path*",
            has: [{ type: "host", value: nexusHost }],
            destination: "/nexus-cognitiva/artigo/:path*",
          },
          {
            source: "/publicar",
            has: [{ type: "host", value: nexusHost }],
            destination: "/nexus-cognitiva/publicar",
          },
          {
            source: "/plano",
            has: [{ type: "host", value: nexusHost }],
            destination: "/nexus-cognitiva/plano",
          },
        ],
      };
    }
    return [];
  },
};

export default nextConfig;
