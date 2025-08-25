import { FILTER_OPTIONS } from "@/constant";

export type DatabaseOption = {
  id: string;
  name: string;
  icon: string;
  color: string;
  port: string;
};

export interface QueryBuilderProps {
  columns: MetadataTableResponse[];
  table_list: string[];
  onExecuteQuery: (conditions: QueryPayload) => Promise<void>;
  title?: string;
  isExecuting?: boolean;
  maxConditions?: number;
  showLogicalOperators?: boolean;
  className?: string;
  select: string[];
  setSelect: (select: string[]) => void;
}

export interface DatabaseMetadata {
  connectionName: string;
  databaseName: string;
  serverVersion: string;
  tableCount: number;
  viewCount: number;
  procedureCount: number;
  functionCount: number;
  triggerCount: number;
  indexCount: number;
  tableNames: { name: string; rowcount: number }[];
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
  nameColumns: string[];
  tableName?: string[]; // opcional, usado para identificar a tabela
};

export type tipo_db_Options =
  'char' |
  'text' |
  'string' |
  'nchar' |
  'nvarchar' |
  'int' |
  'integer' |
  'bigint' |
  'smallint' |
  'tinyint' |
  'mediumint' |
  'decimal' |
  'numeric' |
  'double' |
  'float' |
  'real' |
  'money' |
  'smallmoney' |
  'boolean' |
  'date' |
  'datetime' |
  'timestamp' |
  'time' |
  'year' |
  'uuid' |
  'json' |
  'jsonb' |
  'object' |
  'xml' |
  'blob' |
  'bytea' |
  'binary' |
  'varbinary' |
  'enum' |
  'geometry' |
  'geography' |
  'point' |
  'linestring' |
  'polygon' |
  'varchar'


export enum DatabaseType {
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  TIMESTAMP = 'TIMESTAMP',
  VARCHAR = 'VARCHAR',
  TEXT = 'TEXT',
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
  operator: string;         // Operador (deve estar em operators.value)
  value: string;   // Valor inserido pelo usuário
  logicalOperator?: 'AND' | 'OR'; // Para combinar com outras condições
  column_type: tipo_db_Options;
  value_type?: 'string' | 'number' | 'date' | 'boolean'; // opcional
}

export type JoinType = "INNER JOIN" | "LEFT JOIN" | "RIGHT JOIN" | "FULL JOIN";

export interface JoinOption {
  table: string;
  type: JoinType;
  on?: string; // Ex: 'users.id = pedidos.usuario_id'
}

export interface WhereCondition {
  column: string;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN"; // pode expandir
  value: string | number | boolean | (string | number)[];
}

export interface OrderByOption {
  column: string;
  direction: "ASC" | "DESC";
}

export type DistinctList = {
  useDistinct: boolean;
  distinct_columns: string[];
}

export interface QueryPayload {
  baseTable: string;
  joins: JoinOption[];
  select: string[];
  table_list: string[];
  where: CondicaoFiltro[];
  distinct?: DistinctList;
  orderBy?: OrderByOption;
  limit?: number;
  offset?: number;
  isCountQuery?: boolean;
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
  preview: any[];
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

export interface TableColumnsDisplayProps {
  tableName: string;
  columns?: MetadataTableResponse[];
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

export interface CampoDetalhado {
  nome: string;
  tipo: tipo_db_Options;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_ForeignKey?: boolean;
  is_auto_increment?: boolean;
  referenced_table?: string | null;
  field_references?: string | null;
  is_unique: boolean;
  default?: string | null;
  comentario?: string | null;
  length?: number | null;
  enum_valores_encontrados?: string[];
  enum_valores_adicionados?: string[];
}

export interface EditedField {
  value: string;
  tableName: string;
  hasChanged: boolean;
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
