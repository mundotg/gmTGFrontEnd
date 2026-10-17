import type { Metadata } from "next";

import { getNexusBaseUrl } from "../services/nexusUrl";

const planUrl = `${getNexusBaseUrl()}/plano`;

export const metadata: Metadata = {
  title: "Plano do Produto e Engenharia de Software",
  description:
    "Documento de requisitos, especificações técnicas, arquitetura de microserviços e modelo de dados do subsistema Nexus Cognitiva na plataforma MustInfo.",
  alternates: {
    canonical: planUrl,
  },
  openGraph: {
    title: "Plano do Produto e Engenharia de Software | Nexus Cognitiva",
    description:
      "Especificação técnica completa, decisões arquiteturais e roadmap do Nexus Cognitiva.",
    url: planUrl,
    type: "website",
  },
};

export default function PlanoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
