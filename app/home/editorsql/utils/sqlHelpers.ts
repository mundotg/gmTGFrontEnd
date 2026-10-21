import { RealtimeQueryAnalysis } from "../types";

export const WS_BASE = ((process.env.NEXT_PUBLIC_BACKEND_URL ?? "")
    .replace(/^http/, "ws")
    .replace(/\/$/, "")) + "/sql-editor/ws";

export const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "") + "sql-editor";

export const KEYWORDS = [
    "SELECT", "FROM", "WHERE", "INSERT", "UPDATE", "DELETE", "JOIN", "INNER", "LEFT",
    "RIGHT", "OUTER", "ON", "AND", "OR", "NOT", "IN", "IS", "NULL", "GROUP BY", "ORDER BY",
    "LIMIT", "OFFSET", "HAVING", "DISTINCT", "AS", "CREATE", "ALTER", "DROP", "TABLE",
    "UNION", "ALL", "CASE", "WHEN", "THEN", "ELSE", "END", "BETWEEN", "LIKE", "EXISTS",
    "COUNT", "SUM", "AVG", "MIN", "MAX", "COALESCE", "CAST", "RETURNING", "VALUES", "SET", "INTO",
];

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
        throw new Error(json.message ?? "Erro na requisição");
    }
    return json.data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        credentials: "include",
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message ?? "Erro");
    return json.data as T;
}

export function highlight(sql: string): string {
    const esc = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const tokens: string[] = [];
    let i = 0;

    while (i < sql.length) {
        // single-line comment
        if (sql[i] === "-" && sql[i + 1] === "-") {
            const j = sql.indexOf("\n", i);
            const end = j === -1 ? sql.length : j;
            tokens.push(`<span class="hl-cmt">${esc(sql.slice(i, end))}</span>`);
            i = end;
            continue;
        }
        // string literals
        if (sql[i] === "'" || sql[i] === '"') {
            const q = sql[i];
            let j = i + 1;
            while (j < sql.length && sql[j] !== q) {
                if (sql[j] === "\\") j++;
                j++;
            }
            j++;
            tokens.push(`<span class="hl-str">${esc(sql.slice(i, j))}</span>`);
            i = j;
            continue;
        }
        // numbers
        if (/\d/.test(sql[i]) && (i === 0 || !/\w/.test(sql[i - 1]))) {
            let j = i;
            while (j < sql.length && /[\d.]/.test(sql[j])) j++;
            tokens.push(`<span class="hl-num">${esc(sql.slice(i, j))}</span>`);
            i = j;
            continue;
        }
        // words / keywords
        if (/[a-zA-Z_*]/.test(sql[i])) {
            let j = i;
            while (j < sql.length && /[\w*]/.test(sql[j])) j++;
            const word = sql.slice(i, j);
            if (KEYWORDS.includes(word.toUpperCase())) {
                tokens.push(`<span class="hl-kw">${esc(word)}</span>`);
            } else {
                tokens.push(esc(word));
            }
            i = j;
            continue;
        }
        tokens.push(esc(sql[i]));
        i++;
    }
    return tokens.join("");
}

/**
 * Análise estática instantânea de SQL no editor em tempo real (0ms latência).
 */
export function analyzeQueryRealtime(rawSql: string): RealtimeQueryAnalysis {
    const clean = rawSql.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (!clean) {
        return {
            statementType: "SQL",
            tables: [],
            riskLevel: "safe",
            risks: [],
            complexity: 0,
            hasWhere: false,
            hasLimit: false,
            hasJoins: false,
            joinsCount: 0,
        };
    }

    const firstWordMatch = clean.match(/^([a-zA-Z]+)/);
    const statementType = firstWordMatch ? firstWordMatch[1].toUpperCase() : "SQL";
    const upper = clean.toUpperCase();
    const hasWhere = /\bWHERE\b/.test(upper);
    const hasLimit = /\bLIMIT\b/.test(upper);
    const joinMatches = upper.match(/\b(JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|CROSS\s+JOIN)\b/g);
    const joinsCount = joinMatches ? joinMatches.length : 0;
    const hasJoins = joinsCount > 0;
    const subqueryMatches = clean.match(/\(\s*SELECT\b/gi);
    const subqueriesCount = subqueryMatches ? subqueryMatches.length : 0;
    const groupBy = /\bGROUP\s+BY\b/.test(upper);
    const orderBy = /\bORDER\s+BY\b/.test(upper);

    let complexity = 1;
    complexity += joinsCount * 2;
    complexity += subqueriesCount * 3;
    if (groupBy) complexity += 1;
    if (orderBy) complexity += 1;
    if (clean.length > 250) complexity += 1;
    if (complexity > 10) complexity = 10;

    const tables: string[] = [];
    const fromMatches = clean.matchAll(/\b(?:FROM|JOIN|INTO|UPDATE)\s+([a-zA-Z0-9_."]+)/gi);
    const reserved = new Set(["SELECT", "WHERE", "ORDER", "GROUP", "LIMIT", "SET", "VALUES", "JOIN", "ON", "LEFT", "RIGHT", "INNER", "OUTER", "HAVING"]);
    for (const m of fromMatches) {
        if (m[1]) {
            const tbl = m[1].replace(/["`]/g, "").split(".")[0];
            if (!reserved.has(tbl.toUpperCase()) && !tables.includes(tbl)) {
                tables.push(tbl);
            }
        }
    }

    const risks: string[] = [];
    let riskLevel: "safe" | "moderate" | "critical" = "safe";

    if (/\b(DROP|TRUNCATE)\b/.test(upper)) {
        riskLevel = "critical";
        risks.push("Comando destrutivo DDL permanente (DROP / TRUNCATE)");
    } else if (/\b(UPDATE|DELETE)\b/.test(upper) && !hasWhere) {
        riskLevel = "critical";
        risks.push("UPDATE / DELETE sem cláusula WHERE afetará toda a tabela!");
    } else if (/\b(ALTER\s+TABLE)\b/.test(upper)) {
        riskLevel = "moderate";
        risks.push("Modificação de esquema DDL (bloqueio de tabela)");
    } else if (statementType === "SELECT" && !hasLimit && clean.length > 40) {
        riskLevel = "moderate";
        risks.push("SELECT sem LIMIT pode consumir memória e causar I/O excessivo");
    }

    if (/\bSELECT\s+\*\s+FROM\b/.test(upper)) {
        risks.push("Dica: Considere listar colunas explícitas ao invés de SELECT *");
    }

    return {
        statementType,
        tables,
        riskLevel,
        risks,
        complexity,
        hasWhere,
        hasLimit,
        hasJoins,
        joinsCount,
    };
}
