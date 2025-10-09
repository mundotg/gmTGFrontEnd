"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download, Moon, Sun, Loader2,
  Plus,
  Filter
} from 'lucide-react';
import { CampoDetalhado, EditedFieldForQuery, TableColumnsDisplayProps } from '@/types';
import { useTableColumns } from '@/hook/useTable';
import { quickExportToCsv } from "../services/relatorio";
import { themeClassesMap } from '@/constant';
import EditFieldModal from './EditFieldModal';
import { ColumnSkeleton, ErrorDisplay } from '@/util';
import CriarRegistroNovo from './criar-registro';
import ModalAutoCreate from './ModalIntermediario';
import usePersistedState from '@/hook/localStoreUse';
import { FilterableGrid } from './columns-displayComponent/FilterableGrid';


const TableColumnsDisplay: React.FC<TableColumnsDisplayProps> = ({
  tableNames,
  columns,
  className = "",
  isLoading = false,
  setIsLoading,
  tabelaExistenteNaDB,
  error,
  theme = 'light',
  showExport = true,
  itemsPerPage = 12,
  onColumnClick,
  setSelect,
  select
}) => {
  const [isDarkMode, setIsDarkMode] = usePersistedState<boolean>("_theme", theme === 'dark');
  const currentTheme = isDarkMode ? 'dark' : 'light';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openIntermediario, setOpenIntermediario] = useState(false);
  const [modalCreateOpen, setModalCreateOpen] = usePersistedState<boolean>("_modal_Create_Open", false);
  const [selectedColumn, setSelectedColumn] = useState<CampoDetalhado & { tableName: string } | null>(null);
  const [showFilters, setShowFilters] = usePersistedState<boolean>(
    "consulta_showFilterColunas",
    false
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const {
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
    filteredAndSortedColumns
  } = useTableColumns(columns);

  // Memoize cálculos derivados
  const totalPages = useMemo(
    () => Math.ceil(filteredAndSortedColumns.length / itemsPerPage),
    [filteredAndSortedColumns, itemsPerPage]
  );

  const getColumnCount = useMemo(() => {
    return filteredAndSortedColumns.length;
  }, [filteredAndSortedColumns.length]);

  const paginatedColumns = useMemo(
    () => filteredAndSortedColumns.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ),
    [filteredAndSortedColumns, currentPage, itemsPerPage]
  );

  const totalCols = useMemo(
    () => columns?.reduce((acc, c) => acc + (c.total_colunas || 0), 0) || 0,
    [columns]
  );

  // Callbacks memoizados
  const handleColumnClick = useCallback((col: CampoDetalhado & { tableName: string }) => {
    setIsLoading?.(true);
    setSelectedColumn(col);
    setIsModalOpen(true);
    onColumnClick?.(col);
    setIsLoading?.(false);
  }, [setIsLoading, onColumnClick]);

  const handleColumnSelect = useCallback((col: CampoDetalhado & { tableName: string }, event: React.MouseEvent) => {
    event.stopPropagation();
    const columnKey = `${col.tableName}.${col.nome}`;
    const newSelected = new Set(select);

    if (newSelected.has(columnKey)) {
      newSelected.delete(columnKey);
    } else {
      newSelected.add(columnKey);
    }
    setSelect?.(Array.from(newSelected));
  }, [select, setSelect]);

  const isColumnSelected = useCallback((col: CampoDetalhado & { tableName: string }) => {
    if (!select) return false;
    return select.includes(`${col.tableName}.${col.nome}`);
  }, [select]);

  const handleSelectAll = useCallback(() => {
    const allKeys = filteredAndSortedColumns.map(col => `${col.tableName}.${col.nome}`);
    const allSelected = allKeys.every(key => select.includes(key));
    setSelect?.(allSelected ? [] : allKeys);
  }, [filteredAndSortedColumns, select, setSelect]);

  const handleSave = useCallback((updatedField: CampoDetalhado) => {
    console.log("Campo atualizado:", updatedField);
  }, []);

  const themeClasses = themeClassesMap[currentTheme === 'dark' ? 'dark' : 'light'];

  if (!hydrated) {
    return (
      <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${className}`}>
        <div className="text-sm opacity-50">Carregando colunas...</div>
      </div>
    );
  }


  // Renderização condicional para estados
  if (error) {
    return (
      <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${themeClasses.container} ${className}`}>
        <ErrorDisplay error={error} theme={currentTheme} />
      </div>
    );
  }

  function handleRowUpdate(updatedRow: EditedFieldForQuery): void {
    // throw new Error('Function not implemented.');

    console.log(updatedRow)
  }

  const handleConfirm = () => {
    setModalCreateOpen(true); // abre a modal final de criação
  };

  return (
    <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${themeClasses.container} ${className}`} aria-label='Exibição_de_Colunas_da_Tabela'>
      {/* Cabeçalho com controles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        {/* Nome das tabelas */}
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-lg font-semibold truncate max-w-[60vw] sm:max-w-[70vw] lg:max-w-[40vw]">
            Colunas: <div className="overflow-x-auto w-full lg:w-auto">
              <p className="text-sm text-gray-600 whitespace-nowrap">
                {tableNames}
              </p>
            </div>
          </h3>


          {/* Botão de tema */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg transition-colors shrink-0 ${themeClasses.button}`}
            aria-label="Alternar tema"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Scroll horizontal para muitas tabelas */}


        <EditFieldModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          field={selectedColumn}
          tabelaExistenteNaDB={tabelaExistenteNaDB}
          onSave={handleSave}
        />
        <ModalAutoCreate
          isOpen={openIntermediario}
          setModelDeCriacaoDeRegistro={handleConfirm}
          onClose={() => setOpenIntermediario(false)}
          onConfirm={(configs) => {
            console.log("Config recebida do intermediário:", configs);
          }}
          metadataList={columns || []}
        />

        <CriarRegistroNovo
          isOpen={modalCreateOpen}
          onClose={() => setModalCreateOpen(false)}
          informacaosOftables={columns || []}
          onSave={handleRowUpdate}
        />

        <div className="flex items-center gap-2 text-sm">
          <span className="opacity-75">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
              </div>
            ) : (
              `${getColumnCount} de ${totalCols} colunas`
            )}
          </span>

          {select.length > 0 && (
            <span className="text-blue-500 font-medium">
              ({select.length} selecionadas)
            </span>
          )}

          {showExport && columns && (
            <button
              onClick={() => quickExportToCsv(filteredAndSortedColumns, tabelaExistenteNaDB.join("_"))}
              className={`p-2 rounded-lg transition-colors ${themeClasses.button}`}
              title="Exportar CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {(columns && columns.length > 0) && (
            <>
              <button
                onClick={() => setOpenIntermediario(true)}
                className={`
        group relative px-4 py-2 rounded-lg font-medium text-sm
        bg-gradient-to-r from-blue-500 to-blue-600 
        hover:from-blue-600 hover:to-blue-700
        text-white shadow-lg hover:shadow-xl
        transform hover:scale-105 active:scale-95
        transition-all duration-200 ease-in-out
        flex items-center gap-2
        border-0 outline-none focus:ring-4 focus:ring-blue-200
        ${themeClasses.button}
      `}
                title="Criar novo registro"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline font-semibold">Novo Registro</span>
                <span className="sm:hidden font-semibold">Novo</span>

                {/* Efeito de brilho sutil */}
                <div className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>
            </>
          )}

        </div>
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className={`
        group relative px-4 py-2 rounded-lg font-medium text-sm
        bg-gradient-to-r from-blue-500 to-blue-600 
        hover:from-blue-600 hover:to-blue-700
        text-white shadow-lg hover:shadow-xl
        transform hover:scale-105 active:scale-95
        transition-all duration-200 ease-in-out
        flex items-center gap-2
        border-0 outline-none focus:ring-4 focus:ring-blue-200
        ${themeClasses.button}
      `}
        >
          <Filter size={18} />
          {showFilters ? "Esconder colunas" : "Mostrar colunas"}
        </button>
      </div>
      {showFilters && (
        <FilterableGrid
          data={paginatedColumns}
          isColumnSelected={isColumnSelected}
          handleColumnClick={handleColumnClick}
          handleColumnSelect={handleColumnSelect}
          onColumnClick={onColumnClick}
          currentTheme={currentTheme}
          showSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showFilter
          filterType={filterType}
          onFilterChange={setFilterType}
          showSort
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          selectable
          selectedKeys={select}
          onSelectAll={handleSelectAll}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          themeClasses={themeClasses}
          isLoading={isLoading}
          skeleton={<ColumnSkeleton theme={currentTheme} />}
          emptyState={<p className="text-center opacity-70">Nenhuma coluna encontrada</p>}
        />)
      }
    </div>
  );
};

export default React.memo(TableColumnsDisplay);