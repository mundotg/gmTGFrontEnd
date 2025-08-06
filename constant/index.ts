import { DatabaseOption, OperadorFiltro } from "@/types";

export const databases: DatabaseOption[] = [
  { id: "postgresql", name: "PostgreSQL", icon: "🟣", color: "bg-purple-500", port: "5432" },
  { id: "mysql", name: "MySQL", icon: "🟠", color: "bg-orange-500", port: "3306" },
  { id: "sqlserver", name: "SQL Server", icon: "🔷", color: "bg-blue-500", port: "1433" },
  { id: "oracle", name: "Oracle", icon: "🔴", color: "bg-red-500", port: "1521" },
  { id: "mongodb", name: "MongoDB", icon: "🟢", color: "bg-green-500", port: "27017" },
  { id: "sqlite", name: "SQLite", icon: "⚫", color: "bg-gray-500", port: "" },
];

export type BancoSuportado =
  | 'postgresql'
  | 'mysql'
  | 'sqlite'
  | 'sqlserver'
  | 'oracle'
  | 'mongodb';

  export const operators: OperadorFiltro[] = [
  { value: '=', label: 'Igual a (=)', icon: '=' },
  { value: '!=', label: 'Diferente de (≠)', icon: '≠' },
  { value: '>', label: 'Maior que (>)', icon: '>' },
  { value: '<', label: 'Menor que (<)', icon: '<' },
  { value: '>=', label: 'Maior ou igual (≥)', icon: '≥' },
  { value: '<=', label: 'Menor ou igual (≤)', icon: '≤' },
  { value: 'LIKE', label: 'Contém (LIKE)', icon: '∋' },
  { value: 'NOT LIKE', label: 'Não contém', icon: '∌' },
  { value: 'IN', label: 'Está em (IN)', icon: '∈' },
  { value: 'NOT IN', label: 'Não está em', icon: '∉' }
];


export const tiposPorBanco: Record<BancoSuportado, string[]> = {
  postgresql: [
    'varchar', 'char', 'text', 'boolean',
    'integer', 'bigint', 'smallint', 'decimal', 'numeric', 'real', 'double',
    'date', 'timestamp', 'time', 'json', 'jsonb', 'uuid',
    'bytea', 'enum', 'geometry', 'geography'
  ],
  mysql: [
    'varchar', 'char', 'text', 'tinytext', 'mediumtext', 'longtext',
    'int', 'integer', 'bigint', 'smallint', 'tinyint', 'mediumint',
    'decimal', 'double', 'float',
    'date', 'datetime', 'timestamp', 'time', 'year',
    'json', 'binary', 'varbinary', 'blob', 'enum', 'set',
    'geometry', 'point', 'polygon'
  ],
  sqlite: [
    'text', 'integer', 'real', 'blob', 'numeric',
    'date', 'datetime', 'boolean'
  ],
  sqlserver: [
    'varchar', 'nvarchar', 'char', 'nchar', 'text',
    'int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real',
    'date', 'datetime', 'smalldatetime', 'time',
    'bit', 'uniqueidentifier', 'xml', 'varbinary', 'binary', 'money', 'smallmoney'
  ],
  oracle: [
    'varchar2', 'nvarchar2', 'char', 'nchar', 'clob',
    'number', 'float', 'binary_float', 'binary_double',
    'date', 'timestamp', 'timestamp with time zone', 'timestamp with local time zone',
    'blob', 'raw', 'long', 'boolean', 'xmltype'
  ],
  mongodb: [
    'string', 'int', 'long', 'double', 'decimal',
    'boolean', 'date', 'timestamp', 'object', 'array', 'null',
    'objectId', 'binary', 'regex'
  ]
};
export const FILTER_OPTIONS = [
  { value: "all", label: "Todos os tipos" },
  { value: "primary", label: "Chaves primárias" },
  { value: "nullable", label: "Aceita NULL" },
  { value: "enum", label: "Com ENUM" },
  { value: "varchar", label: "TEXT" },
  { value: "integer", label: "NUMÉRICO" },
  { value: "datetime", label: "DATETIME" }
] as const;

export const FILTER_TYPE_MAP: Record<string, string[]> = {
  varchar: ['varchar', 'char', 'text', 'string'],
  integer: ['int', 'integer', 'bigint', 'smallint', 'decimal', 'numeric', 'double', 'float', 'real'],
  datetime: ['timestamp', 'datetime', 'date', 'time']
} as const;

export const tipo_db_Options = [
  // Texto
  'varchar',
  'char',
  'text',
  'string',
  'nchar',
  'nvarchar',

  // Numéricos
  'int',
  'integer',
  'bigint',
  'smallint',
  'tinyint',
  'mediumint',
  'decimal',
  'numeric',
  'double',
  'float',
  'real',
  'money',
  'smallmoney',

  // Booleano
  'boolean',

  // Datas e Horas
  'date',
  'datetime',
  'timestamp',
  'time',
  'year',

  // Identificadores
  'uuid',

  // Estruturados / Avançados
  'json',
  'jsonb',
  'object',
  'xml',

  // Binários
  'blob',
  'bytea',
  'binary',
  'varbinary',

  // Enumerações
  'enum',

  // Geoespaciais (PostGIS / GIS)
  'geometry',
  'geography',
  'point',
  'linestring',
  'polygon'
];
