import type { Metadata } from "next";
import "../globals.css";
import AuthProvider from "../component/provader";


export const metadata: Metadata = {
  icons: {
    icon: "/img/logo_mustainfo.png",
    shortcut: "/img/logo_mustainfo.png",
    apple: "/img/logo_mustainfo.png",
  },

  title: "Welcome to",
  description: "esta pagina é uma demostração de um projeto de um sistema de gerenciamento de banco de dados, onde o usuário pode se conectar a um banco, criar consultas, configurar tabelas e muito mais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" data-scroll-behavior="smooth">
      <body
        className={`antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
