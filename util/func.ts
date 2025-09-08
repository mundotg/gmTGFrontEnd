import { DatabaseType, DisplayFormat, ForeignKeyOption, MetadataTableResponse } from "@/types";

export const findIdentifierField = (tableName: string, columnsInfo: MetadataTableResponse[]) => {
  const table = columnsInfo.find(col => col.table_name === tableName);
  if (!table) return undefined;
  return (
    table.colunas.find(c => c.is_primary_key)?.nome ||
    table.colunas.find(c => c.is_unique)?.nome ||
    table.colunas.find(c => !c.is_nullable)?.nome ||
    table.colunas[0]?.nome
  );
};

export function mapToForeignKeyOptions(
  preview: Record<string, any>[] = [],
  referencedField: string
): ForeignKeyOption[] {
  if (!Array.isArray(preview)) return [];

  return preview.map((row) => {
    const id = String(row?.[referencedField] ?? "");

    // pega todas as chaves, exceto o campo usado como ID
    const otherValues = Object.keys(row ?? {})
      .filter((key) => key !== referencedField)
      .map((key) => String(row[key] ?? "").trim())
      .filter((val) => val !== "");

    // pega só 1/3 dos campos (arredondando pra baixo)
    const maxValues = Math.floor(otherValues.length / 3) || otherValues.length;

    return {
      id,
      dados: otherValues.slice(0, maxValues).join(" | "),
    };
  });
}


const pad = (n: number) => String(n).padStart(2, '0');

export const formatDisplay = (date: Date, format: DisplayFormat): string => {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());

  switch (format) {
    case 'DD/MM/YYYY': return `${d}/${m}/${y}`;
    case 'MM/DD/YYYY': return `${m}/${d}/${y}`;
    case 'YYYY-MM-DD': return `${y}-${m}-${d}`;
    case 'DD-MM-YYYY': return `${d}-${m}-${y}`;
    case 'DD.MM.YYYY': return `${d}.${m}.${y}`;
    default: return `${y}-${m}-${d}`;
  }
};

export const getHTMLInputType = (
  dbType: DatabaseType
): 'text' | 'date' | 'datetime-local' | 'time' => {
  switch (dbType) {
    case DatabaseType.DATETIME:
    case DatabaseType.TIMESTAMP:
      return 'datetime-local';
    case DatabaseType.DATE:
      return 'date';
    case DatabaseType.TIME:
      return 'time';
    case DatabaseType.VARCHAR:
    case DatabaseType.TEXT:
      return 'text';
    default:
      return 'text';
  }
};

export const getDatabaseFormattedValue = (
  value: string,
  dbType: DatabaseType
): string | number | null => {
  try {
    // VARCHAR/TEXT → retorna direto
    if (dbType === DatabaseType.VARCHAR || dbType === DatabaseType.TEXT) {
      return value;
    }

    // TIMESTAMP pode ser epoch
    if (dbType === DatabaseType.TIMESTAMP && /^\d+$/.test(value)) {
      const epoch = Number(value);
      return isNaN(epoch) ? null : new Date(epoch * 1000).toISOString();
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    switch (dbType) {
      case DatabaseType.DATE:
        return date.toISOString().slice(0, 10); // YYYY-MM-DD
      case DatabaseType.DATETIME:
        return date.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:mm:ss
      case DatabaseType.TIMESTAMP:
        return Math.floor(date.getTime() / 1000); // Unix epoch
      case DatabaseType.TIME:
        return date.toISOString().slice(11, 19); // HH:mm:ss
      case DatabaseType.TIMESTAMP_WITH_TZ:
        return date.toISOString(); // UTC ISO completo
      case DatabaseType.TIMESTAMP_WITH_LOCAL_TZ:
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
               `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      default:
        return value;
    }
  } catch {
    return null;
  }
};
