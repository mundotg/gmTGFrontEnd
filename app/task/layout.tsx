import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import AuthProvider from "@/app/component/provader";
import { SessionProvider } from "@/context/SessionContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gestor de Projectos & Tarefas | MustaInfoo",
  description: "Plataforma empresarial moderna para gestão ágil de projectos, sprints e tarefas de equipa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" data-scroll-behavior="smooth" className={`${inter.variable} h-full`}>
      <body className={`${inter.className} font-sans antialiased h-full text-gray-900 bg-gray-50/50 selection:bg-indigo-500/20`}>
        <AuthProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}