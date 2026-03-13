
import { FILTER_OPTIONS } from "@/constant";

export type DatabaseOption = {
  id: string;
  name: string;
  icon: string;
  color: string;
  port: string;
};

export type FieldDDLRequestPayload = {
  connection_id?: number;         // backend pode ignorar, mas é útil
  table_name: string;
  schema_name?: string | null;
  name: string;
  type: string;
  is_nullable?: boolean;
  is_unique?: boolean;
  is_primary_key?: boolean;
  is_auto_increment?: boolean;
  default_value?: string | null;
  comment?: string | null;
  length?: number | null;
  precision?: number | null;
  scale?: number | null;
  is_foreign_key?: boolean;
  referenced_table?: string | null;
  referenced_field?: string | null;
  fk_on_delete?: string | null;
  fk_on_update?: string | null;
  original_name?: string | null;
};

export interface QueryBuilderProps {
  columns: MetadataTableResponse[];
  table_list: string[];
  setAliasTables: (aliasTables: Record<string, string>) => void;
  aliasTables: Record<string, string>;
  onChange?: (conditions: QueryPayload) => void;
  onExecuteQuery: (conditions: QueryPayload) => Promise<void>;
  setTable_list: (selectedTables: string[]) => void;
  title?: string;
  isExecuting?: boolean;
  maxConditions?: number;
  showLogicalOperators?: boolean;
  className?: string;
  select: string[];
  removerCacheLocalStorage?: () => void;
  setSelect: (select: string[]) => void;
}

// Tipagem para tabela com contagem
export interface TableInfo {
  name: string;
  rowcount: number;
}


export interface TableInfoCreate {
  name: string;
  schema?: string;
  comment?: string;

  // Advanced (opcional)
  engine?: string; // mysql/mariadb
  charset?: string; // mysql/mariadb
  collation?: string; // mysql/mariadb
  temporary?: boolean; // alguns bancos suportam
}
export interface DatabaseMetadata {
  connection_name: string;
  database_name: string;
  server_version: string;
  table_count: number;
  view_count: number;
  procedure_count: number;
  function_count: number;
  trigger_count: number;
  index_count: number;
  table_names: TableInfo[];
}


export interface LinhaCompletaResponse {
  success: boolean;
  data?: {
    __root__: Record<string, any>;
  };
  error?: string;
}

export type SelectedRow = {
  index?: number; // opcional, usado para identificar a linha selecionada
  row: Record<string, any> | null;
  orderBy?: OrderByOption | MultiOrderByOption;
  nameColumns: string[];
  tableName?: string[]; // opcional, usado para identificar a tabela
};

export type tipo_db_Options =
  | 'char'
  | 'varchar'
  | 'nchar'
  | 'nvarchar'
  | 'text'
  | 'tinytext'
  | 'mediumtext'
  | 'longtext'
  | 'string'
  | 'int'
  | 'integer'
  | 'smallint'
  | 'tinyint'
  | 'mediumint'
  | 'bigint'
  | 'serial'
  | 'bigserial'
  | 'smallserial'
  | 'decimal'
  | 'numeric'
  | 'float'
  | 'double'
  | 'real'
  | 'money'
  | 'smallmoney'
  | 'boolean'
  | 'bit'
  | 'date'
  | 'datetime'
  | 'datetime2'
  | 'smalldatetime'
  | 'timestamp'
  | 'time'
  | 'year'
  | 'interval'
  | 'uuid'
  | 'uniqueidentifier'
  | 'json'
  | 'jsonb'
  | 'object'
  | 'xml'
  | 'clob'
  | 'nclob'
  | 'blob'
  | 'tinyblob'
  | 'mediumblob'
  | 'longblob'
  | 'bytea'
  | 'binary'
  | 'varbinary'
  | 'image'
  | 'enum'
  | 'set'
  | 'geometry'
  | 'geography'
  | 'point'
  | 'linestring'
  | 'polygon'
  | 'inet'
  | 'cidr'
  | 'macaddr'
  | 'tsvector'
  | 'tsquery'
  | 'oid'
  | 'bfile'
  | 'citext'
  | 'timestamp with time zone'
  | 'nvarchar2'
  | 'varchar2'
  | 'number'
  | 'raw'
  | 'long'
  | 'binary_float'
  | 'binary_double'
  | 'timestamp with local time zone'
  | 'xmltype'
  | 'null'
  | 'array'
  | 'regex'
  | 'objectId'
  | 'dec'
  | 'double precision'
  | 'float4' | 'float8' | 'serial8' | 'mediumserial' | 'vector'
  | 'timestamp without time zone' | 'time with time zone' | 'time without time zone'





