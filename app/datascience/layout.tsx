import type { Metadata } from "next";
import "../globals.css";
import AuthProvider from "@/app/component/provader";

export const metadata: Metadata = {
  icons: {
    icon: "/img/logo_mustainfo.png",
    shortcut: "/img/logo_mustainfo.png",
    apple: "/img/logo_mustainfo.png",
  },

  title: "MustaInfo · Análise de Dados",
  description: "Estatística e ciência de dados sobre o resultado de uma consulta, em tempo real.",
};

export default function DataScienceLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" data-scroll-behavior="smooth" className="h-full">
      <body className="h-full antialiased bg-slate-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
