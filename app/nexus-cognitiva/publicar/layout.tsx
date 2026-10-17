import type { Metadata } from "next";

import { getNexusBaseUrl } from "../services/nexusUrl";

export const metadata: Metadata = {
  title: "Publicar Artigo Científico ou Técnico",
  description:
    "Submeta um artigo, ensaio metodológico, curiosidade fundamentada ou estudo técnico no Nexus Cognitiva.",
  alternates: {
    canonical: `${getNexusBaseUrl()}/publicar`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function PublicarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
