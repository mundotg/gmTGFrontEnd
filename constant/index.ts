import { DatabaseOption, OperadorFiltro, tipo_db_Options as db_column_types } from "@/types";

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
  { value: '=', label: 'Igual a', icon: '=' },
  { value: '!=', label: 'Diferente de', icon: '≠' },
  { value: '>', label: 'Maior que', icon: '>' },
  { value: '<', label: 'Menor que', icon: '<' },
  { value: '>=', label: 'Maior ou igual', icon: '≥' },
  { value: '<=', label: 'Menor ou igual', icon: '≤' },
  { value: 'Antes de', label: 'Antes de', icon: '⏳' },
  { value: 'Depois de', label: 'Depois de', icon: '⏳' },
  { value: 'Contém', label: 'Contém (LIKE)', icon: '∋' },
  { value: 'Não Contém', label: 'Não contém', icon: '∌' },
  { value: 'IN', label: 'Está em (IN)', icon: '∈' },
  { value: 'NOT IN', label: 'Não está em', icon: '∉' },
  { value: 'IS NULL', label: 'É NULL', icon: '∅' },
  { value: 'IS NOT NULL', label: 'Não é NULL', icon: '∄' },
  { value: 'Entre', label: 'Entre', icon: '∈' }
];

export const themeClassesMap = {
  dark: {
    container: 'bg-gray-900 border-gray-700 text-white',
    card: 'bg-gray-800 hover:bg-gray-700 border-gray-600',
    cardSelected: 'bg-blue-900/30 border-blue-600 ring-2 ring-blue-500/50',
    input: 'bg-gray-800 border-gray-600 text-white placeholder-gray-400',
    button: 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600',
    selectButton: 'bg-blue-700 hover:bg-blue-600 text-white border-blue-600',
  },
  light: {
    container: 'bg-white border-gray-200 text-gray-800',
    card: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
    cardSelected: 'bg-blue-50 border-blue-300 ring-2 ring-blue-200',
    input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    button: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300',
    selectButton: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300',
  },
} as const;



export const tiposPorBanco: Record<BancoSuportado, db_column_types[]> = {
  postgresql: [
    'varchar', 'char', 'text', 'boolean', 'integer', 'bigint', 'smallint',
    'decimal', 'numeric', 'real', 'double precision', 'money',
    'date', 'timestamp without time zone', 'timestamp with time zone', 'time',
    'uuid', 'json', 'jsonb', 'bytea',
    'geometry', 'geography', 'point', 'linestring', 'polygon',
    'inet', 'cidr', 'macaddr', 'citext', 'tsvector', 'tsquery', 'vector'
  ],
  mysql: [
    'varchar', 'char', 'text', 'tinytext', 'mediumtext', 'longtext',
    'int', 'integer', 'bigint', 'smallint', 'tinyint', 'mediumint',
    'decimal', 'double', 'float',
    'date', 'datetime', 'timestamp', 'time', 'year',
    'json', 'binary', 'varbinary', 'blob', 'tinyblob', 'mediumblob', 'longblob',
    'enum', 'set', 'geometry', 'point', 'polygon'
  ],
  sqlite: [
    'text', 'integer', 'real', 'numeric', 'blob',
    'date', 'datetime', 'boolean'
  ],
  sqlserver: [
    'varchar', 'nvarchar', 'char', 'nchar', 'text',
    'int', 'bigint', 'smallint', 'tinyint',
    'decimal', 'numeric', 'float', 'real',
    'date', 'datetime', 'datetime2', 'smalldatetime', 'time',
    'bit', 'uniqueidentifier', 'xml',
    'varbinary', 'binary', 'image',
    'money', 'smallmoney'
  ],
  oracle: [
    'varchar2', 'nvarchar2', 'char', 'nchar',
    'clob', 'nclob', 'bfile',
    'number', 'float', 'binary_float', 'binary_double',
    'date', 'timestamp', 'timestamp with time zone', 'timestamp with local time zone',
    'blob', 'raw', 'long', 'boolean', 'xmltype'
  ],
  mongodb: [
    'string', 'int', 'long', 'double', 'decimal',
    'boolean', 'date', 'timestamp',
    'object', 'array', 'null', 'objectId', 'binary', 'regex'
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

export const FILTER_TYPE_MAP: Record<string, db_column_types[]> = {
  varchar: ['varchar', 'char', 'text', 'string'],
  integer: ['int', 'integer', 'bigint', 'smallint', 'decimal', 'numeric', 'double', 'float', 'real'],
  datetime: ['timestamp', 'datetime', 'date', 'time', 'time with time zone', 'timestamp with local time zone']
} as const;


export const Style_tabela_resultados = `
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 2px;
        }
        .scrollbar-track-gray-100::-webkit-scrollbar-track {
          background-color: #f3f4f6;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `

export const CLASSNAME_BUTTON =[`"
    p-2 
    rounded-lg 
    bg-white 
    hover:bg-green-50 
    active:bg-green-100
    border border-green-200 
    hover:border-green-300
    shadow-sm 
    hover:shadow-md 
    active:shadow-sm
    transition-all 
    duration-200 
    ease-in-out
    focus:outline-none 
    focus:ring-2 
    focus:ring-green-500 
    focus:ring-opacity-50
    group
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:hover:bg-white
    disabled:hover:shadow-sm
  `,`
      w-4 h-4 
      text-green-600 
      group-hover:text-green-700
      group-active:text-green-800
      transition-colors 
      duration-200
    `]