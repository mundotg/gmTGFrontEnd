import { X } from 'lucide-react';
import { MetadataTableResponse, CondicaoFiltro } from '@/types';
import { getOperatorsForType } from '../services';
import DynamicInputByType from './DynamicInputByType';
import { useState, useEffect, useCallback } from 'react';
import OperationINAndNOTINInput from './InInput';

interface FiltroCondicaoItemProps {
  index: number;
  condition: CondicaoFiltro;
  columns: MetadataTableResponse[];
  operators: { value: string; label: string; icon?: string }[];
  showLogicalOperator?: boolean;
  updateCondition: (index: number, campo: keyof CondicaoFiltro, valor: string) => void;
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
  // Estado local para a tabela selecionada
  const [selectedTable, setSelectedTable] = useState<MetadataTableResponse | undefined>();
  const [value, setValue] = useState(condition.value);

  const colunaDetalhe = selectedTable?.colunas.find( c => c.nome === condition.column )
  // Estado local para placeholder
  const [placeholder, setPlaceholder] = useState("Valor");



  const hasChanges = useCallback(
    (val: string, entreIndex?: number) => {

      let valueApart = value ? value.split("*/-1") : [];

      if (entreIndex === 0) {
        valueApart[0] = val;
        updateCondition(index, "value", val); // primeiro campo
      } else if (entreIndex === 1) {
        valueApart[1] = val;
        updateCondition(index, "value2", val); // segundo campo
      } else {
        updateCondition(index, "value", val); // caso normal
        valueApart = [val];
      }

      const joinedValue = valueApart.join("*/-1");
      setValue(joinedValue);

    },
    [index, value, updateCondition]
  );



  // Atualiza selectedTable sempre que muda table_name_fil
  useEffect(() => {
    setSelectedTable(columns.find(c => c.table_name === condition.table_name_fil));
  }, [columns, condition.table_name_fil]);

  // Atualiza placeholder sempre que muda column_type ou operator
  useEffect(() => {
    if (condition.operator === 'IN' || condition.operator === 'NOT IN') {
      setPlaceholder('valor1, valor2, valor3...');
    }
    else if (condition.operator === 'Contém' || condition.operator === 'Não Contém') {
      setPlaceholder('texto para buscar...');
    }
    else if (condition.operator === 'Entre' || condition.operator === 'Não Entre') {
      setPlaceholder('Digite o intervalo (ex: 10 e 20)');
    }
    else if (condition.operator === 'Antes de' || condition.operator === 'Depois de') {
      setPlaceholder('YYYY-MM-DD');
    }
    else if (condition.column_type.includes('date')) {
      setPlaceholder('YYYY-MM-DD');
    }
    else if (condition.column_type.includes('int') || condition.column_type.includes('decimal')) {
      setPlaceholder('Número');
    }
    else {
      setPlaceholder('Valor');
    }
  }, [condition.operator, condition.column_type]);


  return (
    <div key={`${index}-${condition.value + condition.column}-cond`} className="group">
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
        <div className="min-w-[140px] flex-1" aria-label="NOME DA Coluna">
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
        <div className="w-full sm:w-36" aria-label="Operador">
          <label className="block text-xs font-medium text-gray-700 mb-1">Operador</label>
          <select
            value={condition.operator}
            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
            className="w-full min-w-[8rem] p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getOperatorsForType(condition.column_type, condition.is_nullable).map((op, i) => (
              <option key={`${op.value}-${i}-opera`} value={op.value}>
                {op.label} ({op.icon})
              </option>
            ))}
          </select>
        </div>

        {/* Valor */}
        {(condition.operator !== "IS NULL" && condition.operator !== "IS NOT NULL") ?
         ( (condition.operator === "Entre" || condition.operator === "Não Entre") ? (
            // Caso Entre / Não Entre
            <div className="flex gap-2">
              <div className="flex-1 min-w-[140px]" aria-label="Valor1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Valor 1</label>
                <DynamicInputByType
                  type={condition.column_type}
                  value={value.split("*/-1")[0] || ""}
                  onChange={(val) => hasChanges(val, 0)}
                  placeholder={placeholder}
                />
              </div>

              <div className="flex-1 min-w-[140px]" aria-label="Valor2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Valor 2</label>
                <DynamicInputByType
                  type={condition.column_type}
                  value={value.split("*/-1")[1] || ""}
                  onChange={(val) => hasChanges(val, 1)}
                  placeholder={placeholder}
                />
              </div>
            </div>
          ) :( condition.operator === "IN" || condition.operator === "NOT IN" ? (
            
            // Caso IN / NOT IN
            <div className="flex-1 min-w-[140px]" aria-label="Valores">
              <OperationINAndNOTINInput
                type={condition.column_type}
                value={value.split(",") || []}
                onChange={(vals) => hasChanges(vals.join(","))}
                placeholder="Digite um valor"
              />

            </div>
          ) : (
            // Caso padrão (igual, maior, menor, etc.)
            <div className="flex-1 min-w-[140px]" aria-label="Valor">
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor</label>
              <DynamicInputByType
              enum_values={colunaDetalhe?.enum_valores_adicionados}
                type={condition.column_type}
                value={value}
                onChange={(val) => hasChanges(val)}
                placeholder={placeholder}
              />
            </div>)
          )) : <div className="flex-1 min-w-[140px]" aria-label="Valor">
            <label className="block text-xs font-medium text-gray-700 mb-1">Valor</label>
            <DynamicInputByType
              type={"text"}
              value={condition.operator === "IS NULL" ? "Nulo" : "não nulo"}
              onChange={(val) => hasChanges(val)}
              placeholder={placeholder}
              disabled={true}
            />
          </div>
        }

        {/* Remover botão */}
        <div className="flex items-end" aria-label="Remover condição">
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
