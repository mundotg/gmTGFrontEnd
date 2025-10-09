import { Check, Database, Search } from "lucide-react";
import { TableItem } from "./TableItem";
import { JSX, memo } from "react";

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

// Componentes de estado vazio memoizados para performance
const EmptyStateAll = memo(({  }: { setActiveTab: (tab: "all" | "selected") => void }) => (
  <div className="text-center py-8 text-gray-500">
    <Database className="w-12 h-12 mx-auto mb-2 text-gray-300" />
    <p>Nenhuma tabela encontrada {}</p>
  </div>
));

EmptyStateAll.displayName = 'EmptyStateAll';

const EmptyStateSelected = memo(({ setActiveTab }: { setActiveTab: (tab: "all" | "selected") => void }) => (
  <div className="text-center py-8 text-gray-500">
    <Check className="w-12 h-12 mx-auto mb-2 text-gray-300" />
    <p>Nenhuma tabela selecionada</p>
    <button
      onClick={() => setActiveTab("all")}
      className="mt-2 text-blue-600 hover:text-blue-700 text-sm transition-colors"
    >
      Ir para aba &quot;Todas as Tabelas&quot;
    </button>
  </div>
));

EmptyStateSelected.displayName = 'EmptyStateSelected';

const EmptyStateSearch = memo(() => (
  <div className="text-center py-8 text-gray-500">
    <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
    <p>Nenhuma tabela selecionada encontrada na pesquisa</p>
  </div>
));

EmptyStateSearch.displayName = 'EmptyStateSearch';

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
  getAliasError 
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

TableList.displayName = 'TableList';

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
      return <EmptyStateAll setActiveTab={setActiveTab} />;
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

RenderTabContent.displayName = 'RenderTabContent';

// Alias para manter compatibilidade com código existente
export const renderTabContent = RenderTabContent;