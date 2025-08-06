"use client";
import { ReactNode } from "react";
import { I18nProvider } from "@/context/I18nContext";
import { SessionProvider } from "@/context/SessionContext";


interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <I18nProvider >
      <SessionProvider>
        {children}
      </SessionProvider>
    </I18nProvider >
  );
}