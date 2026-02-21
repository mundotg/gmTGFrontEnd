"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
   Moon, Sun, Loader2,
  Plus,
  Filter,
} from 'lucide-react';
import { CampoDetalhado, EditedFieldForQuery, MetadataTableResponse, TableColumnsDisplayProps } from '@/types';
import { useTableColumns } from '@/hook/useTable';
import EditFieldModal from './EditFieldModal';
import { ColumnSkeleton, ErrorDisplay } from '@/util';
import CriarRegistroNovo from './criar-registro';
import ModalAutoCreate from './ModalIntermediario';
import usePersistedState from '@/hook/localStoreUse';
import { FilterableGrid } from './columns-displayComponent/FilterableGrid';
import { FormatoRelatorio, useRelatorioAvancado } from '../services/useRelatorio';
import { RelatorioPayload } from '@/hook/useRelatorio';
import { FORMATS, ReportButton } from '../services/ReportButton';
import { useI18n } from '@/context/I18nContext';
import { themeClassesMap } from '@/constant';

const TableColumnsDisplay: React.FC<TableColumnsDisplayProps> = ({
  tableNames,
  columns,
  className = "",
  isLoading = false,
  setIsLoading,
  tabelaExistenteNaDB,
  error,
  theme = 'light',
  itemsPerPage = 12,
  onColumnClick,
  setSelect,
  select
}) => {
  const { t } = useI18n();
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

  // Hook de relatório
  const {
    gerarRelatorio,
    cancelarGeracao,
    isLoading: isLoadingRelatorio,
    error: errorRelatorio,
    success: successRelatorio,
    progress: progressRelatorio,
    tempoEstimado,
    dadosRelatorio,
    reset: resetRelatorio
  } = useRelatorioAvancado<MetadataTableResponse[]>();

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

  const totalPages = useMemo(
    () => Math.ceil(filteredAndSortedColumns.length / itemsPerPage),
    [filteredAndSortedColumns, itemsPerPage]
  );
const themeClasses = themeClassesMap[currentTheme === 'dark' ? 'dark' : 'light'];
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

  const handleGerarRelatorio = useCallback(async (format: FormatoRelatorio) => {
    if (!columns || columns.length === 0) {
      console.error('Nenhuma coluna disponível para gerar relatório');
      return;
    }

    const payload: RelatorioPayload<MetadataTableResponse[]> = {
      tipo: 'metadados',
      body: columns,
      filtros: {
        tabelas: tableNames,
        totalColunas: totalCols
      },
      parametros: {
        formato: format,
        incluirDetalhes: true
      }
    };

    await gerarRelatorio(payload);
  }, [columns, tableNames, totalCols, gerarRelatorio]);

  if (!hydrated) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 ${className}`}>
        <div className="text-sm text-gray-500">{t('common.loadingColumns') || "Carregando colunas..."}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 ${className}`}>
        <ErrorDisplay error={error} theme={currentTheme} />
      </div>
    );
  }

  function handleRowUpdate(updatedRow: EditedFieldForQuery): void {
    console.log(updatedRow);
  }

  const handleConfirm = () => {
    setModalCreateOpen(true);
  };

  return (
    <div className={`bg-white dark:bg-[#1C1C1E] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 sm:p-6 ${className}`} aria-label='Exibição_de_Colunas_da_Tabela'>
      
      {/* Cabeçalho com controles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        
        {/* Nome das tabelas */}
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[60vw] sm:max-w-[70vw] lg:max-w-[40vw] flex items-center gap-2">
            {t('common.columns') || "Colunas"}: 
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md whitespace-nowrap overflow-hidden text-ellipsis">
              {tableNames}
            </span>
          </h3>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
            title={t('actions.toggleTheme') || "Alternar tema"}
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                {t('common.loading') || "Carregando..."}
              </>
            ) : (
              `${getColumnCount} ${t('common.of') || "de"} ${totalCols} ${t('common.columns') || "colunas"}`
            )}
            
            {select.length > 0 && (
              <span className="text-blue-600 dark:text-blue-400 ml-1 border-l border-gray-300 dark:border-gray-600 pl-2">
                {select.length} {t('common.selected') || "selecionadas"}
              </span>
            )}
          </div>

          {columns && columns.length > 0 && (
            <ReportButton
              onGenerate={handleGerarRelatorio}
              formats={FORMATS}
              hasResults={true}
              isLoading={isLoadingRelatorio}
            />
          )}

          {columns && columns.length > 0 && (
            <button
              onClick={() => setOpenIntermediario(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              title={t('actions.newRecord') || "Criar novo registro"}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('actions.newRecord') || "Novo Registro"}</span>
              <span className="sm:hidden">{t('actions.new') || "Novo"}</span>
            </button>
          )}

          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors border ${
              showFilters 
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" 
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">
              {showFilters ? (t('actions.hideFilters') || "Esconder filtros") : (t('actions.showFilters') || "Mostrar filtros")}
            </span>
          </button>
        </div>
      </div>

      {/* Alertas do Relatório (Padronizados) */}
      {isLoadingRelatorio && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="flex justify-between text-sm font-medium text-blue-800 mb-3">
            <span>{t('reports.generating') || "Gerando relatório PDF..."} ({progressRelatorio}%)</span>
            <span>{t('reports.estimatedTime') || "Tempo estimado"}: {tempoEstimado}s</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressRelatorio}%` }}
            />
          </div>
          <button
            onClick={cancelarGeracao}
            className="mt-3 text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
          >
            {t('actions.cancel') || "Cancelar"}
          </button>
        </div>
      )}

      {successRelatorio && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex justify-between items-center">
          <span className="text-green-800 text-sm font-medium">
            ✅ {t('reports.success') || "Relatório gerado com sucesso!"} 
            {dadosRelatorio.geradoEm && ` em ${dadosRelatorio.geradoEm.toLocaleString()}`}
          </span>
          <button 
            onClick={resetRelatorio}
            className="text-green-800 text-sm font-bold hover:underline"
          >
            {t('actions.close') || "Fechar"}
          </button>
        </div>
      )}

      {errorRelatorio && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex justify-between items-center">
          <span className="text-red-800 text-sm font-medium">
            ❌ {t('reports.error') || "Erro ao gerar relatório"}: {errorRelatorio}
          </span>
          <button 
            onClick={resetRelatorio}
            className="text-red-800 text-sm font-bold hover:underline"
          >
            {t('actions.tryAgain') || "Tentar novamente"}
          </button>
        </div>
      )}

      {/* Grid Filterable */}
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
          themeClasses={themeClasses} // O FilterableGrid deve usar classes Tailwind neutras por padrão agora
          isLoading={isLoading}
          skeleton={<ColumnSkeleton theme={currentTheme} />}
          emptyState={<p className="text-center text-gray-500 py-8 font-medium">{t('common.noColumnsFound') || "Nenhuma coluna encontrada"}</p>}
        />
      )}
    </div>
  );
};

export default React.memo(TableColumnsDisplay);