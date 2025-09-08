"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Database, CheckCircle, XCircle, Key,
  Search, ArrowUpDown, Download, Moon, Sun,
  ChevronLeft, ChevronRight, Loader2, Check, Lock,
  Plus
} from 'lucide-react';
import { CampoDetalhado, EditedFieldForQuery, FilterType, TableColumnsDisplayProps } from '@/types';
import { useTableColumns } from '@/hook/useTable';
import { quickExportToCsv } from "../services/relatorio";
import { FILTER_OPTIONS, themeClassesMap } from '@/constant';
import EditFieldModal from './EditFieldModal';
import { ColumnSkeleton, ErrorDisplay, getColumnIcon } from '@/util';
import CriarRegistroNovo from './criar-registro';
import ModalAutoCreate from './ModalIntermediario';
import usePersistedState from '@/hook/localStoreUse';


const TableColumnsDisplay: React.FC<TableColumnsDisplayProps> = ({
  tableNames,
  columns,
  className = "",
  isLoading = false,
  setIsLoading,
  tabelaExistenteNaDB,
  error,
  theme = 'light',
  showSearch = true,
  showFilter = true,
  showSort = true,
  showExport = true,
  itemsPerPage = 12,
  onColumnClick,
  setSelect,
  select
}) => {
  const [isDarkMode, setIsDarkMode] = usePersistedState<boolean>("_theme",theme === 'dark');
  const currentTheme = isDarkMode ? 'dark' : 'light';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openIntermediario, setOpenIntermediario] = useState(false);
  const [modalCreateOpen, setModalCreateOpen] = usePersistedState<boolean>("_modal_Create_Open",false);
  const [selectedColumn, setSelectedColumn] = useState<CampoDetalhado & { tableName: string } | null>(null);
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

  function openModalCreateNewRegister(): void {
    setModalCreateOpen(true)
  }
  const handleConfirm = () => {
    setModalCreateOpen(true); // abre a modal final de criação
  };

  return (
    <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${themeClasses.container} ${className}`} aria-label='Exibição_de_Colunas_da_Tabela'>
      {/* Cabeçalho com controles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold truncate">
            Colunas: {tableNames}
          </h3>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg transition-colors ${themeClasses.button}`}
            aria-label="Alternar tema"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

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
            console.log("Config recebida do intermediário:",configs);
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
      </div>

      {/* Controles de busca e filtro */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {showSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              type="text"
              placeholder="Buscar colunas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${themeClasses.input}`}
            />
          </div>
        )}

        {showFilter && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className={`px-4 py-2 rounded-lg border transition-colors ${themeClasses.input}`}
          >
            {FILTER_OPTIONS.map((option, index) => (
              <option key={option.value + index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {showSort && (
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'nome' | 'tipo')}
              className={`px-4 py-2 rounded-lg border transition-colors ${themeClasses.input}`}
            >
              <option value="nome">Nome</option>
              <option value="tipo">Tipo</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`p-2 rounded-lg transition-colors ${themeClasses.button}`}
              title={`Ordenar ${sortOrder === 'asc' ? 'decrescente' : 'crescente'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Botão selecionar todos */}
        {filteredAndSortedColumns.length > 0 && (
          <button
            onClick={handleSelectAll}
            className={`px-4 py-2 rounded-lg border transition-colors ${themeClasses.selectButton}`}
            title={select.length === filteredAndSortedColumns.length ? 'Desmarcar todos' : 'Selecionar todos'}
          >
            {select.length === filteredAndSortedColumns.length ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        )}
      </div>

      {/* Grid de colunas */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <ColumnSkeleton key={i} theme={currentTheme} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-3  md:grid-cols-2 ">
          {paginatedColumns.map((column, index) => {
            const isSelected = isColumnSelected(column);

            return (
              <div
                key={`${column.nome}-${index}-pa`}
                onClick={() => handleColumnClick(column)}
                className={`relative p-3 rounded-lg border transition-all duration-200 cursor-pointer 
          focus:outline-none focus:ring-2 focus:ring-blue-400
          ${isSelected ? themeClasses.cardSelected : themeClasses.card}
          ${onColumnClick ? 'hover:shadow-md hover:scale-[1.02]' : ''}
        `}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`Coluna ${column.nome}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onColumnClick?.(column);
                  }
                }}
              >
                {/* Checkbox de seleção */}
                <div
                  className="absolute top-2 right-2 z-10"
                  onClick={(e) => handleColumnSelect(column, e)}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer
              ${isSelected
                        ? currentTheme === 'dark'
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-blue-500 border-blue-500'
                        : currentTheme === 'dark'
                          ? 'border-gray-500 hover:border-blue-500 bg-gray-800'
                          : 'border-gray-300 hover:border-blue-400 bg-white'
                      }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>

                {/* Indicador visual de seleção */}
                {isSelected && (
                  <div
                    className={`absolute top-0 left-0 w-full h-1 rounded-t-lg 
              ${currentTheme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'}`}
                  />
                )}

                <div className="flex items-start gap-3 pr-8">
                  {getColumnIcon(column, currentTheme)}

                  <div className="flex-1 min-w-0">
                    {/* Nome da coluna */}
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-medium truncate"
                        title={column.nome}
                      >
                        {column.nome}
                      </span>
                      {column.is_primary_key && (
                        <Key
                          className="w-3 h-3 text-yellow-500 flex-shrink-0"
                          aria-label="Chave primária"
                        />
                      )}
                    </div>

                    {/* Tipo + Nullability */}
                    <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                      <span
                        className={`font-mono px-1.5 py-0.5 rounded truncate max-w-[120px] sm:max-w-[80px] 
      ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
                        title={column.tipo.toUpperCase()}
                      >
                        {column.tipo.toUpperCase()}
                      </span>
                      {column.is_nullable ? (
                        <span className="text-green-500 flex items-center gap-1 sm:text-[10px]">
                          <CheckCircle className="w-3 h-3 sm:w-2 sm:h-2" />
                          NULL
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1 sm:text-[10px]">
                          <XCircle className="w-3 h-3 sm:w-2 sm:h-2" />
                          NOT NULL
                        </span>
                      )}
                    </div>


                    {/* Valor padrão */}
                    {column.default != null && (
                      <div className="text-xs opacity-75 mb-1 break-words">
                        <span className="mr-1">Padrão:</span>
                        <code
                          className={`px-1 py-0.5 rounded font-mono text-xs break-all 
                    ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
                        >
                          {String(column.default)}
                        </code>
                      </div>
                    )}

                    {/* ENUM valores */}
                    {column.enum_valores_encontrados && column.enum_valores_encontrados.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {column.enum_valores_encontrados.map((valor, idx) => (
                          <span
                            key={`${valor}-${idx}-enum`}
                            className="text-xs sm:text-[10px] bg-blue-100 dark:bg-blue-900 
                 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded font-mono truncate max-w-[100px]"
                            title={valor}
                          >
                            {valor}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Foreign Key */}
                    {column.is_foreign_key && (
                      <span className="text-xs text-green-500 flex items-center gap-1 mt-1">
                        <Lock className="w-3 h-3" />
                        {column.referenced_table} - {column.field_references}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      )}

      {/* Paginação */}
      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${themeClasses.button}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm opacity-75">
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${themeClasses.button}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Estado vazio */}
      {!isLoading && filteredAndSortedColumns.length === 0 && (
        <div className="text-center py-8 opacity-75">
          <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>
            {searchTerm || filterType !== 'all'
              ? 'Nenhuma coluna encontrada com os filtros aplicados'
              : 'Nenhuma coluna encontrada'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TableColumnsDisplay;