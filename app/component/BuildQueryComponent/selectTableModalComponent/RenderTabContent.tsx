"use client";
import { Check, Search, List } from "lucide-react";
import { JSX, memo } from "react";
import { useI18n } from "@/context/I18nContext";
import { GenericListItem } from "./TableItem";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Tab = "all" | "selected";

type DistinctProps = {
  showDistinctOptions?: boolean;
  distinctColumns?: string[];
  toggleDistinctColumn?: (column: string) => void;
};

type AliasProps = {
  tableAliases: Record<string, string>;
  editingAlias: string | null;
  handleAliasChange: (table: string, alias: string) => void;
  startEditingAlias: (table: string) => void;
  finishEditingAlias: () => void;
  setEditingAlias: (alias: string | null) => void;
  removeAlias: (table: string) => void;
  getAliasError: (alias: string) => string | null;
  enableAliases?: boolean;
};

type LabelProps = {
  itemLabelSingular?: string;
  itemLabelPlural?: string;
  icon?: React.ReactNode;
};

export type RenderTabContentProps = DistinctProps &
  AliasProps &
  LabelProps & {
    activeTab: Tab;
    filteredTables: string[];
    filteredSelectedTables: string[];
    localSelection: string[];
    toggleTable: (table: string) => void;
    setActiveTab: (tab: Tab) => void;
  };

// ─── Empty states ─────────────────────────────────────────────────────────────

const EmptyStateAll = memo(({
  itemLabelPlural = "itens",
  icon = <List className="w-6 h-6 text-gray-400" />,
}: Pick<LabelProps, "itemLabelPlural" | "icon">) => {
  const { t } = useI18n();
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 animate-in fade-in duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm mb-3">
        {icon}
      </div>
      <p className="text-gray-600 font-medium text-center">
        {t("modal.emptyAll") || `Nenhum(a) ${itemLabelPlural.toLowerCase()} encontrado(a)`}
      </p>
    </div>
  );
});
EmptyStateAll.displayName = "EmptyStateAll";

const EmptyStateSelected = memo(({
  setActiveTab,
  itemLabelSingular = "item",
  itemLabelPlural = "itens",
}: { setActiveTab: (tab: Tab) => void } & Pick<LabelProps, "itemLabelSingular" | "itemLabelPlural">) => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 animate-in fade-in duration-300">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm mb-3">
        <Check className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-900 font-bold mb-1 text-center">
        {t("modal.emptySelectedTitle") || `Nenhum(a) ${itemLabelSingular.toLowerCase()} selecionado(a)`}
      </p>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
        {t("modal.emptySelectedDesc") ||
          `Você ainda não selecionou nenhum(a) ${itemLabelSingular.toLowerCase()} para a operação atual.`}
      </p>
      <button
        onClick={() => setActiveTab("all")}
        className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        {t("modal.goToAll") || `Ver todos(as) os(as) ${itemLabelPlural.toLowerCase()}`}
      </button>
    </div>
  );
});
EmptyStateSelected.displayName = "EmptyStateSelected";

const EmptyStateSearch = memo(({ itemLabelPlural = "itens" }: Pick<LabelProps, "itemLabelPlural">) => {
  const { t } = useI18n();
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 animate-in fade-in duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm mb-3">
        <Search className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-600 font-medium text-center max-w-sm">
        {t("modal.emptySearch") ||
          `Nenhum(a) ${itemLabelPlural.toLowerCase()} selecionado(a) corresponde à pesquisa.`}
      </p>
    </div>
  );
});
EmptyStateSearch.displayName = "EmptyStateSearch";

// ─── Lista de itens ───────────────────────────────────────────────────────────

type TableListProps = DistinctProps &
  AliasProps & {
    tables: string[];
    isSelectedTab: boolean;
    localSelection: string[];
    toggleTable: (table: string) => void;
  };

const TableList = memo(({
  tables,
  isSelectedTab,
  localSelection,
  toggleTable,
  tableAliases,
  editingAlias,
  handleAliasChange,
  startEditingAlias,
  finishEditingAlias,
  setEditingAlias,
  removeAlias,
  getAliasError,
  enableAliases = true,
  showDistinctOptions,
  distinctColumns,
  toggleDistinctColumn,
}: TableListProps) => (
  <div className="space-y-2">
    {tables.map((table) => (
      <GenericListItem
        key={table}
        item={table}
        isInSelectedTab={isSelectedTab}
        selected={localSelection}
        aliases={tableAliases}
        editingAlias={editingAlias}
        enableAliases={enableAliases}
        onToggle={toggleTable}
        onAliasChange={handleAliasChange}
        onStartEditing={startEditingAlias}
        onFinishEditing={finishEditingAlias}
        onCancelEditing={() => setEditingAlias(null)}
        onRemoveAlias={removeAlias}
        getAliasError={getAliasError}
        showDistinctOptions={showDistinctOptions}
        distinctColumns={distinctColumns}
        toggleDistinctColumn={toggleDistinctColumn}
      />
    ))}
  </div>
));
TableList.displayName = "TableList";

// ─── Componente principal ─────────────────────────────────────────────────────

export const RenderTabContent = memo(({
  activeTab,
  filteredTables,
  filteredSelectedTables,
  localSelection,
  toggleTable,
  tableAliases,
  editingAlias,
  handleAliasChange,
  startEditingAlias,
  finishEditingAlias,
  setEditingAlias,
  removeAlias,
  getAliasError,
  enableAliases,
  setActiveTab,
  itemLabelSingular,
  itemLabelPlural,
  icon,
  showDistinctOptions,
  distinctColumns,
  toggleDistinctColumn,
}: RenderTabContentProps): JSX.Element => {

  // Props compartilhadas entre abas
  const sharedListProps = {
    localSelection,
    toggleTable,
    tableAliases,
    editingAlias,
    handleAliasChange,
    startEditingAlias,
    finishEditingAlias,
    setEditingAlias,
    removeAlias,
    getAliasError,
    enableAliases,
    showDistinctOptions,
    distinctColumns,
    toggleDistinctColumn,
  };

  // ── Aba "Todas" ──
  if (activeTab === "all") {
    if (filteredTables.length === 0) {
      return <EmptyStateAll itemLabelPlural={itemLabelPlural} icon={icon} />;
    }

    return (
      <TableList
        {...sharedListProps}
        tables={filteredTables}
        isSelectedTab={false}
      />
    );
  }

  // ── Aba "Selecionadas" ──
  if (localSelection.length === 0) {
    return (
      <EmptyStateSelected
        setActiveTab={setActiveTab}
        itemLabelSingular={itemLabelSingular}
        itemLabelPlural={itemLabelPlural}
      />
    );
  }

  if (filteredSelectedTables.length === 0) {
    return <EmptyStateSearch itemLabelPlural={itemLabelPlural} />;
  }

  return (
    <TableList
      {...sharedListProps}
      tables={filteredSelectedTables}
      isSelectedTab={true}
    />
  );
});

RenderTabContent.displayName = "RenderTabContent";

// Alias para compatibilidade com imports antigos
export const renderTabContent = RenderTabContent;