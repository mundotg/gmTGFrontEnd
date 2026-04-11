// types/transfer-types.ts
export interface ColumnMapping {
  coluna_origen_name: string;
  coluna_distino_name: string;
  type_coluna_origem: string;
  type_coluna_destino: string;
  id_coluna_origem: number;
  id_coluna_destino: number;
  enabled: boolean;
}

export interface TableMapping {
  tabela_name_origem: string;
  tabela_name_destino: string;
  id_tabela_origen: number;
  id_tabela_destino: number;
  colunas_relacionados_para_transacao: ColumnMapping[];
}

export interface TransferConfig {
  bd_origen: string;
  bd_distino: string;
  tabelas: Record<string, TableMapping>;
}