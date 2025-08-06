import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  goToNext: () => void;
  goToPrev: () => void;
  showFirstLast?: boolean;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  setPage,
  goToNext,
  goToPrev,
  showFirstLast = true,
  showPageNumbers = true,
  maxVisiblePages = 5,
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  const variants = {
    default: 'text-blue-600 hover:bg-blue-50 disabled:text-gray-400',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:bg-gray-100',
    filled: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500',
  };

  const getVisiblePages = (): number[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(page - half, 1);
    let end = Math.min(start + maxVisiblePages - 1, totalPages);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(end - maxVisiblePages + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const PageButton = ({
    onClick,
    disabled,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    disabled: boolean;
    isActive?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      className={`
        ${sizes[size]}
        ${isActive ? 'bg-blue-600 text-white' : variants[variant]}
        rounded-md transition-all duration-200
        disabled:cursor-not-allowed disabled:opacity-50
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
        whitespace-nowrap
      `}
    >
      {children}
    </button>
  );

  if (totalPages <= 1) return null;

  return (
    <div
      className={`
        flex flex-wrap items-center justify-center gap-1
        overflow-x-auto px-2 py-2
        ${className}
      `}
    >
      {showFirstLast && page > 2 && (
        <PageButton
          onClick={() => setPage(1)}
          disabled={page === 1}
          title="Primeira página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </PageButton>
      )}

      <PageButton
        onClick={goToPrev}
        disabled={page === 1}
        title="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="ml-1 hidden md:inline">Anterior</span>
      </PageButton>

      {showPageNumbers ? (
        <div className="flex items-center gap-1 mx-2 overflow-x-auto">
          {getVisiblePages().map((p) => (
            <PageButton
              key={p}
              onClick={() => setPage(p)}
              isActive={p === page}
              disabled={false}
              title={`Página ${p}`}
            >
              {p}
            </PageButton>
          ))}
        </div>
      ) : (
        <span className="mx-4 text-sm text-gray-600 whitespace-nowrap">
          Página {page} de {totalPages}
        </span>
      )}

      <PageButton
        onClick={goToNext}
        disabled={page === totalPages}
        title="Próxima página"
      >
        <span className="mr-1 hidden md:inline">Próxima</span>
        <ChevronRight className="w-4 h-4" />
      </PageButton>

      {showFirstLast && page < totalPages - 1 && (
        <PageButton
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </PageButton>
      )}
    </div>
  );
};

export default Pagination;
