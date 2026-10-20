"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

interface SearchBarProps {
  onSearch: (query: string, categoryId?: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  isLoading = false,
  placeholder,
}: SearchBarProps) {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const categories = [
    { id: "", label: t("recommendations_page.allCategories") },
    { id: "28", label: t("recommendations_page.catTech") },
    { id: "27", label: t("recommendations_page.catEdu") },
    { id: "10", label: t("recommendations_page.catMusic") },
    { id: "20", label: t("recommendations_page.catGames") },
  ];

  const defaultPlaceholder = placeholder || t("recommendations_page.searchPlaceholder");

  useEffect(() => {
    // Debounce de 400ms
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onSearch(searchTerm, selectedCategory || undefined);
    }, 400);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [searchTerm, selectedCategory, onSearch]);

  const handleClear = () => {
    setSearchTerm("");
    onSearch("", selectedCategory || undefined);
  };

  return (
    <div className="w-full flex flex-col sm:flex-row gap-3 items-center">
      {/* 🔎 Campo de Texto com Debounce */}
      <div className="relative flex-1 w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={defaultPlaceholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:ring-blue-500/20 dark:focus:border-blue-500"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 🏷️ Seletor de Categoria */}
      <div className="w-full sm:w-auto">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
              {cat.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
