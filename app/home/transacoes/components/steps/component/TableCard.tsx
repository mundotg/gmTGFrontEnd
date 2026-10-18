import React from "react";
import { Table, CheckCircle2, Database } from "lucide-react";
import { JoinSelect } from "@/app/component/BuildQueryComponent/JoinSelect";
import { Option } from "@/app/task/components/select_Component";

type TableItem = {
  id: string | number;
  table_name: string;
  fields?: unknown[];
};

type TableCardProps = {
  table: TableItem;
  isSelected: boolean;
  mappedTarget: string;
  targetConnectionExists: boolean;
  listTarget: Option[];
  onToggle: (id: string, name: string) => void;
  onMappingChange: (id: string, targetId: string) => void;
};

export const TableCard = React.memo(function TableCard({
  table,
  isSelected,
  mappedTarget,
  targetConnectionExists,
  listTarget,
  onToggle,
  onMappingChange,
}: TableCardProps) {
  const tableId = String(table.id);

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? "bg-blue-50 border-blue-300 shadow-sm"
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => onToggle(tableId, table.table_name)}
      >
        <input
          type="checkbox"
          checked={isSelected}
          readOnly
          className="w-5 h-5 text-blue-600 rounded"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold font-mono text-gray-900 truncate flex items-center gap-2">
            <Table className="w-4 h-4 text-gray-400" />
            {table.table_name}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {table?.fields?.length || 0} campos
          </div>
        </div>

        {isSelected && (
          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
        )}
      </div>

      {isSelected && targetConnectionExists && (
        <div
          className="mt-3 text-black"
          onClick={(e) => e.stopPropagation()} // ✅ evita desmarcar ao mexer no select
        >
          <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-gray-500" />
            Selecionar tabela de destino:
            {!mappedTarget && (
              <span className="ml-2 text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                sem destino
              </span>
            )}
          </label>

          <JoinSelect
            onChange={(value) => onMappingChange(tableId, value)}
            options={listTarget}
            value={mappedTarget}
          />
        </div>
      )}
    </div>
  );
},
// ✅ comparação: só re-renderiza se mudar algo que o card usa
(prev, next) =>
  prev.isSelected === next.isSelected &&
  prev.mappedTarget === next.mappedTarget &&
  prev.table.id === next.table.id &&
  prev.table.table_name === next.table.table_name &&
  (prev.table.fields?.length || 0) === (next.table.fields?.length || 0) &&
  prev.targetConnectionExists === next.targetConnectionExists &&
  prev.listTarget === next.listTarget
);
