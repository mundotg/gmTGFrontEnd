import { AdvancedJoinOption, JoinCondition, JoinType} from "@/types";

// Tipo para o componente JoinSelect (assumindo sua interface)
export interface JoinSelectComponent {
  className?: string;
  buttonClassName?: string;
  value?: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}
// Props principais do JoinTableItem
export interface JoinTableItemProps {
  tableName: string;
  index: number;
  // table: MetadataTableResponse;
  selectedJoin: AdvancedJoinOption | undefined;
  conditions: JoinCondition[];
  isExpanded: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  joinOrderLength: number;
  joinTypes: JoinType[];
  operators: string[];
  allColumnOptions: AllColumnOptions_type[];

  // Funções de drag & drop
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;

  // Funções de manipulação
  handleJoinTypeChange: (tableName: string, type: JoinType) => void;
  toggleExpanded: (tableName: string) => void;
  moveTable: (index: number, direction: "up" | "down") => void;
  removeJoinTable: (tableName: string) => void;

  // Funções de condições
  addCondition: (tableName: string) => void;
  updateCondition: (tableName: string, id: string, update: Partial<JoinCondition>) => void;
  removeCondition: (tableName: string, id: string) => void;

  // Componente JoinSelect
}
export type LogicalOperators = "AND" | "OR";
// Props para o componente JoinConditions
export interface JoinConditionsProps {
  tableName: string;
  conditions: JoinCondition[];
  operators: string[];
  allColumnOptions: { value: string; label: string }[];
  addCondition: (tableName: string) => void;
  updateCondition: (tableName: string, id: string, update: Partial<JoinCondition>) => void;
  removeCondition: (tableName: string, id: string) => void;
}

// Props para o componente JoinConditionRow
export interface JoinConditionRowProps {
  condition: JoinCondition;
  condIndex: number;
  tableName: string;
  conditions: JoinCondition[];
  operators: string[];
  allColumnOptions: AllColumnOptions_type[];
  updateCondition: (tableName: string, id: string, update: Partial<JoinCondition>) => void;
  removeCondition: (tableName: string, id: string) => void;
}

export interface AllColumnOptions_type{ value: string; label: string, 
  // index?: number, type?:tipo_db_Options 
}