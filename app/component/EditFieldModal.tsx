"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  X,
  Save,
  Plus,
  Key,
  Trash2,
  Link as LinkIcon,
  Hash,
  Type,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { CampoDetalhado, tipo_db_Options } from "@/types";
import { tiposPorBanco } from "@/constant";
import { useSession } from "@/context/SessionContext";
import { extrairTipoBase, mapColumnTypeToDbType } from "../services";
import { JoinSelect } from "./BuildQueryComponent/JoinSelect";
import { useI18n } from "@/context/I18nContext";

type ModalMode = "create" | "edit";

interface FieldModalProps {
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

const defaultValueOptionsGeneric: Record<string, string[]> = {
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

interface FORMDATA {
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

const EMPTY_FORM: FORMDATA = {
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

function extractPrecisionScale(rawType: string): { precision?: number; scale?: number } {
  const m = String(rawType || "").match(/\((\d+)\s*,\s*(\d+)\)/);
  if (!m) return {};
  return { precision: Number(m[1]), scale: Number(m[2]) };
}

const toNumU = (v: any): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const isUnsignedFromType = (rawType: string) => /unsigned/i.test(String(rawType || ""));

const stableStringify = (obj: any) => {
  // suficiente aqui; se quiser mais robustez, dá pra trocar por fast-json-stable-stringify
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
};

const FieldModal: React.FC<FieldModalProps> = ({
  isOpen,
  mode,
  field,
  tableName,
  tabelaExistenteNaDB,
  getTableColumns,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  isBusy,
}) => {
  const { user } = useSession();
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [localBusy, setLocalBusy] = useState(false);
  const busy = !!isBusy || localBusy;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const initialTableName = useMemo(() => {
    return (
      (tableName || "").trim() ||
      String((field as any)?.tableName || (field as any)?.table_name || "").trim()
    );
  }, [tableName, field]);

  const [form, setForm] = useState<FORMDATA>(EMPTY_FORM);

  const dbType = (user?.info_extra?.type || "").toLowerCase();
  const supportsUnsigned = useMemo(() => ["mysql", "mariadb"].includes(dbType), [dbType]);

  // =========================
  // ✅ Dirty check (confirm close)
  // =========================
  const initialFormSnapshotRef = useRef<string>(stableStringify(EMPTY_FORM));

  const syncInitialSnapshot = useCallback((nextForm: FORMDATA) => {
    initialFormSnapshotRef.current = stableStringify(nextForm);
  }, []);

  const isDirty = useMemo(() => {
    return stableStringify(form) !== initialFormSnapshotRef.current;
  }, [form]);

  const safeClose = useCallback(() => {
    if (busy) return;
    if (isDirty) {
      const ok = window.confirm("Tens alterações não salvas. Fechar mesmo assim?");
      if (!ok) return;
    }
    onClose();
  }, [busy, isDirty, onClose]);

  // =========================
  // ✅ Enum detection mais segura
  // =========================
  const isEnumType = useMemo(() => {
    const tipo = (form.tipo || "").toLowerCase();
    const hasEnumFromField = mode === "edit" && (field?.enum_valores_encontrados?.length ?? 0) > 0;
    return tipo.includes("enum") || hasEnumFromField;
  }, [form.tipo, field, mode]);

  const isDecimalType = useMemo(() => {
    const tipo = (form.tipo || "").toLowerCase();
    return ["decimal", "numeric"].some((tt) => tipo.includes(tt));
  }, [form.tipo]);

  const isFloatType = useMemo(() => {
    const tipo = (form.tipo || "").toLowerCase();
    return ["float", "double", "real"].some((tt) => tipo.includes(tt));
  }, [form.tipo]);

  const shouldShowPrecisionScale = useMemo(() => isDecimalType, [isDecimalType]);

  const shouldShowLength = useMemo(() => {
    const tipo = (form.tipo || "").toLowerCase();
    return ["varchar", "char", "nvarchar", "nchar", "varbinary"].some((tt) => tipo.includes(tt));
  }, [form.tipo]);

  const isForeignKey = useMemo(() => {
    return !!form.referencedTable.trim() && !!form.fieldReferences.trim();
  }, [form.referencedTable, form.fieldReferences]);

  const updateFormField = useCallback(<K extends keyof FORMDATA>(key: K, value: FORMDATA[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // =========================
  // ✅ Prefill / Reset
  // =========================
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);

    if (mode === "edit" && !field) {
      setForm(EMPTY_FORM);
      syncInitialSnapshot(EMPTY_FORM);
      setErrorMsg("Selecione uma coluna para editar.");
      return;
    }

    if (mode === "edit" && field) {
      const rawTipo = field.tipo || "";
      const { precision, scale } = extractPrecisionScale(rawTipo);

      const nextForm: FORMDATA = {
        ...EMPTY_FORM,
        isNullable: field.is_nullable ?? false,

        nome: field.nome || "",
        tipo: (field.tipo as any) || "",

        length: toNumU((field as any).length),

        precision: toNumU((field as any).precision ?? precision),
        scale: toNumU((field as any).scale ?? scale),

        // ✅ detecta unsigned (apenas mysql/mariadb)
        isUnsigned: supportsUnsigned ? isUnsignedFromType(rawTipo) : false,

        isUnique: field.is_unique || false,
        isPrimaryKey: field.is_primary_key || false,
        isAutoIncrement: field.is_auto_increment || false,

        defaultValue: (field as any).default || "",
        comentario: (field as any).comentario || "",

        enumValues: field.enum_valores_encontrados || [],
        newEnumValue: "",

        referencedTable: String((field as any).referenced_table || ""),
        fieldReferences: String((field as any).field_references || ""),
        onDeleteAction: (field as any).on_delete_action ?? "NO ACTION",
        onUpdateAction: (field as any).on_update_action ?? "NO ACTION",
      };

      setForm(nextForm);
      syncInitialSnapshot(nextForm);
      return;
    }

    if (mode === "create") {
      setForm(EMPTY_FORM);
      syncInitialSnapshot(EMPTY_FORM);
    }
  }, [isOpen, mode, field, supportsUnsigned, syncInitialSnapshot]);

  // ESC fecha (com confirm)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") safeClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, safeClose]);

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (busy) return;
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) safeClose();
  };

  // =========================
  // ✅ Ajustes automáticos por tipo
  // =========================
  useEffect(() => {
    setForm((prev) => {
      let next = prev;

      if (!supportsUnsigned && prev.isUnsigned) {
        next = { ...next, isUnsigned: false };
      }

      if (!shouldShowPrecisionScale && (prev.precision !== undefined || prev.scale !== undefined)) {
        next = { ...next, precision: undefined, scale: undefined };
      }

      if (!shouldShowLength && prev.length !== undefined) {
        next = { ...next, length: undefined };
      }

      return next === prev ? prev : next;
    });
  }, [supportsUnsigned, shouldShowPrecisionScale, shouldShowLength, form.tipo]);

  // =========================
  // ✅ ENUM handlers
  // =========================
  const addEnumValue = useCallback(() => {
    const val = form.newEnumValue.trim();
    if (val && !form.enumValues.includes(val)) {
      setForm((prev) => ({
        ...prev,
        enumValues: [...prev.enumValues, val],
        newEnumValue: "",
      }));
    }
  }, [form.newEnumValue, form.enumValues]);

  const removeEnumValue = useCallback((i: number) => {
    setForm((prev) => ({
      ...prev,
      enumValues: prev.enumValues.filter((_, idx) => idx !== i),
    }));
  }, []);

  // =========================
  // ✅ Defaults por banco
  // =========================
  const defaultValueOptionsByDb = useMemo(() => {
    const base = defaultValueOptionsGeneric;

    const mysql = {
      ...base,
      date: ["", "NULL", "CURRENT_DATE"],
      datetime: ["", "NULL", "CURRENT_TIMESTAMP"],
      timestamp: ["", "NULL", "CURRENT_TIMESTAMP"],
      boolean: ["", "NULL", "0", "1"],
    };

    const postgres = {
      ...base,
      date: ["", "NULL", "CURRENT_DATE"],
      // Postgres: NOW() é função válida e CURRENT_TIMESTAMP também
      timestamp: ["", "NULL", "CURRENT_TIMESTAMP", "NOW()"],
      datetime: ["", "NULL", "CURRENT_TIMESTAMP", "NOW()"],
      boolean: ["", "NULL", "true", "false"],
    };

    const sqlserver = {
      ...base,
      date: ["", "NULL", "CAST(GETDATE() AS date)"],
      datetime: ["", "NULL", "GETDATE()"],
      timestamp: ["", "NULL"], // timestamp/rowversion no SQL Server não é "data/hora"
      boolean: ["", "NULL", "0", "1"],
    };

    const sqlite = {
      ...base,
      date: ["", "NULL", "CURRENT_DATE"],
      datetime: ["", "NULL", "CURRENT_TIMESTAMP"],
      timestamp: ["", "NULL", "CURRENT_TIMESTAMP"],
      boolean: ["", "NULL", "0", "1"],
    };

    const map: Record<string, Record<string, string[]>> = {
      mysql,
      mariadb: mysql,
      postgres,
      postgresql: postgres,
      sqlserver,
      mssql: sqlserver,
      sqlite,
    };

    return map[dbType] || base;
  }, [dbType]);

  const currentDefaults = useMemo(() => {
    // enum deve permitir “sem default”
    if (form.enumValues.length > 0) return ["", ...form.enumValues];

    const baseType = mapColumnTypeToDbType(extrairTipoBase(form.tipo));
    return defaultValueOptionsByDb[baseType] || ["", "NULL"];
  }, [form.tipo, form.enumValues, defaultValueOptionsByDb]);

  // =========================
  // ✅ Colunas da tabela referenciada (JoinSelect)
  // =========================
  const [refCols, setRefCols] = useState<string[]>([]);
  const [refColsLoading, setRefColsLoading] = useState(false);
  const [refColsError, setRefColsError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setRefColsError(null);

      const rt = form.referencedTable.trim();
      if (!rt || !getTableColumns) {
        setRefCols([]);
        return;
      }

      setRefColsLoading(true);
      try {
        const res = await Promise.resolve(getTableColumns(rt));
        if (!alive) return;
        const list = (res || []).map(String).map((s) => s.trim()).filter(Boolean);
        setRefCols(list);
      } catch (e: any) {
        if (!alive) return;
        setRefCols([]);
        setRefColsError(e?.message || "Falha ao carregar colunas da tabela.");
      } finally {
        if (alive) setRefColsLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [form.referencedTable, getTableColumns]);

  const useJoinForFieldReferences = !!getTableColumns && form.referencedTable.trim().length > 0;

  // =========================
  // ✅ Validação
  // =========================
  const isValid = useMemo(() => {
    if (!form.nome.trim() || !form.tipo) return false;
    if (!initialTableName) return false;
    if (mode === "edit" && !field) return false;

    if (shouldShowPrecisionScale) {
      if (form.precision !== undefined && form.precision <= 0) return false;
      if (form.scale !== undefined && form.scale < 0) return false;
      if (form.precision !== undefined && form.scale !== undefined && form.scale > form.precision) return false;
    }

    if (shouldShowLength) {
      if (form.length !== undefined && form.length <= 0) return false;
    }

    return true;
  }, [form, initialTableName, shouldShowPrecisionScale, shouldShowLength, mode, field]);

  const title = useMemo(() => {
    if (mode === "create") return t("modals.createField") || "Criar Campo";
    return t("modals.editField") || "Editar Campo";
  }, [mode, t]);

  const primaryButtonText = useMemo(() => {
    if (mode === "create") return t("actions.create") || "Criar";
    return t("actions.saveChanges") || "Salvar alterações";
  }, [mode, t]);

  const handlePrimaryAction = useCallback(async () => {
    setErrorMsg(null);

    if (!isValid) {
      setErrorMsg("Preencha os campos obrigatórios corretamente.");
      return;
    }

    const table = initialTableName;
    if (!table) {
      setErrorMsg("tableName não informado.");
      return;
    }

    const baseField: any = mode === "edit" && field ? { ...field } : {};

    const payloadField: CampoDetalhado & { tableName: string } = {
      ...baseField,
      nome: form.nome,
      tipo: form.tipo as tipo_db_Options,

      length: form.length,
      precision: form.precision,
      scale: form.scale,

      // se teu backend suportar:
      // is_unsigned: form.isUnsigned,

      is_nullable: form.isNullable,
      is_unique: form.isUnique,
      is_primary_key: form.isPrimaryKey,
      is_auto_increment: form.isAutoIncrement,

      default: form.defaultValue,
      comentario: form.comentario,

      enum_valores_encontrados: form.enumValues,

      referenced_table: form.referencedTable.trim(),
      field_references: form.fieldReferences.trim(),
      on_delete_action: form.onDeleteAction,
      on_update_action: form.onUpdateAction,

      tableName: table,
    };

    setLocalBusy(true);
    try {
      if (mode === "create") await onCreate(payloadField);
      else await onUpdate(payloadField);

      // salvou => snapshot vira o estado atual
      syncInitialSnapshot(form);
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || "Falha ao executar operação.");
    } finally {
      setLocalBusy(false);
    }
  }, [mode, isValid, initialTableName, field, form, onCreate, onUpdate, onClose, syncInitialSnapshot]);

  const handleDelete = useCallback(async () => {
    if (!field) return;

    const table = initialTableName;
    const col = field.nome;

    if (!table || !col) {
      setErrorMsg("Não foi possível identificar tabela/coluna.");
      return;
    }

    const ok = window.confirm(`Eliminar a coluna '${col}'? Isso é destrutivo.`);
    if (!ok) return;

    setErrorMsg(null);
    setLocalBusy(true);
    try {
      await onDelete({ tableName: table, columnName: col });
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || "Falha ao eliminar coluna.");
    } finally {
      setLocalBusy(false);
    }
  }, [field, initialTableName, onDelete, onClose]);

  if (!isOpen) return null;

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors placeholder:text-gray-400";
  const labelClass =
    "block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1 flex items-center gap-1.5";

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={handleOutsideClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Type size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {title}
                {mode === "edit" && field?.nome ? (
                  <>
                    : <span className="text-blue-600">{field.nome}</span>
                  </>
                ) : null}
              </h2>
              <p className="text-xs font-medium text-gray-500">
                {mode === "create"
                  ? "Crie uma nova coluna na tabela selecionada."
                  : t("modals.editFieldDesc") || "Configure metadados e relacionamentos desta coluna."}
              </p>
              {initialTableName && (
                <p className="mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Tabela: <span className="text-gray-600">{initialTableName}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={safeClose}
            disabled={busy}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
            aria-label={t("actions.close") || "Fechar"}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
          {errorMsg && (
            <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm font-semibold">
              ❌ {errorMsg}
            </div>
          )}

          {/* Seção 1 */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Hash size={16} className="text-blue-600" /> Definição Principal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelClass}>
                  {t("fields.columnName") || "Nome da Coluna"} <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.nome}
                  onChange={(e) => updateFormField("nome", e.target.value)}
                  className={inputClass}
                  placeholder="Ex: id_usuario, data_criacao..."
                  disabled={busy}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {t("fields.dataType") || "Tipo de Dado"} <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => updateFormField("tipo", e.target.value as tipo_db_Options)}
                  className={`${inputClass} appearance-none cursor-pointer`}
                  disabled={busy}
                >
                  <option value="" disabled>
                    -- Selecione o tipo --
                  </option>
                  {user?.info_extra?.type &&
                    tiposPorBanco[user?.info_extra?.type]?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.toUpperCase()}
                      </option>
                    ))}
                  {user?.info_extra?.type &&
                    !tiposPorBanco[user?.info_extra?.type]?.includes(form.tipo as tipo_db_Options) &&
                    form.tipo && <option value={form.tipo}>{String(form.tipo).toUpperCase()}</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="animate-in fade-in duration-200">
                  <label className={labelClass}>{t("fields.length") || "Tamanho"}</label>
                  <input
                    type="number"
                    min={1}
                    value={form.length ?? ""}
                    onChange={(e) => updateFormField("length", e.target.value ? Number(e.target.value) : undefined)}
                    className={`${inputClass} ${shouldShowLength ? "" : "opacity-60"}`}
                    placeholder={shouldShowLength ? "Ex: 255" : "(Opcional)"}
                    disabled={busy || !shouldShowLength}
                    title={!shouldShowLength ? "Tamanho é usado principalmente para varchar/char." : undefined}
                  />
                </div>

                <div className="animate-in fade-in duration-200">
                  <label className={labelClass}>{t("fields.precision") || "Precisão"}</label>
                  <input
                    type="number"
                    min={1}
                    value={form.precision ?? ""}
                    onChange={(e) => updateFormField("precision", e.target.value ? Number(e.target.value) : undefined)}
                    className={`${inputClass} ${shouldShowPrecisionScale ? "" : "opacity-60"}`}
                    placeholder={shouldShowPrecisionScale ? "Ex: 10" : "(Opcional)"}
                    disabled={busy || !shouldShowPrecisionScale}
                  />
                </div>

                {shouldShowPrecisionScale && (
                  <div className="animate-in fade-in duration-200 col-span-2">
                    <label className={labelClass}>{t("fields.scale") || "Escala"}</label>
                    <input
                      type="number"
                      min={0}
                      value={form.scale ?? ""}
                      onChange={(e) => updateFormField("scale", e.target.value ? Number(e.target.value) : undefined)}
                      className={inputClass}
                      placeholder="Ex: 2"
                      disabled={busy}
                    />
                    {form.precision !== undefined && form.scale !== undefined && form.scale > form.precision && (
                      <p className="mt-1 text-xs text-red-600 font-medium">Escala não pode ser maior que a precisão.</p>
                    )}
                  </div>
                )}

                {isFloatType && (
                  <p className="col-span-2 text-xs text-gray-500 font-medium">
                    Tipos FLOAT/DOUBLE geralmente não usam precisão/escala como DECIMAL.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Restrições */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600" /> Atributos e Restrições
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <ToggleCard label="Aceita NULL" checked={form.isNullable} onChange={(v) => updateFormField("isNullable", v)} disabled={busy} />
              <ToggleCard label="Único (UNIQUE)" checked={form.isUnique} onChange={(v) => updateFormField("isUnique", v)} disabled={busy} />
              <ToggleCard label="Chave Primária" checked={form.isPrimaryKey} onChange={(v) => updateFormField("isPrimaryKey", v)} isPrimary disabled={busy} />
              <ToggleCard label="Auto Increment" checked={form.isAutoIncrement} onChange={(v) => updateFormField("isAutoIncrement", v)} disabled={busy} />

              <ToggleCard
                label="Unsigned"
                checked={supportsUnsigned ? form.isUnsigned : false}
                onChange={(v) => updateFormField("isUnsigned", v)}
                disabled={busy || !supportsUnsigned}
                hint={!supportsUnsigned ? "Unsigned só é suportado em MySQL/MariaDB." : undefined}
              />
            </div>
          </div>

          {/* Default e Comentário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>{t("fields.defaultValue") || "Valor Padrão (Default)"}</label>
              <select
                value={form.defaultValue}
                onChange={(e) => updateFormField("defaultValue", e.target.value)}
                className={`${inputClass} appearance-none cursor-pointer`}
                disabled={busy}
              >
                {currentDefaults.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "" ? "-- Sem valor padrão --" : opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                <FileText size={14} /> {t("fields.comment") || "Dicionário de Dados (Comentário)"}
              </label>
              <input
                value={form.comentario}
                onChange={(e) => updateFormField("comentario", e.target.value)}
                className={inputClass}
                placeholder="Descreva o propósito deste campo..."
                disabled={busy}
              />
            </div>
          </div>

          {/* ENUM */}
          {isEnumType && (
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl animate-in fade-in">
              <label className={labelClass}>Valores ENUM Restritos</label>

              <div className="flex gap-3 mb-4">
                <input
                  value={form.newEnumValue}
                  onChange={(e) => updateFormField("newEnumValue", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEnumValue();
                    }
                  }}
                  className={inputClass}
                  placeholder="Novo valor permitido..."
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={addEnumValue}
                  disabled={busy}
                  className="px-5 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shrink-0 disabled:opacity-50"
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {form.enumValues.map((val, i) => (
                  <span
                    key={`${val}-${i}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm"
                  >
                    {val}
                    <button
                      type="button"
                      onClick={() => removeEnumValue(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      aria-label={`Remover enum ${val}`}
                      disabled={busy}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {form.enumValues.length === 0 && (
                  <span className="text-xs text-gray-500 italic">Nenhum valor ENUM definido.</span>
                )}
              </div>
            </div>
          )}

          {/* Foreign Key */}
          <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <LinkIcon size={16} className="text-blue-600" /> Relacionamento (Chave Estrangeira)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className={labelClass}>Tabela Referenciada</label>
                <JoinSelect
                  onChange={(value) => updateFormField("referencedTable", value)}
                  className="w-full bg-white border border-gray-300 rounded-xl"
                  placeholder={"Ex: " + (tabelaExistenteNaDB[0] || "usuarios")}
                  value={form.referencedTable}
                  options={tabelaExistenteNaDB}
                  disabled={busy}
                />
              </div>

              <div>
                <label className={labelClass}>Coluna Referenciada</label>

                {/* ✅ JoinSelect automático se existir getTableColumns */}
                {useJoinForFieldReferences ? (
                  <div className="space-y-2">
                    <JoinSelect
                      onChange={(value) => updateFormField("fieldReferences", value)}
                      className="w-full bg-white border border-gray-300 rounded-xl"
                      placeholder={refColsLoading ? "Carregando colunas..." : "Ex: id"}
                      value={form.fieldReferences}
                      options={refCols}
                      disabled={busy || refColsLoading}
                    />
                    {refColsError && (
                      <p className="text-xs text-red-600 font-semibold">
                        {refColsError} (vou te deixar digitar se quiser: remove o loader ou trata no service)
                      </p>
                    )}
                    {!refColsLoading && !refColsError && refCols.length === 0 && (
                      <p className="text-xs text-gray-500 font-medium">
                        Nenhuma coluna encontrada para essa tabela (ou teu loader retornou vazio).
                      </p>
                    )}
                  </div>
                ) : (
                  <input
                    value={form.fieldReferences}
                    onChange={(e) => updateFormField("fieldReferences", e.target.value)}
                    className={`${inputClass} bg-white`}
                    placeholder="Ex: id"
                    disabled={busy}
                  />
                )}
              </div>
            </div>

            {isForeignKey && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-200 animate-in fade-in">
                <div>
                  <label className={labelClass}>Comportamento ON DELETE</label>
                  <JoinSelect
                    onChange={(value) => updateFormField("onDeleteAction", value)}
                    className="w-full bg-white border border-gray-300 rounded-xl"
                    placeholder="ON DELETE"
                    value={form.onDeleteAction}
                    options={["NO ACTION", "CASCADE", "SET NULL", "RESTRICT", "SET DEFAULT"]}
                    disabled={busy}
                  />
                </div>
                <div>
                  <label className={labelClass}>Comportamento ON UPDATE</label>
                  <JoinSelect
                    onChange={(value) => updateFormField("onUpdateAction", value)}
                    className="w-full bg-white border border-gray-300 rounded-xl"
                    placeholder="ON UPDATE"
                    value={form.onUpdateAction}
                    options={["NO ACTION", "CASCADE", "SET NULL", "RESTRICT", "SET DEFAULT"]}
                    disabled={busy}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-gray-50 border-t border-gray-200 gap-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span className="text-red-500">*</span> Campos obrigatórios
          </div>

          <div className="flex w-full sm:w-auto gap-3">
            {mode === "edit" && field?.nome && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                {t("actions.delete") || "Eliminar"}
              </button>
            )}

            <button
              type="button"
              onClick={safeClose}
              disabled={busy}
              className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-gray-300 shadow-sm disabled:opacity-50"
            >
              {t("actions.cancel") || "Cancelar"}
            </button>

            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={!isValid || busy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === "create" ? <Plus size={16} /> : <Save size={16} />}
              {busy ? (t("common.loading") || "Aguarde...") : primaryButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ToggleCard
const ToggleCard = ({
  label,
  checked,
  onChange,
  isPrimary = false,
  disabled = false,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  isPrimary?: boolean;
  disabled?: boolean;
  hint?: string;
}) => (
  <label
    title={hint}
    className={`
      flex flex-col justify-center items-center text-center p-3 rounded-xl border-2 transition-all select-none
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      ${
        checked
          ? isPrimary
            ? "bg-amber-50 border-amber-400 text-amber-900 shadow-sm"
            : "bg-blue-50 border-blue-400 text-blue-900 shadow-sm"
          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"
      }
    `}
  >
    <input
      type="checkbox"
      className="sr-only"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
    />
    {isPrimary && checked && <Key size={14} className="text-amber-500 mb-1" />}
    <span className="text-[11px] font-bold uppercase tracking-wider leading-tight">{label}</span>
  </label>
);

export default FieldModal;