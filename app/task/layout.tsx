import type { Metadata } from "next";
import "../globals.css";
import AuthProvider from "@/app/component/provader";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "test",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased overflow-hidden">
        <AuthProvider>
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}