export enum DatabaseType {
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  TIMESTAMP = 'TIMESTAMP',
  VARCHAR = 'VARCHAR',
  TEXT = 'TEXT',
  TIME = 'time',
  TIMESTAMP_WITH_TZ = 'time with time zone',
  TIMESTAMP_WITH_LOCAL_TZ = 'timestamp with local time zone'
}

export type DisplayFormat =
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'YYYY-MM-DD'
  | 'DD-MM-YYYY'
  | 'DD.MM.YYYY';

export interface CondicaoFiltro {
  table_name_fil: string
  column: string;           // Nome da coluna
  operator: OperatorType;         // Operador (ex: '=', 'LIKE', 'IN'...)
  value: string;   // Valor inserido pelo usuário~
  value2?: string;  // Segundo valor para condições "Entre" e "Não Entre"
  logicalOperator?: 'AND' | 'OR'; // Para combinar com outras condições
  column_type: tipo_db_Options;
  value_type?: 'string' | 'number' | 'date' | 'boolean'; // opcional
  length?: number; // opcional
  is_nullable?: boolean; // opcional
}

export type JoinType = "INNER JOIN" | "LEFT JOIN" | "RIGHT JOIN" | "FULL JOIN";


// Condição individual do JOIN
export interface JoinConditionPayload {
  table?: string;
  leftColumn: string;
  operator: string;
  rightColumn: string;
  valueColumnType?: tipo_db_Options;
  rightValue?: string; // Para valores literais
  useValue: boolean; // Se true, usa rightValue em vez de rightColumn
  logicalOperator?: "AND" | "OR"; // Operador para próxima condição
  caseSensitive?: boolean //# se aplicável
  collation?: string        // # ex: "utf8_general_ci"
  functionLeft?: string     // # ex: UPPER, LOWER, TRIM
  functionRight?: string
}
export interface JoinCondition {
  id: string;
  table?: string;
  leftColumn: string;
  // leftColumnType?: tipo_db_Options;
  enumValores?: string[]
  operator: string;
  rightColumn: string;
  valueColumnType?: tipo_db_Options;
  rightValue?: string; // Para valores literais
  useValue: boolean; // Se true, usa rightValue em vez de rightColumn
  logicalOperator?: "AND" | "OR"; // Operador para próxima condição
  caseSensitive?: boolean //# se aplicável
  collation?: string        // # ex: "utf8_general_ci"
  functionLeft?: string     // # ex: UPPER, LOWER, TRIM
  functionRight?: string
}

// Opção de JOIN avançada com múltiplas condições
export interface AdvancedJoinOption {
  conditions: JoinCondition[];
  alias?: string;
  typeJoin: JoinType;
  groupStart?: { initIndex: number, is: boolean }[]; // Para suporte futuro a parênteses
  groupEnd?: { endIndex: number, is: boolean }[];
}


export interface AdvancedJoinOptionPayload {
  conditions: JoinConditionPayload[];
  alias?: string;
  typeJoin: JoinType;
  groupStart?: { initIndex: number, is: boolean }[]; // Para suporte futuro a parênteses
  groupEnd?: { endIndex: number, is: boolean }[];
}

export interface JoinOption {
  table: string;
  type: JoinType;
  on?: string; // Ex: 'users.id = pedidos.usuario_id'
}

export type OperatorType = "=" | "!=" | ">" | "<" | ">=" | "<=" | "IN" | 'Entre' | "Não Contém" | "Depois de" | 'Antes de' | 'Contém' | 'NOT IN' | "Não Entre" | "IS NULL" | "IS NOT NULL"; // pode expandir


export interface OrderByOption {
  column: string;
  direction: "ASC" | "DESC";
}



// Tipo para múltiplas opções de ordenação (array)
export type MultiOrderByOption = OrderByOption[];

// Se você quiser manter compatibilidade com o código antigo,
// pode usar um tipo union:
export type OrderByValue = string | OrderByOption | MultiOrderByOption;

export type DistinctList = {
  useDistinct: boolean;
  distinct_columns: string[];
}

export interface QueryPayload {
  baseTable: string;
  joins: Record<string, AdvancedJoinOptionPayload>;
  aliaisTables: Record<string, string>;
  table_list: string[];
  where: CondicaoFiltro[];
  distinct?: DistinctList;
  orderBy?: OrderByOption | MultiOrderByOption;
  limit?: number;
  offset?: number;
  isCountQuery?: boolean;
  select? : string[];
}



export interface RowDetailsModalCreateProps {
  isOpen: boolean;
  onClose: () => void;
  informacaosOftables: MetadataTableResponse[];
  onSave?: (updatedRow: EditedFieldForQuery) => void;
}


