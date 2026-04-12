// --- FUNÇÃO PARA IDENTIFICAR TABELAS DE SISTEMA (MULTI-DB) ---
export const isSystemTable = (tableName: string, schemaName?: string): { isSystem: boolean; reason: string } => {
    const name = tableName.toLowerCase();
    const schema = schemaName?.toLowerCase() || '';

    // 1. PostgreSQL
    if (schema === 'pg_catalog' || schema === 'information_schema') {
        return { isSystem: true, reason: `Esquema reservado do PostgreSQL (${schema})` };
    }
    if (name.startsWith('pg_') || name.startsWith('_pg_') || name.startsWith('sql_')) {
        return { isSystem: true, reason: `Prefixo de nome reservado do PostgreSQL (${name})` };
    }

    // 2. MySQL
    if (['mysql', 'information_schema', 'performance_schema', 'sys'].includes(schema)) {
        return { isSystem: true, reason: `Esquema reservado do MySQL (${schema})` };
    }

    // 3. SQLite (Não costuma usar schemas, a validação é pelo nome)
    if (name.startsWith('sqlite_')) {
        return { isSystem: true, reason: `Prefixo de nome reservado do SQLite (${name})` };
    }

    // 4. Oracle
    if (['sys', 'system', 'ctxsys', 'xdb', 'outln'].includes(schema)) {
        return { isSystem: true, reason: `Esquema reservado do Oracle (${schema})` };
    }

    // 5. MongoDB
    if (['admin', 'local', 'config'].includes(schema)) {
        return { isSystem: true, reason: `Base de dados reservada do MongoDB (${schema})` };
    }
    if (name.startsWith('system.')) {
        return { isSystem: true, reason: `Prefixo de coleção reservado do MongoDB (${name})` };
    }

    return { isSystem: false, reason: '' };
};