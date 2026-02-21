"use client";
import React, { useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "filled";
  className?: string;
  labels?: {
    previous?: string;
    next?: string;
    first?: string;
    last?: string;
    page?: string;
    of?: string;
  };
  disabled?: boolean;
  showEllipsis?: boolean;
}

// 🔹 Estilos centralizados fora do componente
const styles = {
  sizes: {
    sm: "text-xs px-2 py-1 min-w-[2rem] h-8",
    md: "text-sm px-3 py-2 min-w-[2.5rem] h-9",
    lg: "text-base px-4 py-3 min-w-[3rem] h-11",
  },
  variants: {
    default:
      "text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:text-gray-400 bg-transparent",
    outline:
      "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-200 shadow-sm",
    filled:
      "bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 shadow-sm",
  },
};

// 🔹 Subcomponentes
const PageButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  isActive?: boolean;
  size: "sm" | "md" | "lg";
  variant: "default" | "outline" | "filled";
  children: React.ReactNode;
  "aria-label"?: string;
  "aria-current"?: "page" | false;
}> = ({ onClick, disabled, isActive, size, variant, children, ...ariaProps }) => {
  
  // Classe específica para o estado Ativo (Page Atual)
  const activeClass = isActive 
    ? "bg-blue-50 text-blue-700 border-blue-400 shadow-sm ring-1 ring-blue-500/50" 
    : styles.variants[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={isActive ? "page" : false}
      className={`
        ${styles.sizes[size]}
        ${activeClass}
        rounded-lg transition-all duration-200 ease-in-out
        disabled:cursor-not-allowed disabled:opacity-60
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
        inline-flex items-center justify-center font-bold
        active:scale-95 whitespace-nowrap select-none
        ${variant === "outline" && !isActive ? "border" : ""}
      `}
      {...ariaProps}
    >
      {children}
    </button>
  );
};

const EllipsisButton: React.FC<{ size: "sm" | "md" | "lg" }> = ({ size }) => (
  <div
    className={`${styles.sizes[size]} inline-flex items-center justify-center text-gray-400 pointer-events-none font-bold`}
    aria-hidden="true"
  >
    <MoreHorizontal className="w-4 h-4" />
  </div>
);

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPageNumbers = true,
  maxVisiblePages = 5,
  size = "md",
  variant = "outline", // Mudei o default para "outline" pois se alinha mais ao nosso Padrão
  className = "",
  labels = {},
  disabled = false,
  showEllipsis = true,
}) => {
  const { t } = useI18n();

  const mergedLabels = useMemo(() => ({
    previous: t("pagination.previous") || "Anterior",
    next: t("pagination.next") || "Próxima",
    first: t("pagination.first") || "Primeira página",
    last: t("pagination.last") || "Última página",
    page: t("pagination.page") || "Página",
    of: t("common.of") || "de",
    ...labels
  }), [t, labels]);

  // 🔹 Callbacks
  const goToNext = useCallback(() => {
    if (page < totalPages && !disabled) onPageChange(page + 1);
  }, [page, totalPages, onPageChange, disabled]);

  const goToPrev = useCallback(() => {
    if (page > 1 && !disabled) onPageChange(page - 1);
  }, [page, onPageChange, disabled]);

  const goToFirst = useCallback(() => {
    if (page > 1 && !disabled) onPageChange(1);
  }, [page, onPageChange, disabled]);

  const goToLast = useCallback(() => {
    if (page < totalPages && !disabled) onPageChange(totalPages);
  }, [page, totalPages, onPageChange, disabled]);

  // 🔹 Páginas visíveis
  const getVisiblePages = useMemo((): (number | "ellipsis")[] => {
    if (totalPages <= maxVisiblePages || !showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(page - half, 1);
    const end = Math.min(start + maxVisiblePages - 1, totalPages);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(end - maxVisiblePages + 1, 1);
    }

    const pages: (number | "ellipsis")[] = [];
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("ellipsis");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("ellipsis");
      pages.push(totalPages);
    }

    return pages;
  }, [page, totalPages, maxVisiblePages, showEllipsis]);

  if (totalPages <= 1) return null;

  return (
    <nav
      role="navigation"
      aria-label={t("pagination.ariaLabel") || "Navegação por páginas"}
      className={`flex flex-wrap items-center justify-center gap-1.5 px-2 py-2 overflow-x-auto ${disabled ? "pointer-events-none opacity-60" : ""} ${className}`}
    >
      {showFirstLast && (
        <PageButton
          onClick={goToFirst}
          disabled={page === 1}
          size={size}
          variant={variant}
          aria-label={mergedLabels.first}
        >
          <ChevronsLeft className="w-4 h-4" />
        </PageButton>
      )}

      <PageButton
        onClick={goToPrev}
        disabled={page === 1}
        size={size}
        variant={variant}
        aria-label={`${mergedLabels.previous} - ${mergedLabels.page} ${page - 1}`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline text-xs uppercase tracking-wider">{mergedLabels.previous}</span>
      </PageButton>

      {showPageNumbers ? (
        <div className="flex items-center gap-1.5 mx-1 overflow-x-auto">
          {getVisiblePages.map((p, idx) =>
            p === "ellipsis" ? (
              <EllipsisButton key={`ellipsis-${idx}`} size={size} />
            ) : (
              <PageButton
                key={p}
                onClick={() => onPageChange(p)}
                isActive={p === page}
                disabled={false}
                size={size}
                variant={variant}
                aria-label={`${mergedLabels.page} ${p}`}
              >
                {p}
              </PageButton>
            )
          )}
        </div>
      ) : (
        <span className="mx-4 text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          {mergedLabels.page} <span className="text-gray-900">{page}</span> {mergedLabels.of} <span className="text-gray-900">{totalPages}</span>
        </span>
      )}

      <PageButton
        onClick={goToNext}
        disabled={page === totalPages}
        size={size}
        variant={variant}
        aria-label={`${mergedLabels.next} - ${mergedLabels.page} ${page + 1}`}
      >
        <span className="mr-1 hidden sm:inline text-xs uppercase tracking-wider">{mergedLabels.next}</span>
        <ChevronRight className="w-4 h-4" />
      </PageButton>

      {showFirstLast && (
        <PageButton
          onClick={goToLast}
          disabled={page === totalPages}
          size={size}
          variant={variant}
          aria-label={mergedLabels.last}
        >
          <ChevronsRight className="w-4 h-4" />
        </PageButton>
      )}
    </nav>
  );
};

export default Pagination;