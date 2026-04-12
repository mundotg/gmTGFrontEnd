import type { Metadata } from "next";
import "../globals.css";
import AuthProvider from "../component/provader";


export const metadata: Metadata = {
  title: "Welcome to",
  description: "esta pagina é uma demostração de um projeto de um sistema de gerenciamento de banco de dados, onde o usuário pode se conectar a um banco, criar consultas, configurar tabelas e muito mais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
