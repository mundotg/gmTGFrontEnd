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
import usePersistedState from "@/hook/localStoreUse";

export type LanguageCode = "en" | "pt" | "fr" | "cn" | "km-AO" | "umb-AO";

export type Language = {
  code: LanguageCode;
  name: string;
};

interface I18nContextType {
  locale: LanguageCode;
  t: (
    key: string,
    fallbackOrVars?: string | Record<string, string | number>,
    vars?: Record<string, string | number>
  ) => string;
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
  t: (key: string, fallbackOrVars?: string | Record<string, string | number>) =>
    typeof fallbackOrVars === "string" ? fallbackOrVars : key,
  setLocale: () => {},
});

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = usePersistedState<LanguageCode>("lacale_id","pt");
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
  const getTranslationValue = (lang: string, key: string) => {
    const dict = (translations as Record<string, any>)[lang] || translations.pt;
    if (!dict) return undefined;

    const parts = key.split(".");
    let value: any = dict;

    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) return undefined;
    }
    return value;
  };

  const t = useCallback(
    (
      key: string,
      fallbackOrVars?: string | Record<string, string | number>,
      vars?: Record<string, string | number>
    ) => {
      let fallbackText: string | undefined = undefined;
      let variables = vars;
      if (typeof fallbackOrVars === "string") {
        fallbackText = fallbackOrVars;
      } else if (typeof fallbackOrVars === "object" && fallbackOrVars !== null) {
        variables = fallbackOrVars;
      }

      // 1. Tenta buscar no idioma atual
      const currentLang = locale || "pt";
      let value = getTranslationValue(currentLang, key);

      // 2. Fallback: Se não encontrou no idioma atual e não for Português, busca em Português
      if (value === undefined && currentLang !== "pt") {
        value = getTranslationValue("pt", key);
      }

      // 3. Fallback secundário: busca em Inglês se ainda não encontrou
      if (value === undefined && currentLang !== "en") {
        value = getTranslationValue("en", key);
      }

      // 4. Se não encontrou nem no idioma principal nem nos fallbacks
      if (value === undefined) {
        if (fallbackText !== undefined) {
          return fallbackText;
        }
        return key; // Retorna a própria chave para não quebrar o layout
      }

      // 5. Substituição de variáveis (ex: {{count}} ou {count})
      if (typeof value === "string" && variables) {
        return value.replace(/\{{1,2}(\w+)\}{1,2}/g, (_, v) => String(variables[v] ?? ""));
      }

      return typeof value === "string" ? value : (fallbackText ?? key);
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