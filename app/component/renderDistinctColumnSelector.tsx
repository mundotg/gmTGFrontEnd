import { Filter, X } from "lucide-react";

interface DistinctColumnSelectorProps {
  distinctColumns: string[];
  availableColumns: string[];
  toggleDistinctColumn: (col: string) => void;
  selectAllDistinctColumns: () => void;
  clearAllDistinctColumns: () => void;
}

export const RenderDistinctColumnSelector = ({
  distinctColumns,
  availableColumns,
  toggleDistinctColumn,
  selectAllDistinctColumns,
  clearAllDistinctColumns,
}: DistinctColumnSelectorProps) => (
  <div className="border-t border-gray-200 p-4 lg:p-6 bg-white">
    {/* Header */}
    <div className="border-b border-gray-200 p-4 lg:p-6 bg-blue-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            Selecionar colunas para DISTINCT ({distinctColumns.length}/{availableColumns.length})
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAllDistinctColumns}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Todas
          </button>
          <button
            onClick={clearAllDistinctColumns}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>

    {/* Colunas */}
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
      {availableColumns.map((col,index) => (
        <label
          key={col+"distinct"+index}
          className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/70 p-2 rounded transition-colors"
        >
          <input
            type="checkbox"
            checked={distinctColumns.includes(col)}
            onChange={() => toggleDistinctColumn(col)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-gray-700 truncate" title={col}>
            {col}
          </span>
        </label>
      ))}
    </div>

    {/* Colunas Selecionadas */}
    {distinctColumns.length > 0 && (
      <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
        <p className="text-xs text-gray-600 mb-2 font-medium">
          Colunas selecionadas para DISTINCT:
        </p>
        <div className="flex flex-wrap gap-1">
          {distinctColumns.map((col, index) => (
            <span
              key={`${col}-${index}distinct`}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
            >
              {col}
              <button
                onClick={() => toggleDistinctColumn(col)}
                className="hover:text-blue-900 transition-colors"
                title={`Remover ${col}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);