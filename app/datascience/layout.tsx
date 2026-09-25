import type { Metadata } from "next";
import "../globals.css";
import AuthProvider from "@/app/component/provader";

export const metadata: Metadata = {
  title: "MustaInf · Análise de Dados",
  description: "Estatística e ciência de dados sobre o resultado de uma consulta, em tempo real.",
};

export default function DataScienceLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="h-full">
      <body className="h-full antialiased bg-slate-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
