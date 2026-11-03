import type { Metadata } from "next";
import "../globals.css";
import AuthProvider from "@/app/component/provader";
import Sidebar from "@/app/component/Sidebar";

export const metadata: Metadata = {
  icons: {
    icon: "/img/logo_mustainfo.png",
    shortcut: "/img/logo_mustainfo.png",
    apple: "/img/logo_mustainfo.png",
  },

  title: "Recomendador de Vídeos | MustaInfo",
  description: "Vídeos recomendados com base no seu histórico e preferências de tecnologia.",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" data-scroll-behavior="smooth">
      <body className="antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <AuthProvider>
          <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
            <Sidebar>{children}</Sidebar>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
