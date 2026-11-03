import type { Metadata } from "next";
import "../globals.css";
import AuthProvider from "../component/provader";
import Sidebar from "../component/Sidebar";


export const metadata: Metadata = {
  icons: {
    icon: "/img/logo_mustainfo.png",
    shortcut: "/img/logo_mustainfo.png",
    apple: "/img/logo_mustainfo.png",
  },

  title: "MustaInfo plataforma",
  description: "Uma plataforma completa para gerir a sua infraestrutura de dados.",
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
          <div className="flex bg-gray-50">
            <Sidebar >
              {children}
            </Sidebar>

          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
