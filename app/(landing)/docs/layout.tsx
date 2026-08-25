import type { Metadata } from "next";

// A página de docs é um Client Component (usa i18n e estado de navegação),
// por isso não pode exportar `metadata`. Este layout aninhado trata do SEO.
export const metadata: Metadata = {
  title: "Documentação · MustaInf",
  description:
    "Documentação do MustaInf: gestão de conexões, Query Builder no-code, OCR Vision AI, streaming de dados por SSE e referência técnica do motor de base de dados.",
};

export default function DocsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
