import { CampoDetalhado, EditedFieldForQuery, QueryPayload, SelectedRow, tipo_db_Options } from "@/types";

export interface ConfirmDeleteModalType {
  isOpen: boolean;
  type: "single" | "all" | "select";
  total?: number;
  lista: PayloadDeleteRow[];
  payloadSelectedRow: any
}

export type RowDelete = {
  primaryKey?: string;
  primaryKeyValue?: string;
  keyType?: tipo_db_Options;
  isPrimarykeyOrUnique?: boolean;
  index: number;
};

export type PayloadDeleteRow = {
  tableForDelete: string[];
  index?: number;
  rowDeletes: Record<string, RowDelete>;
};

export type BatchDeleteRequest = {
  registros: PayloadDeleteRow[];
  payloadSelectedRow?: QueryPayload;
};


export interface RowDetailsModalProps {
  isOpen: boolean;
  setModalFetchOpen:(t:boolean)=>void;
  optionModalTable?:string,
  setOptionModalTable:(s:string)=>void;
  modalFetchOpen: boolean;
  responseModal?:string[];
  setResponseModal: (r?:string[])=>void
  onClose: () => void;
  row: SelectedRow | null;
  informacaosOftables?: Record<string, CampoDetalhado[]>;
  onSave?: (updatedRow: EditedFieldForQuery, tables_primary_keys_values: Record<string, Record<string, any>>, index: number) => void;
  onDelete: (payload: PayloadDeleteRow, index: number) => Promise<void>
}