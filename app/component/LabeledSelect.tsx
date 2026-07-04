"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import {
  ChevronDown,
  X,
  Check,
  Search,
  ShieldAlert,
} from "lucide-react";

import { useSession } from "@/context/SessionContext";
import { isSystemTable } from "../home/tabelas/componentTabela/util";

export interface Option {
  value: string;
  label: string;
  schema?: string;
}

interface LabeledSelectProps {
  label: string;
  value: string[] | string;
  onChange: (value: string) => Promise<void>;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  maxSelections?: number;
  searchable?: boolean;
}

const ITEM_HEIGHT = 72;
const CONTAINER_HEIGHT = 240;
const OVERSCAN = 5;

const LabeledSelectComponent: React.FC<
  LabeledSelectProps
> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione uma ou mais opções",
  disabled = false,
  maxSelections,
  searchable = true,
}) => {
    const { user } = useSession();

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [scrollTop, setScrollTop] = useState(0);

    const dropdownRef =
      useRef<HTMLDivElement>(null);

    const searchInputRef =
      useRef<HTMLInputElement>(null);

    const isAdmin =
      user?.roles?.some(
        (r) =>
          r.name === "admin" ||
          r.name === "Administrador"
      ) ||
      user?.cargo?.position === "admin";

    // =========================================
    // CLICK OUTSIDE
    // =========================================
    useEffect(() => {
      const handleClickOutside = (
        event: MouseEvent
      ) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(
            event.target as Node
          )
        ) {
          setIsOpen(false);
          setSearchTerm("");
        }
      };

      document.addEventListener(
        "mousedown",
        handleClickOutside
      );

      return () =>
        document.removeEventListener(
          "mousedown",
          handleClickOutside
        );
    }, []);

    // =========================================
    // FOCUS SEARCH
    // =========================================
    useEffect(() => {
      if (isOpen && searchable) {
        searchInputRef.current?.focus();
      }
    }, [isOpen, searchable]);

    // =========================================
    // NORMALIZA VALUE
    // =========================================
    const selectedValues = useMemo(() => {
      return Array.isArray(value)
        ? value
        : value
          ? [value]
          : [];
    }, [value]);

    // =========================================
    // LABELS
    // =========================================
    const selectedLabels = useMemo(() => {
      return selectedValues.map(
        (val) =>
          options.find((o) => o.value === val)
            ?.label || val
      );
    }, [selectedValues, options]);

    // =========================================
    // DISPLAY TEXT
    // =========================================
    const displayText = useMemo(() => {
      if (selectedLabels.length === 0)
        return placeholder;

      if (selectedLabels.length === 1)
        return selectedLabels[0];

      return `${selectedLabels.length} opções selecionadas`;
    }, [selectedLabels, placeholder]);

    // =========================================
    // FILTER OPTIONS
    // =========================================
    const filteredOptions = useMemo(() => {
      if (!searchTerm) return options;

      const lower = searchTerm.toLowerCase();

      return options.filter((opt) =>
        opt.label.toLowerCase().includes(lower)
      );
    }, [searchTerm, options]);

    // =========================================
    // PROCESS OPTIONS (MEMO)
    // =========================================
    const processedOptions = useMemo(() => {
      return filteredOptions.map((option) => ({
        ...option,
        systemInfo: isSystemTable(
          option.value,
          option.schema,
          user?.info_extra?.type
        ),
      }));
    }, [filteredOptions]);

    // =========================================
    // VIRTUALIZATION
    // =========================================
    const visibleRange = useMemo(() => {
      const startIndex = Math.max(
        0,
        Math.floor(scrollTop / ITEM_HEIGHT) -
        OVERSCAN
      );

      const endIndex = Math.min(
        processedOptions.length,
        Math.ceil(
          (scrollTop + CONTAINER_HEIGHT) /
          ITEM_HEIGHT
        ) + OVERSCAN
      );

      return {
        startIndex,
        endIndex,
      };
    }, [scrollTop, processedOptions.length]);

    const visibleOptions = useMemo(() => {
      return processedOptions.slice(
        visibleRange.startIndex,
        visibleRange.endIndex
      );
    }, [processedOptions, visibleRange]);

    const totalHeight =
      processedOptions.length * ITEM_HEIGHT;

    const offsetY =
      visibleRange.startIndex * ITEM_HEIGHT;

    // =========================================
    // ACTIONS
    // =========================================
    const handleToggle = useCallback(() => {
      if (!disabled) {
        setIsOpen((prev) => !prev);
        setSearchTerm("");
      }
    }, [disabled]);

    const handleOptionClick = useCallback(
      (optionValue: string) => {
        const isSelected =
          selectedValues.includes(optionValue);

        if (isSelected) {
          onChange(optionValue);
        } else if (
          !maxSelections ||
          selectedValues.length <
          maxSelections
        ) {
          onChange(optionValue);
        }
      },
      [
        selectedValues,
        onChange,
        maxSelections,
      ]
    );

    const handleClearAll = useCallback(
      () => onChange(""),
      [onChange]
    );

    return (
      <div className="w-full">
        {/* LABEL */}
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          {label}

          {maxSelections && (
            <span className="text-xs font-normal text-gray-500 ml-1">
              (máx. {maxSelections})
            </span>
          )}
        </label>

        {/* SELECT */}
        <div
          className="relative"
          ref={dropdownRef}
        >
          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled}
            className={`
            w-full flex items-center justify-between p-3 
            border-2 rounded-xl transition-all duration-200
            ${disabled
                ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400"
                : isOpen
                  ? "border-blue-500 shadow-lg ring-4 ring-blue-500/10"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }
            ${selectedLabels.length > 0
                ? "text-gray-900"
                : "text-gray-500"
              }
          `}
          >
            <span className="truncate text-left">
              {displayText}
            </span>

            <ChevronDown
              className={`ml-2 h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {/* DROPDOWN */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-hidden flex flex-col">
              {/* SEARCH */}
              {searchable && (
                <div className="p-3 border-b border-gray-100 flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Buscar opções..."
                      value={searchTerm}
                      onChange={(e) =>
                        setSearchTerm(
                          e.target.value
                        )
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* CLEAR */}
              {selectedValues.length > 0 && (
                <div className="p-2 border-b border-gray-100 flex-shrink-0">
                  <button
                    onClick={handleClearAll}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Limpar todas as seleções
                  </button>
                </div>
              )}

              {/* VIRTUAL LIST */}
              <div
                className="max-h-60 overflow-y-auto"
                onScroll={(e) =>
                  setScrollTop(
                    e.currentTarget.scrollTop
                  )
                }
              >
                {processedOptions.length ===
                  0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {searchTerm
                      ? "Nenhuma opção encontrada"
                      : "Nenhuma opção disponível"}
                  </div>
                ) : (
                  <div
                    style={{
                      height: totalHeight,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        transform: `translateY(${offsetY}px)`,
                      }}
                    >
                      {visibleOptions.map(
                        (option) => {
                          const isSelected =
                            selectedValues.includes(
                              option.value
                            );

                          const {
                            isSystem,
                            reason,
                          } =
                            option.systemInfo;

                          const isSystemAndNotAdmin =
                            isSystem &&
                            !isAdmin;

                          const isLimitReached =
                            !isSelected &&
                            !!maxSelections &&
                            selectedValues.length >=
                            maxSelections;

                          const isDisabled =
                            isLimitReached ||
                            isSystemAndNotAdmin;

                          return (
                            <button
                              key={option.value}
                              onClick={() =>
                                !isDisabled &&
                                handleOptionClick(
                                  option.value
                                )
                              }
                              disabled={
                                !!isDisabled
                              }
                              style={{
                                height:
                                  ITEM_HEIGHT,
                              }}
                              className={`
                              w-full flex items-center justify-between p-3 text-left transition-colors border-b border-gray-50
                              ${isDisabled &&
                                  isSystemAndNotAdmin
                                  ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                                  : isDisabled
                                    ? "text-gray-400 cursor-not-allowed opacity-60"
                                    : isSelected
                                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                      : isSystem
                                        ? "bg-amber-50/30 text-gray-700 hover:bg-amber-50"
                                        : "text-gray-700 hover:bg-gray-50"
                                }
                            `}
                            >
                              <div className="flex flex-col flex-1 truncate pr-4">
                                <span className="flex items-center gap-2 truncate">
                                  {option.label}

                                  {isSystem && (
                                    <ShieldAlert
                                      size={14}
                                      className={`flex-shrink-0 ${isAdmin
                                        ? "text-amber-500"
                                        : "text-red-400"
                                        }`}
                                    />
                                  )}
                                </span>

                                {isSystem && (
                                  <span
                                    className={`text-[10px] mt-0.5 truncate ${isAdmin
                                      ? "text-amber-600 font-medium"
                                      : "text-red-400"
                                      }`}
                                  >
                                    {isAdmin
                                      ? "Sistema (Desbloqueado p/ Admin)"
                                      : `Bloqueado: ${reason}`}
                                  </span>
                                )}
                              </div>

                              {isSelected && (
                                <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* TAGS */}
        {selectedValues.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedValues.map((val) => {
              const opt = options.find(
                (o) => o.value === val
              );

              const labelStr =
                opt?.label || val;

              const { isSystem } =
                isSystemTable(
                  val,
                  opt?.schema,
                  user?.info_extra?.type
                );

              return (
                <span
                  key={val}
                  className={`inline-flex items-center px-3 py-1 text-white text-sm rounded-full shadow-sm
                  ${isSystem
                      ? "bg-gradient-to-r from-amber-500 to-red-500"
                      : "bg-gradient-to-r from-blue-500 to-blue-600"
                    }
                `}
                >
                  <span className="truncate max-w-32">
                    {labelStr}
                  </span>

                  <button
                    onClick={() =>
                      handleOptionClick(val)
                    }
                    className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* COUNTER */}
        {maxSelections && (
          <div className="mt-2 text-xs text-gray-500">
            {selectedValues.length} de{" "}
            {maxSelections} selecionados
          </div>
        )}
      </div>
    );
  };

export const LabeledSelect = React.memo(
  LabeledSelectComponent
);