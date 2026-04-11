import { useState, useEffect, useMemo, useCallback } from "react";
import { useI18n } from "@/context/I18nContext";

// ==========================================
// INTERFACES E TIPOS
// ==========================================
export interface TabelaComColunas {
    table_name: string;
    colunas: Array<{
        nome: string;
        tipo: string;
    }>;
}

export interface TableSelectModalProps {
    allTables: string[];
    tableSelected?: string[]; // Para mostrar as colunas disponíveis para DISTINCT
    selected: string[];
    onClose: () => void;
    onSave: (tables: string[], distinct: boolean, distinctColumns?: string[], aliases?: Record<string, string>) => void;
    columnMap?: TabelaComColunas[];
    propUseDistinct?: boolean; // Para controlar o estado do DISTINCT de fora, se necessário
    initialAliases?: Record<string, string>;
}

export type TabType = 'all' | 'selected';

// Regex para validação de alias (apenas letras, números e underscore, sem começar por número)
const ALIAS_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// ==========================================
// HOOK PRINCIPAL
// ==========================================
export function useTableSelect({
    allTables,
    selected,
    propUseDistinct,
    onClose,
    onSave,
    columnMap = [],
    initialAliases = {},
}: TableSelectModalProps) {
    const { t } = useI18n();

    // ==========================================
    // 1. ESTADOS
    // ==========================================
    const [localSelection, setLocalSelection] = useState<string[]>(selected);
    const [searchTerm, setSearchTerm] = useState("");
    const [useDistinct, setUseDistinct] = useState(propUseDistinct || false);
    const [distinctColumns, setDistinctColumns] = useState<string[]>([]);
    const [showDistinctOptions, setShowDistinctOptions] = useState(false);
    const [tableAliases, setTableAliases] = useState<Record<string, string>>(initialAliases);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [editingAlias, setEditingAlias] = useState<string | null>(null);

    // ==========================================
    // 2. VALORES COMPUTADOS (useMemo)
    // ==========================================
    const filteredTables = useMemo(() => {
        if (!searchTerm.trim()) return allTables;
        const term = searchTerm.toLowerCase();
        return allTables.filter((table) => table.toLowerCase().includes(term));
    }, [allTables, searchTerm]);

    const filteredSelectedTables = useMemo(() => {
        if (!searchTerm.trim()) return localSelection;
        const term = searchTerm.toLowerCase();
        return localSelection.filter((table) => table.toLowerCase().includes(term));
    }, [localSelection, searchTerm]);

    useEffect(() => {
        // Sincroniza o estado local quando a modal abre e a prop selected muda
        setLocalSelection(selected);
    }, [selected]);



    const isValidSelection = useMemo(() => {
        if (localSelection.length === 0) return false;

        if (useDistinct && localSelection.length > 0 && distinctColumns.length === 0) {
            return false;
        }

        const usedAliases = new Set<string>();

        for (const [, alias] of Object.entries(tableAliases)) {
            const trimmedAlias = alias?.trim();
            if (!trimmedAlias) continue;

            if (!ALIAS_REGEX.test(trimmedAlias)) return false;
            if (usedAliases.has(trimmedAlias)) return false;

            usedAliases.add(trimmedAlias);
        }

        return true;
    }, [localSelection.length, useDistinct, distinctColumns.length, tableAliases]);



    // ==========================================
    // 3. AÇÕES (useCallback)
    // ==========================================
    const handleSave = useCallback(() => {
        if (!isValidSelection) return;

        const columnsToPass = useDistinct && distinctColumns.length > 0 ? distinctColumns : undefined;
        const validAliases: Record<string, string> = {};

        localSelection.forEach(table => {
            const alias = tableAliases[table]?.trim();
            if (alias && ALIAS_REGEX.test(alias)) {
                validAliases[table] = alias;
            }
        });

        const aliasesToPass = Object.keys(validAliases).length > 0 ? validAliases : undefined;

        onSave(localSelection, useDistinct, columnsToPass, aliasesToPass);
        onClose();
    }, [localSelection, useDistinct, distinctColumns, tableAliases, onSave, onClose, isValidSelection]);

    const toggleTable = useCallback((table: string) => {
        setLocalSelection((prev) => {
            const isCurrentlySelected = prev.includes(table);
            const newSelection = isCurrentlySelected
                ? prev.filter((t) => t !== table)
                : [...prev, table];

            // Cleanup para tabelas desmarcadas
            if (isCurrentlySelected) {
                setTableAliases(prevAliases => {
                    const { [table]: _, ...rest } = prevAliases;
                    return rest;
                });

                if (newSelection.length === 0) {
                    setUseDistinct(false);
                    setDistinctColumns([]);
                    setShowDistinctOptions(false);
                }
            }

            return newSelection;
        });
    }, []);

    const selectAll = useCallback(() => {
        const tablesToSelect = activeTab === 'all' ? filteredTables : allTables;
        setLocalSelection(Array.from(new Set([...localSelection, ...tablesToSelect])));
    }, [activeTab, filteredTables, allTables, localSelection]);

    const clearAll = useCallback(() => {
        setLocalSelection([]);
        setUseDistinct(false);
        setDistinctColumns([]);
        setShowDistinctOptions(false);
        setTableAliases({});
        setEditingAlias(null);
    }, []);

    const handleDistinctToggle = useCallback((checked: boolean) => {
        setUseDistinct(checked);
        if (checked && localSelection.length > 0) {
            setShowDistinctOptions(true);
        } else {
            setShowDistinctOptions(false);
            setDistinctColumns([]);
        }
    }, [localSelection.length]);

    const toggleDistinctColumn = useCallback((column: string) => {
        setDistinctColumns((prev) =>
            prev.includes(column)
                ? prev.filter((col) => col !== column)
                : [...prev, column]
        );
    }, []);

    const selectAllDistinctColumns = useCallback(() => {
        setDistinctColumns([...localSelection]);
    }, [localSelection]);

    const clearAllDistinctColumns = useCallback(() => {
        setDistinctColumns([]);
    }, []);

    const handleAliasChange = useCallback((tableName: string, alias: string) => {
        setTableAliases(prev => ({
            ...prev,
            [tableName]: alias
        }));
    }, []);

    const startEditingAlias = useCallback((tableName: string) => {
        setEditingAlias(tableName);

        setTableAliases(prev => {
            if (prev[tableName]) return prev;

            const firstLetter = tableName.charAt(0).toLowerCase();
            const existingAliases = new Set(Object.values(prev));
            let counter = 1;
            let newAlias = `${firstLetter}${counter}`;

            while (existingAliases.has(newAlias)) {
                counter++;
                newAlias = `${firstLetter}${counter}`;
            }

            return { ...prev, [tableName]: newAlias };
        });
    }, []);

    const finishEditingAlias = useCallback(() => {
        setEditingAlias(null);
    }, []);

    const removeAlias = useCallback((tableName: string) => {
        setTableAliases(prev => {
            const { [tableName]: _, ...rest } = prev;
            return rest;
        });
    }, []);


    // ==========================================
    // 4. EFEITOS (Keyboard Shortcuts)
    // ==========================================
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                if (editingAlias) {
                    setEditingAlias(null);
                } else {
                    onClose();
                }
            } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && isValidSelection) {
                e.preventDefault();
                handleSave();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose, isValidSelection, handleSave, editingAlias]);

    // ==========================================
    // 5. RETORNO PLANO
    // ==========================================
    return {
        // Estados
        localSelection, searchTerm, useDistinct, activeTab, tableAliases,
        distinctColumns, showDistinctOptions, editingAlias,

        // Computados
        filteredTables, filteredSelectedTables, isValidSelection,
        setDistinctColumns,

        // Ações
        setSearchTerm, toggleTable, handleSave, selectAll, clearAll, setActiveTab,
        handleDistinctToggle, toggleDistinctColumn, selectAllDistinctColumns,
        clearAllDistinctColumns, handleAliasChange, startEditingAlias,
        finishEditingAlias, setEditingAlias, removeAlias
    };
}