import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import AuthProvider from "../component/provader";
import { NexusLayoutClient } from "./components/NexusLayoutClient";

const fontInterface = Inter({
  subsets: ["latin"],
  variable: "--font-interface",
  display: "swap",
});

const fontEditorial = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap",
});

const fontTechnical = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-technical",
  display: "swap",
});

import { getNexusBaseUrl, getMainPlatformUrl } from "./services/nexusUrl";

const nexusUrl = getNexusBaseUrl();
const mainSiteUrl = getMainPlatformUrl();

export const metadata: Metadata = {
  metadataBase: new URL(nexusUrl),
  title: {
    default: "Nexus Cognitiva — Plataforma de Conhecimento Colaborativo | MustInfo",
    template: "%s | Nexus Cognitiva — MustInfo",
  },
  description:
    "Descubra, estude, organize e partilhe conhecimento científico, artigos técnicos, curiosidades fundamentadas e investigações com rigor metodológico no ecossistema MustInfo.",
  keywords: [
    "Nexus Cognitiva",
    "MustInfo",
    "artigos científicos",
    "ciência e tecnologia",
    "neurociência",
    "inteligência artificial",
    "engenharia de software",
    "física teórica",
    "conhecimento colaborativo",
    "pesquisa científica",
    "leitura aberta",
    "publicações acadêmicas",
  ],
  authors: [{ name: "MustInfo", url: mainSiteUrl }],
  creator: "MustInfo",
  publisher: "MustInfo — Nexus Cognitiva",
  applicationName: "Nexus Cognitiva",
  category: "Ciência, Tecnologia e Conhecimento",
  alternates: {
    canonical: nexusUrl,
    languages: {
      "pt-PT": nexusUrl,
      "pt-BR": nexusUrl,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: nexusUrl,
    siteName: "Nexus Cognitiva — MustInfo",
    title: "Nexus Cognitiva — Plataforma de Conhecimento Colaborativo",
    description:
      "Plataforma aberta de conhecimento científico, tecnologia, inovação e rigor metodológico. Leia, aprenda, publique e debata com a comunidade.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&auto=format&fit=crop&q=80",
        width: 1200,
        height: 630,
        alt: "Nexus Cognitiva — Conhecimento Colaborativo MustInfo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus Cognitiva — Plataforma de Conhecimento Colaborativo",
    description:
      "Explore artigos científicos, teorias e discussões colaborativas fundamentadas no Nexus Cognitiva da MustInfo.",
    images: [
      "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&auto=format&fit=crop&q=80",
    ],
    creator: "@MustaInfoo",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function NexusRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLdWebsite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Nexus Cognitiva — MustInfo",
    alternateName: ["Nexus Cognitiva", "MustInfo Nexus"],
    url: nexusUrl,
    description:
      "Plataforma aberta de conhecimento científico, tecnologia, inovação e rigor metodológico.",
    inLanguage: "pt-PT",
    publisher: {
      "@type": "Organization",
      name: "MustInfo",
      url: mainSiteUrl,
      logo: `${mainSiteUrl}/favicon.ico`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${nexusUrl}?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="pt" data-scroll-behavior="smooth" className={`${fontInterface.variable} ${fontEditorial.variable} ${fontTechnical.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
      </head>
      <body className="antialiased bg-[#F4F7FA] text-[#14283F] dark:bg-[#0B132B] dark:text-[#F8FAFC] min-h-screen selection:bg-[#087E8B]/20 font-sans">
        <AuthProvider>
          <NexusLayoutClient>{children}</NexusLayoutClient>
        </AuthProvider>
      </body>
    </html>
  );
}
