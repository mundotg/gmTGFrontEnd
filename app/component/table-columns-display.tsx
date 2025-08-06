import React, { useState } from 'react';
import {
  Database, Hash, Type, Calendar, CheckCircle, XCircle, Key,
  Search, ArrowUpDown, Download, Moon, Sun,
  ChevronLeft, ChevronRight, AlertCircle, Loader2, Check
} from 'lucide-react';
import { CampoDetalhado, FilterType, TableColumnsDisplayProps } from '@/types';
import { useTableColumns } from '@/hook/useTable';
import { exportToCSV } from '../services';
import { FILTER_OPTIONS } from '@/constant';
import EditFieldModal from './EditFieldModal';

// Componente de Loading Skeleton
const ColumnSkeleton = ({ theme }: { theme: 'light' | 'dark' }) => (
  <div className={`animate-pulse p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
    <div className="flex items-start gap-3">
      <div className={`w-5 h-5 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className="flex-1">
        <div className={`h-4 rounded mb-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className={`h-3 rounded w-2/3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
      </div>
    </div>
  </div>
);

// Componente de Error
const ErrorDisplay = ({ error, theme }: { error: string; theme: 'light' | 'dark' }) => (
  <div className={`p-6 rounded-lg border-2 border-dashed ${theme === 'dark'
    ? 'border-red-800 bg-red-900/20 text-red-300'
    : 'border-red-200 bg-red-50 text-red-600'
    }`}>
    <div className="flex items-center gap-3">
      <AlertCircle className="w-6 h-6" />
      <div>
        <h3 className="font-semibold">Erro ao carregar colunas</h3>
        <p className="text-sm opacity-75">{error}</p>
      </div>
    </div>
  </div>
);

// Função aprimorada para ícones
const getColumnIcon = (column: CampoDetalhado, theme: 'light' | 'dark') => {
  const iconClass = `w-5 h-5 flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`;

  switch (column.tipo.toLowerCase()) {
    case 'varchar':
    case 'text':
    case 'string':
      return <Type className={iconClass} />;
    case 'int':
    case 'integer':
    case 'bigint':
    case 'number':
      return <Hash className={iconClass} />;
    case 'datetime':
    case 'timestamp':
    case 'date':
      return <Calendar className={iconClass} />;
    default:
      return <Database className={iconClass} />;
  }
};

const TableColumnsDisplay: React.FC<TableColumnsDisplayProps> = ({
  tableName,
  columns,
  className = "",
  isLoading = false,
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
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');
  const currentTheme = isDarkMode ? 'dark' : 'light';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<CampoDetalhado & { tableName: string } | null>(null);

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

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedColumns.length / itemsPerPage);
  const paginatedColumns = filteredAndSortedColumns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleColumnClick = (col: CampoDetalhado& { tableName: string }) => {
    setSelectedColumn(col);
    setIsModalOpen(true);
    onColumnClick?.(col);
  };

    const handleColumnSelect = (col: CampoDetalhado & { tableName: string }, event: React.MouseEvent) => {
    event.stopPropagation();
    const columnKey = `${col.tableName}.${col.nome}`;
    const newSelected = new Set(select);
    
    if (newSelected.has(columnKey)) {
      newSelected.delete(columnKey);
    } else {
      newSelected.add(columnKey);
    }

    setSelect?.(Array.from(newSelected));
  };

  const isColumnSelected = (col: CampoDetalhado & { tableName: string }) => {
    const columnKey = `${col.tableName}.${col.nome}`;
    if (!select) return false;
    return select.includes(columnKey);
  };

  const handleSelectAll = () => {
    const allKeys = filteredAndSortedColumns.map(col => `${col.tableName}.${col.nome}`);
    const allSelected = allKeys.every(key => select.includes(key));

    if (allSelected) {
      setSelect?.([]);
    } else {
      setSelect?.(allKeys);
    }
  };


  const handleSave = (updatedField: CampoDetalhado) => {
    // console.log("Campo atualizado:", updatedField);
    // Atualize sua lista de colunas ou envie para API
  };

  // Estilos baseados no tema
  const themeClasses = {
    container: currentTheme === 'dark'
      ? 'bg-gray-900 border-gray-700 text-white'
      : 'bg-white border-gray-200 text-gray-800',
    card: currentTheme === 'dark'
      ? 'bg-gray-800 hover:bg-gray-700 border-gray-600'
      : 'bg-gray-50 hover:bg-gray-100 border-gray-200',
    cardSelected: currentTheme === 'dark'
      ? 'bg-blue-900/30 border-blue-600 ring-2 ring-blue-500/50'
      : 'bg-blue-50 border-blue-300 ring-2 ring-blue-200',
    input: currentTheme === 'dark'
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    button: currentTheme === 'dark'
      ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300',
    selectButton: currentTheme === 'dark'
      ? 'bg-blue-700 hover:bg-blue-600 text-white border-blue-600'
      : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300'
  };

  // Renderização condicional para estados
  if (error) {
    return (
      <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${themeClasses.container} ${className}`}>
        <ErrorDisplay error={error} theme={currentTheme} />
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${themeClasses.container} ${className}`}>
      {/* Cabeçalho com controles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold truncate">
            Colunas: {tableName}
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
          onSave={handleSave}
        />
        
        <div className="flex items-center gap-2 text-sm">
          <span className="opacity-75">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
              </div>
            ) : (
              `${filteredAndSortedColumns.length} de ${columns?.reduce((acc, c) => acc + (c.total_colunas || 0), 0) || 0} colunas`
            )}
          </span>
          
          {select.length > 0 && (
            <span className="text-blue-500 font-medium">
              ({select.length} selecionadas)
            </span>
          )}

          {showExport && columns && (
            <button
              onClick={() => exportToCSV(filteredAndSortedColumns, tableName)}
              className={`p-2 rounded-lg transition-colors ${themeClasses.button}`}
              title="Exportar CSV"
            >
              <Download className="w-4 h-4" />
            </button>
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
            {FILTER_OPTIONS.map((option,index) => (
              <option key={option.value+index} value={option.value}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {paginatedColumns.map((column,index) => {
            const isSelected = isColumnSelected(column);
            return (
              <div
                key={column.nome+index+"pa"}
                onClick={() => handleColumnClick(column)}
                className={`relative p-3 rounded-lg border transition-all duration-200 cursor-pointer 
                  ${isSelected ? themeClasses.cardSelected : themeClasses.card}
                  ${onColumnClick ? 'hover:shadow-md transform hover:scale-105' : ''}
                `}
                role="button"
                tabIndex={0}
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
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer
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
                  <div className={`absolute top-0 left-0 w-full h-1 rounded-t-lg 
                    ${currentTheme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'}`}
                  />
                )}

                <div className="flex items-start gap-3 pr-8">
                  {getColumnIcon(column, currentTheme)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate" title={column.nome}>
                        {column.nome}
                      </span>
                      {column.is_primary_key && (
                        <Key className="w-3 h-3 text-yellow-500 flex-shrink-0" xlinkTitle={select.length === filteredAndSortedColumns.length ? 'Desmarcar todos' : 'Selecionar todos'}/>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className={`font-mono px-1.5 py-0.5 rounded ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                        {column.tipo.toUpperCase()}
                      </span>
                      {column.is_nullable ? (
                        <span className="text-green-500 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          NULL
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          NOT NULL
                        </span>
                      )}
                    </div>

                    {column.default !== null && column.default !== undefined && (
                      <div className="text-xs opacity-75 mb-1 break-words">
                        <span className="mr-1">Padrão:</span>
                        <code className={`px-1 py-0.5 rounded font-mono text-xs break-all ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                          }`}>
                          {String(column.default)}
                        </code>
                      </div>
                    )}

                    {column.enum_valores_encontrados && column.enum_valores_encontrados.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-blue-500 mb-1">ENUM:</div>
                        <div className="flex flex-wrap gap-1">
                          {column.enum_valores_encontrados.map((valor, idx) => (
                            <span
                              key={idx+valor+"enum"}
                              className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded font-mono"
                              title={valor}
                            >
                              {valor}
                            </span>
                          ))}
                        </div>
                      </div>
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