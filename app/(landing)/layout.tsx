import type { Metadata } from "next";
import "../globals.css";
import AuthProvider from "../component/provader";

export const metadata: Metadata = {
  icons: {
    icon: "/img/logo_mustainfo.png",
    shortcut: "/img/logo_mustainfo.png",
    apple: "/img/logo_mustainfo.png",
  },
  title: "MustaInfo | Plataforma Unificada de Gestão de Dados & Conexões Cloud",
  description: "Gerencie PostgreSQL, MySQL, SQL Server, MongoDB e SQLite em um único workspace seguro. Conecte servidores on-premise com o agente MustaLink e acelere com IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" data-scroll-behavior="smooth">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
