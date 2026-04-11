"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useI18n, LanguageCode } from "@/context/I18nContext";

interface LanguageSelectorProps {
  onChange?: (code: LanguageCode) => void;
}

export function LanguageSelector({ onChange }: LanguageSelectorProps) {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mapeamento dos idiomas disponíveis
  const languages: Array<{ code: LanguageCode; name: string; flag: string }> = [
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "km-AO", name: "Kimbundu", flag: "🇦🇴" },
    { code: "umb-AO", name: "Umbundu", flag: "🇦🇴" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "cn", name: "中文 (Mandarim)", flag: "🇨🇳" },
  ];

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  // Fechar o dropdown se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fechar dropdown com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const handleSelect = (code: LanguageCode) => {
    setLocale(code);
    onChange?.(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left w-full xs:w-auto" ref={dropdownRef}>
      {/* Botão Gatilho */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 w-full xs:w-56 px-3 xs:px-4 py-2 xs:py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg xs:rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Globe size={16} className="xs:w-4 xs:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
            {currentLang.flag} {currentLang.name}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 w-full xs:w-56 mt-2 origin-top-left xs:origin-top-right left-0 xs:right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 max-h-96 overflow-y-auto"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1 space-y-0">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full text-left flex items-center justify-between gap-2 px-3 xs:px-4 py-2.5 xs:py-2.5 text-xs xs:text-sm transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 ${
                  locale === lang.code
                    ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
                role="menuitem"
                aria-label={lang.name}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-base xs:text-lg flex-shrink-0">{lang.flag}</span>
                  <span className="truncate">{lang.name}</span>
                </span>
                {locale === lang.code && (
                  <Check size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}