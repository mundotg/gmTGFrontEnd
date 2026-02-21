"use client";
import { Check, Database, Search } from "lucide-react";
import { JSX, memo } from "react";
import { useI18n } from "@/context/I18nContext";
import { TableItem } from "./TableItem";

type RenderTabContentParams = {
  activeTab: "all" | "selected";
  filteredTables: string[];
  filteredSelectedTables: string[];
  localSelection: string[];
  tableAliases: Record<string, string>;
  editingAlias: string | null;
  toggleTable: (table: string) => void;
  handleAliasChange: (table: string, alias: string) => void;
  startEditingAlias: (table: string) => void;
  finishEditingAlias: () => void;
  setEditingAlias: (alias: string | null) => void;
  removeAlias: (table: string) => void;
  getAliasError: (alias: string) => string | null;
  setActiveTab: (tab: "all" | "selected") => void;
};

// Componentes de estado vazio memoizados e padronizados
const EmptyStateAll = memo(() => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm mb-3">
        <Database className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-600 font-medium">{t("modalTable.emptyAll") || "Nenhuma tabela encontrada"}</p>
    </div>
  );
});
EmptyStateAll.displayName = "EmptyStateAll";

const EmptyStateSelected = memo(({ setActiveTab }: { setActiveTab: (tab: "all" | "selected") => void }) => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm mb-3">
        <Check className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-900 font-bold mb-1">{t("modalTable.emptySelectedTitle") || "Nenhuma tabela selecionada"}</p>
      <p className="text-sm text-gray-500 mb-4">{t("modalTable.emptySelectedDesc") || "Você ainda não selecionou nenhuma tabela para a consulta."}</p>
      <button
        onClick={() => setActiveTab("all")}
        className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors border border-blue-200"
      >
        {t("modalTable.goToAllTables") || "Ir para Todas as Tabelas"}
      </button>
    </div>
  );
});
EmptyStateSelected.displayName = "EmptyStateSelected";

const EmptyStateSearch = memo(() => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm mb-3">
        <Search className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-600 font-medium text-center">
        {t("modalTable.emptySearch") || "Nenhuma tabela selecionada encontrada na pesquisa"}
      </p>
    </div>
  );
});
EmptyStateSearch.displayName = "EmptyStateSearch";

// Componente TableList memoizado para evitar re-renders desnecessários
const TableList = memo(({
  tables,
  isSelectedTab,
  localSelection,
  tableAliases,
  editingAlias,
  toggleTable,
  handleAliasChange,
  startEditingAlias,
  finishEditingAlias,
  setEditingAlias,
  removeAlias,
  getAliasError,
}: {
  tables: string[];
  isSelectedTab: boolean;
  localSelection: string[];
  tableAliases: Record<string, string>;
  editingAlias: string | null;
  toggleTable: (table: string) => void;
  handleAliasChange: (table: string, alias: string) => void;
  startEditingAlias: (table: string) => void;
  finishEditingAlias: () => void;
  setEditingAlias: (alias: string | null) => void;
  removeAlias: (table: string) => void;
  getAliasError: (alias: string) => string | null;
}) => (
  <div className="space-y-2">
    {tables.map((table) => (
      <TableItem
        key={table}
        table={table}
        isInSelectedTab={isSelectedTab}
        selected={localSelection}
        tableAliases={tableAliases}
        editingAlias={editingAlias}
        onToggle={toggleTable}
        onAliasChange={handleAliasChange}
        onStartEditing={startEditingAlias}
        onFinishEditing={finishEditingAlias}
        onCancelEditing={() => setEditingAlias(null)}
        onRemoveAlias={removeAlias}
        getAliasError={getAliasError}
      />
    ))}
  </div>
));
TableList.displayName = "TableList";

// Componente principal memoizado
export const RenderTabContent = memo(({
  activeTab,
  filteredTables,
  filteredSelectedTables,
  localSelection,
  tableAliases,
  editingAlias,
  toggleTable,
  handleAliasChange,
  startEditingAlias,
  finishEditingAlias,
  setEditingAlias,
  removeAlias,
  getAliasError,
  setActiveTab,
}: RenderTabContentParams): JSX.Element => {

  // Renderização para aba "Todas as Tabelas"
  if (activeTab === "all") {
    if (filteredTables.length === 0) {
      return <EmptyStateAll />;
    }

    return (
      <TableList
        tables={filteredTables}
        isSelectedTab={false}
        localSelection={localSelection}
        tableAliases={tableAliases}
        editingAlias={editingAlias}
        toggleTable={toggleTable}
        handleAliasChange={handleAliasChange}
        startEditingAlias={startEditingAlias}
        finishEditingAlias={finishEditingAlias}
        setEditingAlias={setEditingAlias}
        removeAlias={removeAlias}
        getAliasError={getAliasError}
      />
    );
  }

  // Renderização para aba "Selecionadas"
  if (localSelection.length === 0) {
    return <EmptyStateSelected setActiveTab={setActiveTab} />;
  }

  if (filteredSelectedTables.length === 0) {
    return <EmptyStateSearch />;
  }

  return (
    <TableList
      tables={filteredSelectedTables}
      isSelectedTab={true}
      localSelection={localSelection}
      tableAliases={tableAliases}
      editingAlias={editingAlias}
      toggleTable={toggleTable}
      handleAliasChange={handleAliasChange}
      startEditingAlias={startEditingAlias}
      finishEditingAlias={finishEditingAlias}
      setEditingAlias={setEditingAlias}
      removeAlias={removeAlias}
      getAliasError={getAliasError}
    />
  );
});

RenderTabContent.displayName = "RenderTabContent";

// Alias para manter compatibilidade com código existente
export const renderTabContent = RenderTabContent;