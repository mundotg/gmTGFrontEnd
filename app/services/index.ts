import { operators } from "@/constant";
import { CampoDetalhado, DatabaseType, OperadorFiltro } from "@/types";

// Função para exportar dados
export const exportToCSV = (columns: CampoDetalhado[], tableName: string) => {
  const headers = ['Nome', 'Tipo', 'Chave Primária', 'Aceita NULL', 'Valor Padrão', 'Valores ENUM'];
  const rows = columns.map(col => [
    col.nome,
    col.tipo,
    col.is_primary_key ? 'Sim' : 'Não',
    col.is_nullable ? 'Sim' : 'Não',
    col.default || '',
    col.enum_valores_encontrados?.join(', ') || ''
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${tableName}_colunas.csv`;
  link.click();
};


export function extrairTipoBase(tipo: string):string  {
  return tipo.split('(')[0].trim().toLowerCase() ;
}

export function mapColumnTypeToDbType(columnType?: string): DatabaseType {
  const type = columnType?.toLowerCase() || '';

  if (type.includes('timestamp')) return DatabaseType.TIMESTAMP;
  if (type.includes('datetime')) return DatabaseType.DATETIME;
  if (type.includes('date')) return DatabaseType.DATE;
  if (type.includes('varchar') || type.includes('char')) return DatabaseType.VARCHAR;
  if (type.includes('text')) return DatabaseType.TEXT;

  return DatabaseType.DATE; // fallback padrão
}

export function getOperatorsForType(rawType: string, is_nullable?: boolean): OperadorFiltro[] {
  const type = rawType.toLowerCase();

  const isText = [
    'varchar', 'char', 'text', 'string', 'nchar', 'nvarchar',
    'tinytext', 'mediumtext', 'longtext'
  ].some(t => type.includes(t));

  const isNumber = [
    'int', 'integer', 'bigint', 'smallint', 'tinyint', 'mediumint',
    'decimal', 'numeric', 'double', 'float', 'real', 'money', 'smallmoney'
  ].some(t => type.includes(t));

  const isDate = ['date', 'datetime', 'timestamp', 'time', 'year'].some(t => type.includes(t));

  const isBoolean = ['boolean', 'bit', 'tinyint(1)'].some(t => type.includes(t));

  const isEnum = type.includes('enum');

   function addNullableOps(ops: OperadorFiltro[]): OperadorFiltro[] {
    if (is_nullable) {
      return [...ops, ...operators.filter(op => ['IS NULL','IS NOT NULL'].includes(op.value))];
    }
    return ops;
  }

  // console.log(isNumber,isText,isDate,isBoolean,isEnum)

  if (isBoolean) {
    return addNullableOps(operators.filter(op => ['=', '!='].includes(op.value)));
  }

  if (isNumber) {
    return addNullableOps(operators.filter(op =>
      ['=', '!=', '>', '<', '>=', '<=', 'Não Contém', 'Contém', 'IN', 'NOT IN','Entre'].includes(op.value)
    ));
  }

  if (isDate) {
    return addNullableOps(operators.filter(op =>
      ['=', '!=', '>=', '<=','Não Contém', 'Contém', 'Antes de', 'Depois de', 'Entre','IN', 'NOT IN'].includes(op.value)
    ));
  }

  if (isText || isEnum) {
    return addNullableOps(operators.filter(op =>
      ['=', '!=', 'Não Contém', 'Contém', 'IN', 'NOT IN'].includes(op.value)
    ));
  }

  // fallback: todos
  return addNullableOps(operators.filter(op =>['=', '!=', '>', '<', '>=', '<=', 'Não Contém', 'Contém'].includes(op.value)));
}


