// ============================================================================
// VARIÁVEIS DO TEMPLATE — placeholders {{...}} que se ajustam aos dados do
// relatório. O catálogo abaixo espelha o CONTEXTO que o backend fornece para
// relatórios de CONSULTA (ver app/relatorio/template_variaveis.py +
// gerar_relatorio_routes._build_query_context).
// ============================================================================

import { Section } from "./types";

export type VariableItem = {
  key: string;       // ex: "query.total"  → usa-se como {{query.total}}
  label: string;
  sample: string | number; // valor de exemplo (preview)
  hint?: string;
};

export type VariableGroup = {
  group: string;
  items: VariableItem[];
};

// Catálogo (o que está disponível hoje nos relatórios de consulta).
export const VARIABLE_GROUPS: VariableGroup[] = [
  {
    group: "Data / Hora",
    items: [
      { key: "data.hoje", label: "Data de hoje", sample: "09/08/2026" },
      { key: "data.hora", label: "Hora", sample: "14:03" },
      { key: "data.iso", label: "Data ISO", sample: "2026-08-09T14:03:00" },
    ],
  },
  {
    group: "Consulta",
    items: [
      { key: "query.total", label: "Nº de linhas", sample: 128 },
      { key: "query.duracao_ms", label: "Duração (ms)", sample: 42 },
      { key: "query.sql", label: "SQL executado", sample: "SELECT * FROM users" },
    ],
  },
  {
    group: "Empresa / Utilizador",
    items: [
      { key: "empresa.nome", label: "Nome da empresa", sample: "MustaInfo" },
      { key: "usuario.nome", label: "Nome do utilizador", sample: "Francys" },
    ],
  },
];

// Binding de tabela dinâmica → preenche a tabela com o resultado da consulta.
export const TABLE_BIND = {
  rows_from: "query.linhas",
  columns_from: "query.colunas",
};

// Contexto de EXEMPLO para o preview (mesma forma do backend).
export const SAMPLE_CONTEXT: Record<string, unknown> = {
  data: { hoje: "09/08/2026", hora: "14:03", iso: "2026-08-09T14:03:00" },
  empresa: { nome: "MustaInfo" },
  usuario: { nome: "Francys" },
  query: {
    total: 3,
    duracao_ms: 42,
    sql: "SELECT nome, idade FROM users",
    colunas: ["nome", "idade", "cidade"],
    linhas: [
      { nome: "Ana", idade: 30, cidade: "Luanda" },
      { nome: "Rui", idade: 25, cidade: "Lisboa" },
      { nome: "Zé", idade: 41, cidade: "Porto" },
    ],
  },
};

const TOKEN = /\{\{\s*([\w.[\]]+)\s*\}\}/g;

function resolvePath(ctx: unknown, path: string): unknown {
  let cur: unknown = ctx;
  for (const raw of path.split(".")) {
    if (cur == null) return undefined;
    const m = /^(\w+)\[(\d+)\]$/.exec(raw);
    const key = m ? m[1] : raw;
    const idx = m ? Number(m[2]) : null;
    cur = typeof cur === "object" && cur !== null ? (cur as Record<string, unknown>)[key] : undefined;
    if (idx != null) {
      cur = Array.isArray(cur) && idx < cur.length ? cur[idx] : undefined;
    }
  }
  return cur;
}

function fmt(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  return String(v);
}

export function applyVars(text: string, ctx: unknown): string {
  return text.replace(TOKEN, (_, path) => fmt(resolvePath(ctx, path)));
}

/** Existe algum placeholder {{...}} nesta string? */
export function hasVars(text: string): boolean {
  return /\{\{\s*[\w.[\]]+\s*\}\}/.test(text);
}

function substituteDeep(node: unknown, ctx: unknown): unknown {
  if (typeof node === "string") return applyVars(node, ctx);
  if (Array.isArray(node)) return node.map((x) => substituteDeep(x, ctx));
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) out[k] = substituteDeep(v, ctx);
    return out;
  }
  return node;
}

/**
 * Devolve uma cópia das seções com as variáveis substituídas por valores de
 * exemplo e as tabelas com binding expandidas — para o preview "com dados".
 */
export function substituteSections(sections: Section[], ctx: unknown = SAMPLE_CONTEXT): Section[] {
  const walk = (s: Section): Section => {
    const data = { ...(s.data as Record<string, unknown>) };

    // Binding de tabela: rows_from / columns_from → columns / rows
    if (s.type === "table") {
      const colsFrom = data.columns_from as string | undefined;
      const rowsFrom = (data.rows_from as string | undefined) || (data.bind as string | undefined);
      if (colsFrom) {
        const cols = resolvePath(ctx, colsFrom);
        if (Array.isArray(cols)) data.columns = cols.map(fmt);
      }
      if (rowsFrom) {
        const list = resolvePath(ctx, rowsFrom);
        if (Array.isArray(list)) {
          const columns = (data.columns as string[]) || [];
          data.rows = list.map((item) => {
            if (item && typeof item === "object" && !Array.isArray(item)) {
              const keys = columns.length ? columns : Object.keys(item);
              if (!columns.length) data.columns = keys;
              return keys.map((k) => fmt((item as Record<string, unknown>)[k]));
            }
            if (Array.isArray(item)) return item.map(fmt);
            return [fmt(item)];
          });
        }
      }
      delete data.rows_from;
      delete data.columns_from;
      delete data.bind;
    }

    const substituted = substituteDeep(data, ctx) as Section["data"];
    return {
      ...s,
      data: substituted,
      children: s.children ? s.children.map(walk) : undefined,
    };
  };
  return sections.map(walk);
}
