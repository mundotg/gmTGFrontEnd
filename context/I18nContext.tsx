"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import en from "@/public/I18/en.json";
import pt from "@/public/I18/pt.json";

export type LanguageCode = "en" | "pt";

export type Language = {
  code: LanguageCode;
  name: string;
};

interface I18nContextType {
  locale: LanguageCode;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: LanguageCode) => void;
}

const translations = {
  en,
  pt,
} as const satisfies Record<LanguageCode, any>;

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  t: (key: string) => key,
  setLocale: () => {},
});

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  // Define 'pt' como padrão inicial
  const [locale, setLocaleState] = useState<LanguageCode>("pt");

  useEffect(() => {
    const saved = localStorage.getItem("locale");
    if (saved === "pt" || saved === "en") {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (lang: LanguageCode) => {
    setLocaleState(lang);
    localStorage.setItem("locale", lang);
  };

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => { // <-- Tipagem ajustada aqui
      const parts = key.split(".");
      let value: any = translations[locale];

      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) {
          console.warn(`🔍 Tradução não encontrada: "${key}"`);
          return key;
        }
      }

      if (typeof value === "string" && vars) {
        // Envolve em String() para garantir que números (como 0) não quebrem o replace
        return value.replace(/\{\{(\w+)\}\}/g, (_, v) => String(vars[v] ?? "")); 
      }

      return typeof value === "string" ? value : key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => useContext(I18nContext);