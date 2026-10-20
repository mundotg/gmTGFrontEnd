import type { Metadata } from "next";
import "../globals.css";
import AuthProvider from "../component/provader";


export const metadata: Metadata = {
  title: "MustaInf auth",
  description: "janelas de login e registro",
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
