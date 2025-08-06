import type { Metadata } from "next";
import "../globals.css";
import AuthProvider from "../component/provader";


export const metadata: Metadata = {
  title: "test",
  description: "test",
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
