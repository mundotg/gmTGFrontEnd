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
import fr from "@/public/I18/fr.json";
import cn from "@/public/I18/cn.json";
import km from "@/public/I18/km-AO.json";
import umb from "@/public/I18/umb-AO.json";

export type LanguageCode = "en" | "pt" | "fr" | "cn" | "km-AO" | "umb-AO";

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
  fr,
  cn,
  "km-AO": km,
  "umb-AO": umb,
} as const satisfies Record<LanguageCode, any>;

const I18nContext = createContext<I18nContextType>({
  locale: "pt",
  t: (key: string) => key,
  setLocale: () => {},
});

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<LanguageCode>("pt");
  const [mounted, setMounted] = useState(false); // Para resolver o erro de hidratação do Next.js

  useEffect(() => {
    const saved = localStorage.getItem("locale") as LanguageCode | null;
    if (saved && Object.keys(translations).includes(saved)) {
      setLocaleState(saved);
    }
    setMounted(true); // Indica que o componente já está montado no cliente
  }, []);

  const setLocale = (lang: LanguageCode) => {
    setLocaleState(lang);
    localStorage.setItem("locale", lang);
  };

  // Função auxiliar para buscar a chave num idioma específico
  const getTranslationValue = (lang: LanguageCode, key: string) => {
    const parts = key.split(".");
    let value: any = translations[lang];

    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) return undefined;
    }
    return value;
  };

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      // 1. Tenta buscar no idioma atual
      let value = getTranslationValue(locale, key);

      // 2. Fallback: Se não encontrou no idioma atual e não for Português, busca em Português
      if (value === undefined && locale !== "pt") {
        value = getTranslationValue("pt", key);
      }

      // 3. Se não encontrou nem no idioma principal nem no fallback, retorna a chave e avisa no console
      if (value === undefined) {
        console.warn(`🔍 Tradução não encontrada para a chave: "${key}"`);
        return key; // Retorna a própria chave para não quebrar o layout
      }

      // 4. Substituição de variáveis (ex: {{count}})
      if (typeof value === "string" && vars) {
        return value.replace(/\{\{(\w+)\}\}/g, (_, v) => String(vars[v] ?? ""));
      }

      return typeof value === "string" ? value : key;
    },
    [locale]
  );

  // Enquanto não estiver montado no cliente, não renderiza a UI para evitar "Hydration Mismatch"
  if (!mounted) {
    return null; // Ou podes retornar um loader genérico/página em branco
  }

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => useContext(I18nContext);