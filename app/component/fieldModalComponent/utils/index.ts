import { CampoDetalhado, tipo_db_Options } from "@/types";

export type ModalMode = "create" | "edit";

export interface FieldModalProps {
    isOpen: boolean;
    mode: ModalMode;

    field: (CampoDetalhado & { tableName?: string }) | null;
    tableName?: string;

    tabelaExistenteNaDB: string[];

    // ✅ opcional: para popular "Coluna Referenciada" com JoinSelect
    // Ex: getTableColumns = async (table) => (await api.get(`/tables/${table}/columns`)).data
    getTableColumns?: (tableName: string) => Promise<string[]> | string[];

    onClose: () => void;

    onCreate: (newField: CampoDetalhado & { tableName: string }) => Promise<void> | void;
    onUpdate: (updatedField: CampoDetalhado & { tableName: string }) => Promise<void> | void;
    onDelete: (ctx: { tableName: string; columnName: string }) => Promise<void> | void;

    isBusy?: boolean;
}

export const defaultValueOptionsGeneric: Record<string, string[]> = {
    varchar: ["", "NULL", "CURRENT_USER"],
    text: ["", "NULL"],
    int: ["0", "1", "-1", "NULL"],
    bigint: ["0", "1", "-1", "NULL"],
    decimal: ["0.00", "1.00", "NULL"],
    float: ["0.0", "1.0", "NULL"],
    boolean: ["true", "false", "NULL"],
    date: ["NULL"],
    datetime: ["NULL"],
    timestamp: ["NULL"],
};

export interface FORMDATA {
    nome: string;
    tipo: tipo_db_Options | "";

    length: number | undefined;
    precision: number | undefined;
    scale: number | undefined;

    isUnsigned: boolean;

    isNullable: boolean;
    isUnique: boolean;
    isPrimaryKey: boolean;
    isAutoIncrement: boolean;

    defaultValue: string;
    comentario: string;

    enumValues: string[];
    newEnumValue: string;

    referencedTable: string;
    fieldReferences: string;
    onDeleteAction: string;
    onUpdateAction: string;
}

export const EMPTY_FORM: FORMDATA = {
    nome: "",
    tipo: "",
    length: undefined,
    precision: undefined,
    scale: undefined,
    isUnsigned: false,
    isNullable: true,
    isUnique: false,
    isPrimaryKey: false,
    isAutoIncrement: false,
    defaultValue: "",
    comentario: "",
    enumValues: [],
    newEnumValue: "",
    referencedTable: "",
    fieldReferences: "",
    onDeleteAction: "NO ACTION",
    onUpdateAction: "NO ACTION",
};

export function extractPrecisionScale(rawType: string): { precision?: number; scale?: number } {
    const m = String(rawType || "").match(/\((\d+)\s*,\s*(\d+)\)/);
    if (!m) return {};
    return { precision: Number(m[1]), scale: Number(m[2]) };
}

export const toNumU = (v: any): number | undefined => {
    if (v === null || v === undefined || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};

export const isUnsignedFromType = (rawType: string) => /unsigned/i.test(String(rawType || ""));

export const stableStringify = (obj: any) => {
    // suficiente aqui; se quiser mais robustez, dá pra trocar por fast-json-stable-stringify
    try {
        return JSON.stringify(obj);
    } catch {
        return String(obj);
    }
};


export const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors placeholder:text-gray-400";
export const labelClass =
    "block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1 flex items-center gap-1.5";
