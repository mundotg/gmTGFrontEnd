// components/JoinSelect.tsx
"use client";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useDeferredValue,
} from "react";
import { createPortal } from "react-dom";
import { Dropdown, OptionItem, SelectButton } from "./componentDoSelect";

export interface Option {
  value: string;
  label: string;
}

export type FetchOptions = (
  page: number,
  search: string
) => Promise<{
  options: Option[];
  hasMore: boolean;
  total?: number;
}>;

interface JoinSelectProps {
  value: string;
  onChange: (value: string) => void;
  fetchOptions?: FetchOptions;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  optionRenderer?: (option: Option, isSelected: boolean) => React.ReactNode;
  autoWidth?: boolean;
  debounceMs?: number;
  initialOption?: Option;
  selectedLabel?: string;
}

const JoinSelectComponent: React.FC<JoinSelectProps> = ({
  value,
  onChange,
  fetchOptions,
  placeholder = "Selecione uma opção",
  disabled = false,
  searchable = true,
  className = "",
  buttonClassName = "",
  dropdownClassName = "",
  optionRenderer,
  autoWidth = true,
  debounceMs = 300,
  initialOption,
  selectedLabel,
}) => {
  // States
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const fetchingRef = useRef(false);

  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Selected option
  const selectedOption = useMemo(
    () =>
      options.find((opt) => opt.value === value) ||
      (initialOption && initialOption.value === value ? initialOption : undefined),
    [options, value, initialOption]
  );

  const displayText =
    selectedOption?.label ||
    selectedLabel ||
    (initialOption && initialOption.value === value ? initialOption.label : "") ||
    (value && value !== "" ? value : placeholder);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    debounceRef.current = setTimeout(() => {
      setSearchTerm(deferredSearchTerm);
      setCurrentPage(1);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [deferredSearchTerm, debounceMs]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!fetchOptions || fetchingRef.current) return;

    fetchingRef.current = true;
    setLoading(true);

    try {
      const result = await fetchOptions(1, searchTerm);

      let opts = result.options;
      if (initialOption && initialOption.value !== "" && !opts.some((o) => o.value === initialOption.value) && !searchTerm) {
        opts = [initialOption, ...opts];
      }

      setOptions(opts);
      setHasMore(result.hasMore);
      setTotal(result.total ?? 0);
      setCurrentPage(1);
    } catch (error) {
      console.error("Erro ao buscar opções:", error);
      setOptions([]);
      setHasMore(false);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  // Load more
  const loadMore = useCallback(async () => {
    if (!fetchOptions || loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const result = await fetchOptions(nextPage, searchTerm);

      setOptions((prev) => {
        const newItems = result.options.filter(
          (o) => !prev.some((p) => p.value === o.value)
        );
        return [...prev, ...newItems];
      });

      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error("Erro ao carregar mais:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchOptions, hasMore, loadingMore, currentPage, searchTerm]);

  // Infinite Scroll observer
  useEffect(() => {
    if (!isOpen || !hasMore || loadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && loadMore(),
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [isOpen, hasMore, loadingMore, loadMore]);

  const isFullWidth = useMemo(() => {
    return !autoWidth || className.includes("w-full") || buttonClassName.includes("w-full");
  }, [autoWidth, className, buttonClassName]);

  // Dropdown position
  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current || typeof window === "undefined") return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top = rect.bottom + 4;
    const width = isFullWidth
      ? Math.min(rect.width, viewportWidth - 20)
      : Math.min(Math.max(rect.width, 160), viewportWidth - 20);

    let left = rect.left;
    if (left + width > viewportWidth - 10) {
      left = Math.max(10, viewportWidth - width - 10);
    }
    if (left < 10) left = 10;

    const height = dropdownRef.current?.offsetHeight || 320;
    const spaceBelow = viewportHeight - rect.bottom;
    if (spaceBelow < height + 8 && rect.top > spaceBelow) {
      top = Math.max(8, rect.top - height - 4);
    }

    setDropdownPosition({
      top,
      left,
      width,
    });
  }, [isFullWidth]);

  // Listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (evt: MouseEvent) => {
      if (
        !dropdownRef.current?.contains(evt.target as Node) &&
        !buttonRef.current?.contains(evt.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    // `capture: true` apanha também o scroll de contentores (ex.: o corpo de um
    // modal) e não só o da janela — senão a lista fixa ficava para trás.
    window.addEventListener("scroll", calculateDropdownPosition, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", calculateDropdownPosition, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", calculateDropdownPosition, { capture: true });
      window.removeEventListener("resize", calculateDropdownPosition);
    };
  }, [isOpen, calculateDropdownPosition]);

  // Focus on search
  useEffect(() => {
    if (isOpen && searchable) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [isOpen, searchable]);

  // Recalculate on open — e sempre que a lista muda de altura (opções a
  // chegar, pesquisa), para que, aberta para cima, fique encostada ao botão.
  useEffect(() => {
    if (!isOpen) return;
    calculateDropdownPosition();
    const el = dropdownRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => calculateDropdownPosition());
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen, calculateDropdownPosition]);

  // Option click
  const handleOptionClick = useCallback(
    (val: string) => {
      onChange(val);
      setIsOpen(false);
      setSearchTerm("");
    },
    [onChange]
  );

  const renderedOptions = useMemo(
    () =>
      options.map((opt) => (
        <OptionItem
          key={opt.value}
          option={opt}
          isSelected={opt.value === value}
          onSelect={handleOptionClick}
          optionRenderer={optionRenderer}
        />
      )),
    [options, value, handleOptionClick, optionRenderer]
  );

  return (
    <>
      <div className={`relative min-w-0 ${isFullWidth ? "w-full block" : "inline-block"} ${className}`}>
        <SelectButton
          ref={buttonRef}
          isOpen={isOpen}
          disabled={disabled}
          displayText={displayText}
          placeholder={placeholder}
          autoWidth={!isFullWidth}
          buttonClassName={buttonClassName}
          onToggle={() => !disabled && setIsOpen((p) => !p)}
        />
      </div>

      {isOpen && mounted && createPortal(
        <Dropdown
          ref={dropdownRef}
          position={dropdownPosition}
          autoWidth={!isFullWidth}
          dropdownClassName={dropdownClassName}
          searchable={searchable}
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          searchInputRef={searchInputRef}
          statusText={
            loading
              ? "Carregando..."
              : options.length === 0
              ? searchTerm
                ? "Nenhuma opção encontrada"
                : "Nenhuma opção disponível"
              : `${options.length} de ${total} opções`
          }
          loading={loading}
          optionsLength={options.length}
          renderedOptions={renderedOptions}
          hasMore={hasMore}
          loadingMore={loadingMore}
          loadMoreRef={loadMoreRef}
        />,
        document.body
      )}
    </>
  );
};

export const JoinSelect = React.memo(JoinSelectComponent);
