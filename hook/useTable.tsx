"use client";
import { useMemo, useState } from "react";
import { FilterType, CampoDetalhado, MetadataTableResponse } from "@/types";
import { FILTER_TYPE_MAP } from "@/constant";

export const useTableColumns = (tables: MetadataTableResponse[] | undefined) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'nome' | 'tipo'>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const filteredAndSortedColumns = useMemo(() => {
    if (!tables || !Array.isArray(tables)) return [];

    const allColumns: (CampoDetalhado & { tableName: string })[] = [];

    for (const table of tables) {
      const tableName = table.table_name ?? 'desconhecida';
      const colunasComTabela = new Set(table.colunas.map(col => ({
        ...col,
        tableName,
      })));
      allColumns.push(...colunasComTabela);
    }

    const filtered = allColumns.filter((column) => {
      const matchesSearch =
        column.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        column.tableName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterType === 'all' ||
        (filterType === 'primary' && column.is_primary_key) ||
        (filterType === 'nullable' && column.is_nullable) ||
        (filterType === 'enum' && column.enum_valores_encontrados?.length) ||
        (FILTER_TYPE_MAP[filterType]?.includes(column.tipo.toLowerCase()));

      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      const aVal = a[sortBy]?.toString().toLowerCase() ?? '';
      const bVal = b[sortBy]?.toString().toLowerCase() ?? '';
      const direction = sortOrder === 'asc' ? 1 : -1;
      return aVal.localeCompare(bVal) * direction;
    });
  }, [tables, searchTerm, filterType, sortBy, sortOrder]);

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    currentPage,
    setCurrentPage,
    filteredAndSortedColumns,
  };
};
