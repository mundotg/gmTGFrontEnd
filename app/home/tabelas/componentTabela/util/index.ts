import { BancoSuportado } from "@/types";

// =========================================================
// HELPERS
// =========================================================

const normalize = (value?: string) =>
    value?.replace(/"/g, "").trim().toLowerCase() || "";

// =========================================================
// FUNÇÃO PARA IDENTIFICAR TABELAS DE SISTEMA (MULTI-DB)
// =========================================================

export const isSystemTable = (
    tableName: string,
    schemaName?: string,
    dbType?: BancoSuportado
): { isSystem: boolean; reason: string } => {

    const rawName = tableName || "";
    const rawSchema = schemaName || "";

    const name = normalize(rawName);
    const schema = normalize(rawSchema);

    // =====================================================
    // ORACLE
    // =====================================================

    const oracleSchemas = [
        "sys",
        "system",
        "xdb",
        "ctxsys",
        "outln",
        "mdsys",
        "ordsys",
        "orddata",
        "dbsnmp",
        "wmsys",
        "appqossys",
        "audsys",
        "gsmadmin_internal",
        "ojvmsys",
        "lbacsys",
        "dvsys",
        "gsys",
        "olapsys",
        "ordplugins",
        "si_informtn_schema",
        "sysbackup",
        "sysdg",
        "syskm",
        "anon",
        "apex_public_user",
        "apex_040000",
        "apex_050000",
        "apex_190200",
        "apex_210100",
        "remote_scheduler_agent",
        "dip",
        "oracle_ocm",
        "xs$null",
        "gsmcatuser",
        "gsmuser",
        "ojsys",
        "datapump_imp_full_database",
        "datapump_exp_full_database",
    ];

    const oracleInternalPrefixes = [
        "all_",
        "_all_",
        "dba_",
        "user_",
        "v$",
        "gv$",
        "x$",
        "sys_",
        "ora_",
        "logmnr_",
        "md$",
        "def$_",
        "repcat$_",
        "ols$",
        "wrh$_",
        "wri$_",
        "wrm$_",
        "aq$",
        "dr$",
        "mview$_",
        "java$",
    ];

    const oracleInternalExactNames = [
        "dual",
        "col$",
        "obj$",
        "tab$",
        "ind$",
        "user$",
        "undo$",
        "fet$",
        "uet$",
        "cdef$",
        "ccol$",
        "icol$",
        "con$",
        "clu$",
        "source$",
        "dependency$",
        "idl_ub1$",
        "idl_char$",
        "idl_sb4$",
        "idl_ub2$",
        "proxy_data$",
        "proxy_role_data$",
    ];

    if (
        dbType === "oracle" ||
        oracleSchemas.includes(schema)
    ) {

        if (oracleSchemas.includes(schema)) {
            return {
                isSystem: true,
                reason: `Esquema reservado do Oracle (${schema})`,
            };
        }

        if (
            oracleInternalPrefixes.some(prefix =>
                name.startsWith(prefix)
            )
        ) {
            return {
                isSystem: true,
                reason: `Objeto interno do Oracle (${rawName})`,
            };
        }

        if (
            oracleInternalExactNames.includes(name)
        ) {
            return {
                isSystem: true,
                reason: `Tabela interna do Oracle (${rawName})`,
            };
        }
    }

    // =====================================================
    // POSTGRESQL
    // =====================================================

    const postgresSchemas = [
        "pg_catalog",
        "information_schema",
        "pg_toast",
        "pg_temp_1",
        "pg_toast_temp_1",
    ];

    if (
        dbType === "postgresql" ||
        postgresSchemas.includes(schema)
    ) {

        if (postgresSchemas.includes(schema)) {
            return {
                isSystem: true,
                reason: `Esquema reservado do PostgreSQL (${schema})`,
            };
        }

        if (
            name.startsWith("pg_") ||
            name.startsWith("_pg_") ||
            name.startsWith("sql_")
        ) {
            return {
                isSystem: true,
                reason: `Objeto interno do PostgreSQL (${rawName})`,
            };
        }
    }

    // =====================================================
    // MYSQL
    // =====================================================

    const mysqlSchemas = [
        "mysql",
        "information_schema",
        "performance_schema",
        "sys",
    ];

    if (
        dbType === "mysql" ||
        mysqlSchemas.includes(schema)
    ) {

        if (mysqlSchemas.includes(schema)) {
            return {
                isSystem: true,
                reason: `Esquema reservado do MySQL (${schema})`,
            };
        }

        if (
            name.startsWith("innodb_") ||
            name.startsWith("mysql.")
        ) {
            return {
                isSystem: true,
                reason: `Objeto interno do MySQL (${rawName})`,
            };
        }
    }

    // =====================================================
    // SQL SERVER
    // =====================================================

    const sqlServerSchemas = [
        "sys",
        "information_schema",
    ];

    if (
        dbType === "sqlserver" ||
        sqlServerSchemas.includes(schema)
    ) {

        if (sqlServerSchemas.includes(schema)) {
            return {
                isSystem: true,
                reason: `Esquema reservado do SQL Server (${schema})`,
            };
        }

        if (
            name.startsWith("sys") ||
            name.startsWith("queue_") ||
            name.startsWith("filestream_")
        ) {
            return {
                isSystem: true,
                reason: `Objeto interno do SQL Server (${rawName})`,
            };
        }
    }

    // =====================================================
    // SQLITE
    // =====================================================

    if (
        dbType === "sqlite" ||
        name.startsWith("sqlite_")
    ) {
        if (
            name.startsWith("sqlite_")
        ) {
            return {
                isSystem: true,
                reason: `Tabela interna do SQLite (${rawName})`,
            };
        }
    }

    // =====================================================
    // MONGODB
    // =====================================================

    const mongoSchemas = [
        "admin",
        "local",
        "config",
    ];

    if (
        dbType === "mongodb" ||
        mongoSchemas.includes(schema)
    ) {

        if (mongoSchemas.includes(schema)) {
            return {
                isSystem: true,
                reason: `Database reservada do MongoDB (${schema})`,
            };
        }

        if (
            name.startsWith("system.")
        ) {
            return {
                isSystem: true,
                reason: `Coleção interna do MongoDB (${rawName})`,
            };
        }
    }

    // =====================================================
    // NÃO É SISTEMA
    // =====================================================

    return {
        isSystem: false,
        reason: "",
    };
};

// =========================================================
// SCHEMAS PADRÃO
// =========================================================

export function getDefaultSchemas(
    driver: BancoSuportado
): string {

    switch (driver) {

        case "postgresql":
            return "public";

        case "sqlserver":
            return "dbo";

        case "oracle":
            // Oracle usa o próprio USER
            return "";

        case "mysql":
            // database atual
            return "";

        case "sqlite":
            return "main";

        case "mongodb":
            return "default";

        default:
            return "";
    }
}