export interface ForeignKeyOption {
  id: string;
  dados: string;
}


export type QueryResultType = {
  success: boolean;
  query: string;
  params: {
    [key: string]: number | string | boolean;
  };
  totalResults: number | null;
  duration_ms: number;
  columns: string[];
  tabela_coluna?: Record<string, CampoDetalhado[]>
  preview: Record<string, any>[];
  QueryPayload?: QueryPayload;
};

export type QueryCountResultType = {
  success: boolean;
  query: string;
  count: number;
  duration_ms: number;
};



export type ConnectionLog = {
  id: string;
  connection: string;
  details?: any;
  action?: string;
  timestamp?: string; // ou `Date` se preferir trabalhar com objetos Date
  status: "success" | "error" | "warning" | "info";
};

export interface OperadorFiltro {
  value: string;   // Ex: '=', 'LIKE', 'IN'...
  label: string;   // Ex: 'Igual a (=)'
  icon: string;    // Ex: '=', '∋', '∈'
}

export type Dbtype = "postgresql" | "mysql" | "sqlserver" | "oracle" | "mongodb" | "sqlite" | "";

export type SavedConnection = {
  id: string;
  name: string;
  type: Dbtype;
  host: string;
  database: string;
  last_used: string; // ou Date se for usar como objeto Date
  status: "connected" | "disconnected" | "error";
};
export type ConnectionFormData = {
  name: string;
  host: string;
  port: string;
  type: Dbtype; // "" para valor inicial
  database: string;
  username: string;
  password: string;
  service?: string;
  sslmode?: string;
  trustServerCertificate?: string
};



export type FilterType = typeof FILTER_OPTIONS[number]['value'];
export interface NamecachesValue  {
    _thema: string,
    _modal_Create_Open: string,
    _modal_Edit_Open: string,
    consulta_showFilterColunas: string,
    consulta_showSortColunas: string
  }

export const defaultNameCachesValue: NamecachesValue = {
  _thema: "_thema",
  _modal_Create_Open: "_modal_Create_Open",
  _modal_Edit_Open: "_modal_Edit_Open",
  consulta_showFilterColunas: "_consulta_showFilterColunas",
  consulta_showSortColunas: "_consulta_showSortColunas"
};
export interface TableColumnsDisplayProps {
  tableNames: string;
  names_caches_value: NamecachesValue;
  tabelaExistenteNaDB: string[];
  columns?: MetadataTableResponse[];
  setColumns?: React.Dispatch<React.SetStateAction<MetadataTableResponse[]>>;
  className?: string;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
  error?: string | null;
  theme?: 'light' | 'dark';
  showSearch?: boolean;
  showFilter?: boolean;
  showSort?: boolean;
  showExport?: boolean;
  itemsPerPage?: number;
  select: string[];
  setSelect: (select: string[]) => void;
  onColumnClick?: (column: CampoDetalhado) => void;
}



export interface EditedField {
  value: string;
  tableName: string;
  hasChanged: boolean;
  type_column: string;
}


export type EditedFieldForQuery = {
  [tableName: string]: {
    [columnName: string]: {
      value: string;
      type_column: string;
    };
  };
};


export type Tables_primary_keys_values = Record<string, Record<string, string>>;

export interface AnalizeDataType {
  overview: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    overdueProjects: number;
    totalTasks: number;
    completedTasks: number;
    teamMembers: number;
  };
  projectProgress: {
    name: string;
    progress: number;
    tasks: number;
    completed: number;
  }[];
  taskStatus: {
    name: string;
    value: number;
  }[];
  teamPerformance: {
    name: string;
    tasks: number;
    completed: number;
    efficiency: number;
  }[];
  weeklyActivity: {
    week: string;
    tasks: number;
    completed: number;
  }[];
  projectTypes: {
    name: string;
    value: number;
  }[];
  recentActivity: {
    id: number;
    user: string;
    action: string;
    project: string;
    time: string;
  }[];
}

export interface CampoDetalhado {
  nome: string;
  tipo: tipo_db_Options;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_foreign_key?: boolean;
  is_auto_increment?: boolean;
  referenced_table?: string | null;
  field_references?: string | null;
  is_unique: boolean;
  default?: string | null;
  comentario?: string | null;
  length?: number | null;
  enum_valores_encontrados?: string[];
  on_delete_action?: string;
  on_update_action?: string;
}

export interface MetadataTableResponse {
  message: string;
  executado_em: string; // ou `Date` se você for converter depois
  connection_id: number;
  schema_name: string;
  table_name: string;
  total_colunas: number;
  colunas: CampoDetalhado[];
}







