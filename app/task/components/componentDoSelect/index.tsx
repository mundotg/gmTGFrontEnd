import { ChevronDown, Loader2, Search } from "lucide-react";
import React from "react";
import { Option } from "../select_Component";

// Componentes separados para melhor performance
const SelectButton = React.forwardRef<
  HTMLButtonElement,
  {
    isOpen: boolean;
    disabled: boolean;
    displayText: string;
    placeholder: string;
    autoWidth: boolean;
    buttonClassName: string;
    onToggle: () => void;
  }
>(({
  isOpen,
  disabled,
  displayText,
  placeholder,
  autoWidth,
  buttonClassName,
  onToggle
}, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onToggle}
    disabled={disabled}
    className={`
    inline-flex items-center justify-between
    rounded-md transition-all duration-200 text-sm px-3 py-2
    border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${disabled
        ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400"
        : isOpen
          ? "border-blue-500 shadow-lg ring-2 ring-blue-500/20 bg-white"
          : "border-gray-300 hover:border-gray-400 hover:shadow-sm bg-white"}
    ${displayText !== placeholder ? "text-gray-900" : "text-gray-500"}
    ${autoWidth ? "w-auto min-w-[160px]" : "w-full"}
    ${buttonClassName}
  `}
    role="combobox"
    aria-haspopup="listbox"
    aria-controls="id-da-lista"
    aria-expanded={isOpen}
    aria-label={placeholder}
  >
    <span className="flex-1 truncate text-left mr-2" title={displayText}>
      {displayText}
    </span>
    <ChevronDown
      size={16}
      className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
    />
  </button>

));

SelectButton.displayName = 'SelectButton';

const Dropdown = React.forwardRef<
  HTMLDivElement,
  {
    position: { top: number; left: number; width: number };
    autoWidth: boolean;
    dropdownClassName: string;
    searchable: boolean;
    searchTerm: string;
    onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    statusText: string;
    loading: boolean;
    optionsLength: number;
    renderedOptions: React.ReactNode[];
    hasMore: boolean;
    loadingMore: boolean;
    loadMoreRef: React.RefObject<HTMLDivElement | null>;
  }
>(({
  position,
  autoWidth,
  dropdownClassName,
  searchable,
  searchTerm,
  onSearchChange,
  searchInputRef,
  statusText,
  loading,
  optionsLength,
  renderedOptions,
  hasMore,
  loadingMore,
  loadMoreRef
}, ref) => (
  <div
    ref={ref}
    className={`
      fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl
      max-h-80 overflow-hidden flex flex-col
      animate-in fade-in-0 zoom-in-95 duration-100
      ${dropdownClassName}
    `}
    style={{
      top: `${position.top}px`,
      left: `${position.left}px`,
      width: autoWidth ? 'max-content' : `${position.width}px`,
      minWidth: `${Math.min(position.width, 200)}px`,
    }}
    role="listbox"
  >
    {searchable && (
      <div className="p-2 border-b border-gray-100 bg-gray-50">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm 
                     focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                     bg-white"
          />
        </div>
      </div>
    )}

    <div className="px-3 py-1 bg-gray-50 border-b border-gray-100">
      <p className="text-xs text-gray-500 truncate">
        {statusText}
      </p>
    </div>

    <div className="flex-1 overflow-y-auto">
      {loading && optionsLength === 0 ? (
        <LoadingState />
      ) : optionsLength === 0 ? (
        <EmptyState text={statusText} />
      ) : (
        <>
          {renderedOptions}
          {hasMore && (
            <LoadMoreTrigger
              ref={loadMoreRef}
              loadingMore={loadingMore}
            />
          )}
        </>
      )}
    </div>
  </div>
));

Dropdown.displayName = 'Dropdown';

const OptionItem = React.memo<{
  option: Option;
  isSelected: boolean;
  onSelect: (value: string) => void;
  optionRenderer?: (option: Option, isSelected: boolean) => React.ReactNode;
}>(({ option, isSelected, onSelect, optionRenderer }) => (
  <button
    onClick={() => onSelect(option.value)}
    className={`
      w-full flex items-center px-3 py-2 text-sm text-left 
      transition-colors duration-150 border-b border-gray-50
      hover:bg-blue-50 hover:text-blue-700
      ${isSelected
        ? "bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-500"
        : "text-gray-700"}
    `}
    role="option"
    aria-selected={isSelected}
  >
    {optionRenderer ? optionRenderer(option, isSelected) : (
      <span className="truncate flex-1">
        {option.label}
      </span>
    )}
    {isSelected && (
      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0" />
    )}
  </button>
));

OptionItem.displayName = 'OptionItem';

const LoadingState = React.memo(() => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
    <span className="text-sm text-gray-500">Carregando...</span>
  </div>
));

LoadingState.displayName = 'LoadingState';

const EmptyState = React.memo<{ text: string }>(({ text }) => (
  <div className="p-4 text-center text-gray-500 text-sm">
    {text}
  </div>
));

EmptyState.displayName = 'EmptyState';

const LoadMoreTrigger = React.forwardRef<HTMLDivElement, { loadingMore: boolean }>(
  ({ loadingMore }, ref) => (
    <div ref={ref} className="flex justify-center py-2">
      {loadingMore ? (
        <div className="flex items-center text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Carregando mais...
        </div>
      ) : (
        <div className="h-4" />
      )}
    </div>
  )
);

LoadMoreTrigger.displayName = 'LoadMoreTrigger';


export {  SelectButton,
  Dropdown,
  OptionItem
};