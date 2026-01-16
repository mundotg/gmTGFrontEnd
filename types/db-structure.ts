// types/database.ts

import { Dbtype, tipo_db_Options } from ".";

// Tipos base para campos enum
export type DbType =
  | "postgresql"
  | "mysql"
  | "sqlserver"
  | "sqlite"
  | "oracle"
  | "mariadb";

export type ForeignKeyAction =
  | "CASCADE"
  | "SET NULL"
  | "SET DEFAULT"
  | "RESTRICT"
  | "NO ACTION";

export type ConnectionStatus = 
  | "connected"
  | "disconnected"
  | "error"
  | "testing";

export type SSLMode =
  | "disable"
  | "allow"
  | "prefer"
  | "require"
  | "verify-ca"
  | "verify-full";

// Valores padrão para reutilização
export const DEFAULT_DB_VALUES = {
  PORT: {
    postgresql: 5432,
    mysql: 3306,
    sqlserver: 1433,
    oracle: 1521,
    mariadb: 3306,
    sqlite: 0
  },
  SSL_MODES: {
    postgresql: ["disable", "allow", "prefer", "require", "verify-ca", "verify-full"] as SSLMode[],
    mysql: ["disabled", "preferred", "required", "verify_ca", "verify_identity"] as string[],
    sqlserver: ["true", "false"] as string[],
    oracle: [] as string[],
    mariadb: ["disabled", "preferred", "required", "verify_ca", "verify_identity"] as string[],
    sqlite: [] as string[]
  },
  FOREIGN_KEY_ACTIONS: ["CASCADE", "SET NULL", "SET DEFAULT", "RESTRICT", "NO ACTION"] as ForeignKeyAction[],
  STATUS: {
    CONNECTED: "connected",
    DISCONNECTED: "disconnected",
    ERROR: "error",
    TESTING: "testing"
  } as const
} as const;

// Interface para campos do banco com valores padrão
export interface DBField {
  id: number;
  name: string;
  type: tipo_db_Options;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_unique: boolean;
  is_foreign_key: boolean;
  is_auto_increment: boolean;
  default_value: string | null;
  length: number | null;
  precision: number | null;
  scale: number | null;
  comment: string;
  enum_values: string[];

  // Foreign key relations
  referenced_table: string | null;
  referenced_field: string | null;
  referenced_field_id: number | null;
  fk_on_delete: ForeignKeyAction | null;
  fk_on_update: ForeignKeyAction | null;

  // Metadata
  structure_id: number;
  created_at: string;
  updated_at: string;
}

