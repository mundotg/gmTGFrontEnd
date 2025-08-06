'use client';
import { X } from 'lucide-react';
import { MetadataTableResponse, CondicaoFiltro } from '@/types';
import DatabaseDateInput from './date-input-component';
import { getOperatorsForType, mapColumnTypeToDbType } from '../services';
import { useSession } from '@/context/SessionContext';
import DynamicInputByType from './DynamicInputByType';

interface FiltroCondicaoItemProps {
  index: number;
  condition: CondicaoFiltro;
  columns: MetadataTableResponse[];
  operators: { value: string; label: string; icon?: string }[];
  showLogicalOperator?: boolean;
  updateCondition: (index: number, campo: keyof CondicaoFiltro, valor: any) => void;
  removeCondition: (index: number) => void;
}

export default function FiltroCondicaoItem({
  index,
  condition,
  columns,
  showLogicalOperator = true,
  updateCondition,
  removeCondition,
}: FiltroCondicaoItemProps) {
  const selectedTable = columns.find(c => c.table_name === condition.table_name_fil);
  const { user } = useSession()

  const getInputType = (type: string): 'text' | 'number' | 'date' | 'checkbox' | 'select' => {

    if (/boolean|tinyint\(1\)/.test(type)) return 'checkbox'; // ou 'select' se quiser um dropdown com Sim/Não
    if (/int/.test(type) && !/float|decimal/.test(type)) return 'number'; // inteiro puro
    if (/float|double|decimal|numeric/.test(type)) return 'number';       // número com casas decimais
    if (/date|timestamp|datetime/.test(type)) return 'date';
    if (/char|text|string/.test(type)) return 'text';

    return 'text'; // fallback
  };

  function formatDecimal(value: string): string {
    // Remove tudo que não for número ou ponto
    const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    return num.toFixed(2);
  }


  const getPlaceholder = (columnType: string, operator: string, table_name: string) => {

    if (operator === 'IN' || operator === 'NOT IN') {
      return 'valor1, valor2, valor3...';
    }
    if (operator === 'LIKE' || operator === 'NOT LIKE') {
      return 'texto para buscar...';
    }
    if (columnType.includes('date')) {
      return 'YYYY-MM-DD';
    }
    if (columnType.includes('int') || columnType.includes('decimal')) {
      return 'Número';
    }
    return 'Valor';
  };

  return (
    <div key={`${index}-${condition.value+condition.column}-cond`} className="group">
      {/* Operador lógico */}
      {index > 0 && showLogicalOperator && (
        <div className="flex justify-center mb-2">
          <select
            value={condition.logicalOperator}
            onChange={(e) => updateCondition(index, 'logicalOperator', e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="AND">E (AND)</option>
            <option value="OR">OU (OR)</option>
          </select>
        </div>
      )}

      {/* Linha de condição */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition group-hover:shadow-sm overflow-x-auto sm:overflow-visible">

        {/* Tabela */}
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">Tabela</label>
          <select
            value={condition.table_name_fil}
            onChange={(e) => updateCondition(index, 'table_name_fil', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {columns.map((col, i) => (
              <option key={col.table_name + i + "o"} value={col.table_name}>
                {col.table_name}
              </option>
            ))}
          </select>
        </div>

        {/* Coluna */}
        <div className="min-w-[140px] flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Coluna</label>
          <select
            value={condition.column}
            onChange={(e) => updateCondition(index, 'column', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Selecione --</option>
            {selectedTable?.colunas?.map((col, i) => (
              <option key={`${col.nome}-${i}_sele`} value={col.nome}>
                {col.nome}{col.tipo && ` (${col.tipo})`}
              </option>
            ))}
          </select>
        </div>

        {/* Operador */}
        <div className="w-full sm:w-36">
          <label className="block text-xs font-medium text-gray-700 mb-1">Operador</label>
          <select
            value={condition.operator}
            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
            className="w-full min-w-[8rem] p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getOperatorsForType(condition.column_type, user?.InfPlus?.type || "postgresql").map((op, i) => (
              <option key={`${op.value}-${i}-opera`} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        {/* Valor */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">Valor</label>
          <DynamicInputByType
            type={getInputType(condition.column_type)}
            value={condition.value}
            onChange={(value) => updateCondition(index, 'value', value)}
            placeholder={getPlaceholder(condition.column_type, condition.operator, condition.table_name_fil)}
          />

        </div>

        {/* Remover botão */}
        <div className="flex items-end">
          <button
            onClick={() => removeCondition(index)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Remover condição"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
