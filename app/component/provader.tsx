"use client";
import { ReactNode, useEffect } from "react";
import { I18nProvider } from "@/context/I18nContext";
import { SessionProvider } from "@/context/SessionContext";
import { applyTheme, getStoredTheme, isDarkTheme } from "@/util";

interface AuthProviderProps {
  children: ReactNode;
}

import GlobalForbiddenNotifier from "./GlobalForbiddenNotifier";

export default function AuthProvider({ children }: AuthProviderProps) {
  // Ninguém aplicava o tema ao carregar a página: a classe `dark` só era posta
  // no momento em que se gravava o formulário de aparência, e desaparecia na
  // recarga seguinte. A escolha ficava guardada e não se via.
  useEffect(() => {
    const modo = getStoredTheme();
    applyTheme(modo);

    // Com "system", seguir o sistema operativo enquanto a página está aberta —
    // senão só acompanharia a mudança depois de recarregar.
    if (modo !== "system" || !window.matchMedia) return;

    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const aoMudar = () =>
      document.documentElement.classList.toggle("dark", isDarkTheme("system"));

    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, []);

  return (
    <I18nProvider>
      <SessionProvider>
        <GlobalForbiddenNotifier />
        {children}
      </SessionProvider>
    </I18nProvider>
  );
}
