// types/db-structure.ts

// =========================
//       DBEnumField
// =========================
export interface DBEnumFieldBase {
  /**
   * Representa um valor possível de um campo ENUM.
   */
  value: string;
  is_active?: boolean;
}

export interface DBEnumFieldOut extends DBEnumFieldBase {
  field_id: number;
  created_at: string;
}

// =========================
//          DBField
// =========================
export interface DBFieldBase {
  /**
   * Representa uma coluna (campo) pertencente a uma tabela de banco de dados.
   */
  name: string;
  type: string;
  is_nullable?: boolean;
  is_primary_key?: boolean;
  is_unique?: boolean;
  is_auto_increment?: boolean;
  is_foreign_key?: boolean;
  referenced_table?: string | null;
  referenced_field?: string | null;
  referenced_field_id?: number | null;
  fk_on_delete?: string;
  fk_on_update?: string;
  default_value?: string | null;
  comment?: string | null;
  length?: number | null;
  precision?: number | null;
  scale?: number | null;
}

export interface DBFieldCreate extends DBFieldBase {}

export interface DBFieldOut extends DBFieldBase {
  id: number;
  structure_id: number;
  created_at: string;
  updated_at: string;
  enum_values: DBEnumFieldOut[];
}

// =========================
//         DBStructure
// =========================
export interface DBStructureBase {
  /**
   * Representa uma tabela do banco de dados, com seus metadados e campos.
   */
  db_connection_id: number;
  table_name: string;
  schema_name?: string | null;
  description?: string | null;
  is_deleted?: boolean;
}

export interface DBStructureCreate extends DBStructureBase {
  fields: DBFieldCreate[];
}

export interface DBStructureOut extends DBStructureBase {
  id: number;
  created_at: string;
  updated_at: string;
  fields: DBFieldOut[];
}

// =========================
//       API Responses
// =========================
export interface ResponseWrapper<T> {
  success: boolean;
  data?: T;
  message?: string;
}


// =========================
//       Utility Functions
// =========================

export const validateFieldName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('O nome do campo não pode estar vazio.');
  }
  return trimmed;
};

export const validateTableName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('O nome da tabela não pode estar vazio.');
  }
  return trimmed;
};

// Helper para formatar tipos de campo
export const formatFieldType = (field: DBFieldOut): string => {
  let type = field.type;
  
  if (field.length) {
    type += `(${field.length}`;
    if (field.precision) {
      type += `,${field.precision}`;
      if (field.scale) {
        type += `,${field.scale}`;
      }
    }
    type += ')';
  }
  
  return type;
};

// Helper para obter constraints do campo
export const getFieldConstraints = (field: DBFieldOut): string[] => {
  const constraints: string[] = [];
  
  if (field.is_primary_key) constraints.push('PRIMARY KEY');
  if (field.is_unique) constraints.push('UNIQUE');
  if (!field.is_nullable) constraints.push('NOT NULL');
  if (field.is_auto_increment) constraints.push('AUTO INCREMENT');
  if (field.is_foreign_key) constraints.push('FOREIGN KEY');
  
  return constraints;
};

// =========================
//       Components Props
// =========================

export interface DBStructureTableProps {
  structures: DBStructureOut[];
  isLoading?: boolean;
  onStructureClick?: (structure: DBStructureOut) => void;
  onRefresh?: () => void;
}

export interface DBFieldListProps {
  fields: DBFieldOut[];
  showDetails?: boolean;
  onFieldClick?: (field: DBFieldOut) => void;
}

export interface DBStructureFormProps {
  initialData?: DBStructureCreate;
  onSubmit: (data: DBStructureCreate) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// =========================
//       Mock Data (para desenvolvimento)
// =========================

export const mockDBStructure: DBStructureOut = {
  id: 1,
  db_connection_id: 1,
  table_name: 'users',
  schema_name: 'public',
  description: 'Tabela de usuários do sistema',
  is_deleted: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  fields: [
    {
      id: 1,
      structure_id: 1,
      name: 'id',
      type: 'INTEGER',
      is_nullable: false,
      is_primary_key: true,
      is_unique: true,
      is_auto_increment: true,
      is_foreign_key: false,
      default_value: null,
      comment: 'ID único do usuário',
      length: null,
      precision: null,
      scale: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      enum_values: [],
    },
    {
      id: 2,
      structure_id: 1,
      name: 'email',
      type: 'VARCHAR',
      is_nullable: false,
      is_primary_key: false,
      is_unique: true,
      is_auto_increment: false,
      is_foreign_key: false,
      default_value: null,
      comment: 'Email do usuário',
      length: 255,
      precision: null,
      scale: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      enum_values: [],
    },
    {
      id: 3,
      structure_id: 1,
      name: 'status',
      type: 'ENUM',
      is_nullable: false,
      is_primary_key: false,
      is_unique: false,
      is_auto_increment: false,
      is_foreign_key: false,
      default_value: 'active',
      comment: 'Status do usuário',
      length: null,
      precision: null,
      scale: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      enum_values: [
        {
          field_id: 3,
          value: 'active',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          field_id: 3,
          value: 'inactive',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    },
  ],
};