// Factory para criar campos com valores padrão
export const createDefaultDBField = (overrides?: Partial<DBField>): DBField => ({
  id: 0,
  name: "",
  type: "varchar" as tipo_db_Options,
  is_nullable: true,
  is_primary_key: false,
  is_unique: false,
  is_foreign_key: false,
  is_auto_increment: false,
  default_value: null,
  length: null,
  precision: null,
  scale: null,
  comment: "",
  enum_values: [],
  referenced_table: null,
  referenced_field: null,
  referenced_field_id: null,
  fk_on_delete: null,
  fk_on_update: null,
  structure_id: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Interface para estruturas/tabelas
export interface DBStructure {
  id: number;
  db_connection_id: number;
  table_name: string;
  schema_name?: string;
  description?: string;
  is_deleted?: boolean;
  fields?: DBField[];
  created_at?: string;
  updated_at?: string;
}

// Factory para criar estrutura com valores padrão
export const createDefaultDBStructure = (overrides?: Partial<DBStructure>): DBStructure => ({
  id: 0,
  db_connection_id: 0,
  table_name: "",
  schema_name: "public",
  description: "",
  is_deleted: false,
  fields: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Interface principal para conexões
export interface DBConnection {
  type: Dbtype;
  trustServerCertificate: string;
  host: string;
  status: ConnectionStatus;
  port: number;
  is_encrypted: boolean;
  username: string;
  created_at: string;
  password: string;
  updated_at: string;
  user_id: number;
  database_name: string;
  id: number;
  sslmode: SSLMode | string;
  name: string;
  service: string;
  structures?: DBStructure[];
}

export interface DBStructureOut {
  id: number;
  table_name: string;
  type: DbType;
}

// Factory para criar conexão com valores padrão
export const createDefaultDBConnection = (overrides?: Partial<DBConnection>): DBConnection => ({
  type: "postgresql",
  trustServerCertificate: "false",
  host: "localhost",
  status: "disconnected",
  port: DEFAULT_DB_VALUES.PORT.postgresql,
  is_encrypted: false,
  username: "",
  created_at: new Date().toISOString(),
  password: "",
  updated_at: new Date().toISOString(),
  user_id: 0,
  database_name: "",
  id: 0,
  sslmode: "prefer",
  name: "",
  service: "",
  structures: [],
  ...overrides
});

// Helper para obter porta padrão baseada no tipo
export const getDefaultPort = (dbType: DbType): number => {
  return DEFAULT_DB_VALUES.PORT[dbType] || 0;
};

// Helper para obter modos SSL disponíveis
export const getAvailableSSLModes = (dbType: DbType): string[] => {
  return DEFAULT_DB_VALUES.SSL_MODES[dbType] || [];
};

// Tipos utilitários
export type DBConnectionWithStructures = DBConnection & {
  structures: DBStructure[];
};

export type TableWithFields = DBStructure & {
  connection_name: string;
  connection_type: DbType;
};

// Tipos para formulários e operações
export interface CreateDBConnectionRequest {
  name: string;
  type: DbType;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
  sslmode?: SSLMode | string;
  trustServerCertificate?: string;
  service?: string;
  is_encrypted?: boolean;
}

// Factory para criar request com valores padrão
export const createDefaultConnectionRequest = (overrides?: Partial<CreateDBConnectionRequest>): CreateDBConnectionRequest => ({
  name: "",
  type: "postgresql",
  host: "localhost",
  port: DEFAULT_DB_VALUES.PORT.postgresql,
  database_name: "",
  username: "",
  password: "",
  sslmode: "prefer",
  trustServerCertificate: "false",
  service: "",
  is_encrypted: false,
  ...overrides
});

export interface UpdateDBConnectionRequest extends Partial<CreateDBConnectionRequest> {
  id: number;
}

// Tipo para resposta de teste de conexão
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    version?: string;
    tables_count?: number;
    connection_time?: number;
    database_size?: string;
    max_connections?: number;
    active_connections?: number;
  };
}

// Factory para resultado de teste
export const createDefaultTestResult = (overrides?: Partial<ConnectionTestResult>): ConnectionTestResult => ({
  success: false,
  message: "",
  details: undefined,
  ...overrides
});

// Tipos para operações de transferência de dados
export interface DataTransferRequest {
  source_connection_id: number;
  target_connection_id: number;
  tables: string[];
  options?: {
    truncate_target?: boolean;
    create_tables?: boolean;
    include_data?: boolean;
    include_indexes?: boolean;
    batch_size?: number;
  };
}

export const createDefaultDataTransferRequest = (overrides?: Partial<DataTransferRequest>): DataTransferRequest => ({
  source_connection_id: 0,
  target_connection_id: 0,
  tables: [],
  options: {
    truncate_target: true,
    create_tables: true,
    include_data: true,
    include_indexes: true,
    batch_size: 1000
  },
  ...overrides
});

// Tipo para estatísticas de conexão
export interface ConnectionStats {
  total_tables: number;
  total_rows: number;
  database_size: string;
  last_backup: string | null;
  connection_uptime: number;
}

// Utilitários de validação
export const isValidDbType = (type: string): type is DbType => {
  return ["postgresql", "mysql", "sqlserver", "sqlite", "oracle", "mariadb"].includes(type);
};

export const isValidSSLMode = (mode: string, dbType: DbType): boolean => {
  const availableModes = getAvailableSSLModes(dbType);
  return availableModes.includes(mode);
};