import type { TableMapping } from "@/app/task/types/transfer-types";

export function buildTransferPayload(
  tableMappings: Record<string, TableMapping>,
  opts?: {
    dropTablesWithNoEnabledColumns?: boolean; // default true
    keepDisabledColumns?: boolean;            // default false
  }
) {
  const dropEmpty = opts?.dropTablesWithNoEnabledColumns ?? true;
  const keepDisabled = opts?.keepDisabledColumns ?? false;

  const out: Record<string, TableMapping> = {};

  for (const [tableId, mapping] of Object.entries(tableMappings)) {
    const cols = mapping.colunas_relacionados_para_transacao ?? [];

    const enabledCols = keepDisabled ? cols : cols.filter((c) => c.enabled);

    if (dropEmpty && enabledCols.length === 0) continue;

    out[tableId] = {
      ...mapping,
      colunas_relacionados_para_transacao: enabledCols,
    };
  }

  return out;
}