import type { Metadata } from "next";
import "../globals.css";
import AuthProvider from "../component/provader";
import Sidebar from "../component/Sidebar";


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
    <html lang="en">
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
