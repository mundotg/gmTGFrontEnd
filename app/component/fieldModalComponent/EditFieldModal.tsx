"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  X,
  Save,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { CampoDetalhado, tipo_db_Options } from "@/types";
import { tiposPorBanco } from "@/constant";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { EMPTY_FORM, extractPrecisionScale, FieldModalProps, FORMDATA, isUnsignedFromType, stableStringify, toNumU } from "./utils";
import DefinicaoPrincipal from "./components/DefinicaoPrincipal";
import AtributosRestricoes from "./components/AtributosRestricoes";
import ChaveEstrangeira from "./components/ChaveEstrangeira";

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
  const isMongo = useMemo(() => dbType.includes("mongo"), [dbType]);
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
      const initialCreateForm: FORMDATA = {
        ...EMPTY_FORM,
        tipo: isMongo ? ("string" as any) : "",
      };
      setForm(initialCreateForm);
      syncInitialSnapshot(initialCreateForm);
    }
  }, [isOpen, mode, field, supportsUnsigned, isMongo, syncInitialSnapshot]);

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
      // Guarda apenas as propriedades que precisam de ser alteradas
      const updates: Partial<typeof prev> = {};
      let hasChanges = false;

      if (!supportsUnsigned && prev.isUnsigned) {
        updates.isUnsigned = false;
        hasChanges = true;
      }

      if (!shouldShowPrecisionScale && (prev.precision !== undefined || prev.scale !== undefined)) {
        updates.precision = undefined;
        updates.scale = undefined;
        hasChanges = true;
      }

      if (!shouldShowLength && prev.length !== undefined) {
        updates.length = undefined;
        hasChanges = true;
      }

      // Se houver mudanças, fazemos um único spread. Se não, retornamos o estado original intacto.
      return hasChanges ? { ...prev, ...updates } : prev;
    });
  }, [supportsUnsigned, shouldShowPrecisionScale, shouldShowLength]);
  // 👆 Removido o form.tipo, pois as booleanas acima já disparam este efeito quando necessário.

  const useJoinForFieldReferences = !!getTableColumns && form.referencedTable.trim().length > 0;

  // =========================
  // ✅ Validações Preventivas Inteligentes
  // =========================
  const nameValidationError = useMemo(() => {
    const raw = form.nome;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    if (isMongo) {
      if (trimmed.includes(".")) {
        return "No MongoDB, o nome do campo não pode conter ponto ('.'), pois é reservado para navegação em documentos aninhados.";
      }
      if (trimmed.startsWith("$")) {
        return "No MongoDB, o nome do campo não pode iniciar com '$' (reservado para operadores).";
      }
      if (mode === "create" && trimmed.toLowerCase() === "_id") {
        return "O campo '_id' é a chave primária reservada do MongoDB e já existe.";
      }
      if (trimmed.includes("\0")) {
        return "O nome do campo não pode conter caracteres nulos.";
      }
    } else {
      if (/\s/.test(trimmed)) {
        return "O nome da coluna não pode conter espaços.";
      }
      if (/[;'"\\]/.test(trimmed)) {
        return "O nome da coluna contém caracteres especiais não permitidos.";
      }
    }
    return null;
  }, [form.nome, isMongo, mode]);

  const defaultValueValidationError = useMemo(() => {
    if (!isMongo || !form.defaultValue || !form.defaultValue.trim()) return null;
    const val = form.defaultValue.trim();
    const tipo = (form.tipo || "").toLowerCase();

    if (["int", "long"].includes(tipo)) {
      if (val !== "NULL" && !/^-?\d+$/.test(val)) {
        return "Para campos inteiros, o valor padrão deve ser um número inteiro (ex: 0, 100) ou vazio/NULL.";
      }
    } else if (["double", "decimal", "number"].includes(tipo)) {
      if (val !== "NULL" && isNaN(Number(val))) {
        return "Para campos decimais/numéricos, o valor padrão deve ser um número válido ou vazio/NULL.";
      }
    } else if (["object", "array"].includes(tipo)) {
      if (val !== "NULL") {
        try {
          JSON.parse(val);
        } catch {
          return `Para tipo ${tipo}, o valor padrão deve ser um JSON válido (ex: ${tipo === "object" ? "{}" : "[]"}).`;
        }
      }
    }
    return null;
  }, [isMongo, form.defaultValue, form.tipo]);

  // =========================
  // ✅ Validação Global
  // =========================
  const isValid = useMemo(() => {
    // 1. Regras Base Universais (Criar e Editar)
    if (!form.nome.trim() || !form.tipo) return false;
    if (!initialTableName) return false;

    // Erros de nome ou valor padrão impedem submissão
    if (nameValidationError || defaultValueValidationError) return false;

    // 2. Regras exclusivas do modo Editar
    if (mode === "edit" && !field) return false;

    // 3. Regras Numéricas (Precisão e Tamanho)
    if (shouldShowPrecisionScale) {
      if (form.precision !== undefined && form.precision <= 0) return false;
      if (form.scale !== undefined && form.scale < 0) return false;
      if (form.precision !== undefined && form.scale !== undefined && form.scale > form.precision) return false;
    }

    if (shouldShowLength) {
      if (form.length !== undefined && form.length <= 0) return false;
    }

    // 4. Regra ENUM (apenas relacional)
    if (isEnumType && form.enumValues.length === 0) return false;

    // 5. Chave Estrangeira (apenas relacional)
    const hasRefTable = form.referencedTable.trim().length > 0;
    const hasRefField = form.fieldReferences.trim().length > 0;
    if ((hasRefTable && !hasRefField) || (!hasRefTable && hasRefField)) {
      return false;
    }

    return true;
  }, [
    form,
    initialTableName,
    nameValidationError,
    defaultValueValidationError,
    shouldShowPrecisionScale,
    shouldShowLength,
    mode,
    field,
    isEnumType,
  ]);

  const title = useMemo(() => {
    if (mode === "create") return isMongo ? "Criar Campo (MongoDB)" : (t("modals.createField") || "Criar Campo");
    return isMongo ? "Editar Campo (MongoDB)" : (t("modals.editField") || "Editar Campo");
  }, [mode, t, isMongo]);

  const primaryButtonText = useMemo(() => {
    if (mode === "create") return t("actions.create") || "Criar";
    return t("actions.saveChanges") || "Salvar alterações";
  }, [mode, t]);

  const extractFormError = (err: any): string => {
    const rawMsg =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message;

    if (typeof rawMsg === "string" && rawMsg.trim()) {
      const lower = rawMsg.toLowerCase();
      if (lower.includes("cannot use mongoclient after close") || lower.includes("mongoclient")) {
        return "A conexão com o MongoDB foi restabelecida no servidor. Por favor, tente clicar novamente em salvar.";
      }
      if (lower.includes("already exists") || lower.includes("duplicate") || lower.includes("já existe")) {
        return `Já existe um campo ou coluna com o nome '${form.nome.trim()}'.`;
      }
      return rawMsg;
    }

    try {
      return JSON.stringify(err?.response?.data || err);
    } catch {
      return "Erro inesperado ao comunicar com o servidor. Verifique os dados e tente novamente.";
    }
  };

  const handlePrimaryAction = useCallback(async () => {
    setErrorMsg(null);

    if (nameValidationError) {
      setErrorMsg(nameValidationError);
      return;
    }

    if (defaultValueValidationError) {
      setErrorMsg(defaultValueValidationError);
      return;
    }

    if (!isValid) {
      setErrorMsg("Preencha os campos obrigatórios corretamente.");
      return;
    }

    const table = initialTableName;
    if (!table) {
      setErrorMsg("Nome da tabela/coleção não informado.");
      return;
    }

    const baseField: Partial<CampoDetalhado> = mode === "edit" && field ? { ...field } : {};
    const isFk = !isMongo && !!form.referencedTable.trim() && !!form.fieldReferences.trim();

    const payloadField: CampoDetalhado & { tableName: string } = {
      ...baseField,
      nome: form.nome.trim(),
      tipo: form.tipo as tipo_db_Options,

      length: isMongo ? undefined : form.length,
      precision: isMongo ? undefined : form.precision,
      scale: isMongo ? undefined : form.scale,

      is_nullable: isMongo ? true : form.isNullable,
      is_unique: form.isUnique,
      is_primary_key: isMongo ? false : form.isPrimaryKey,
      is_auto_increment: isMongo ? false : form.isAutoIncrement,
      is_unsigned: isMongo ? false : form.isUnsigned,
      is_foreign_key: isFk,
      default: form.defaultValue && form.defaultValue.trim() !== "" ? form.defaultValue.trim() : undefined,
      comentario: form.comentario,
      enum_valores_encontrados: isMongo ? [] : form.enumValues,

      referenced_table: isFk ? form.referencedTable.trim() : null,
      field_references: isFk ? form.fieldReferences.trim() : null,
      on_delete_action: isFk ? form.onDeleteAction : undefined,
      on_update_action: isFk ? form.onUpdateAction : undefined,

      tableName: table,
    };

    setLocalBusy(true);
    try {
      if (mode === "create") {
        await onCreate(payloadField);
      } else {
        await onUpdate(payloadField);
      }

      syncInitialSnapshot(form);
      onClose();
    } catch (e: unknown) {
      const errorMessage = extractFormError(e);
      setErrorMsg(errorMessage);
    } finally {
      setLocalBusy(false);
    }
  }, [
    mode,
    isValid,
    nameValidationError,
    defaultValueValidationError,
    initialTableName,
    field,
    form,
    isMongo,
    onCreate,
    onUpdate,
    onClose,
    syncInitialSnapshot,
  ]);

  const handleDelete = useCallback(async () => {
    if (!field) return;

    const table = initialTableName;
    const col = field.nome;

    if (!table || !col) {
      setErrorMsg("Não foi possível identificar tabela/coluna.");
      return;
    }

    const term = isMongo ? "o campo" : "a coluna";
    const ok = window.confirm(`Eliminar ${term} '${col}'? Isso é destrutivo.`);
    if (!ok) return;

    setErrorMsg(null);
    setLocalBusy(true);
    try {
      await onDelete({ tableName: table, columnName: col });
      onClose();
    } catch (e: any) {
      setErrorMsg(extractFormError(e) || `Falha ao eliminar ${term}.`);
    } finally {
      setLocalBusy(false);
    }
  }, [field, initialTableName, onDelete, onClose, isMongo]);

  if (!isOpen) return null;

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
                  ? (isMongo ? "Crie um novo campo nos documentos desta coleção." : "Crie uma nova coluna na tabela selecionada.")
                  : (isMongo ? "Configure ou renomeie este campo na coleção." : (t("modals.editFieldDesc") || "Configure metadados e relacionamentos desta coluna."))}
              </p>
              {initialTableName && (
                <p className="mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  {isMongo ? "Coleção" : "Tabela"}: <span className="text-gray-600">{initialTableName}</span>
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
          <DefinicaoPrincipal
            form={form}
            updateFormField={updateFormField}
            busy={busy}
            shouldShowLength={shouldShowLength}
            shouldShowPrecisionScale={shouldShowPrecisionScale}
            isFloatType={isFloatType}
            userDbType={user?.info_extra?.type}
            tiposPorBanco={tiposPorBanco}
            t={t}
            nameError={nameValidationError}
            mode={mode}
          />

          <AtributosRestricoes
            form={form}
            updateFormField={updateFormField}
            dbType={dbType}
            isEnumType={isEnumType}
            busy={busy}
            supportsUnsigned={supportsUnsigned}
            t={t}
          />

          {/* Foreign Key - não aplicável no MongoDB */}
          {!isMongo && (
            <ChaveEstrangeira
              form={form}
              updateFormField={updateFormField}
              busy={busy}
              isForeignKey={isForeignKey}
              useJoinForFieldReferences={useJoinForFieldReferences}
              tabelaExistenteNaDB={tabelaExistenteNaDB}
              getTableColumns={getTableColumns} // 🔥 GARANTIDO!
            />
          )}
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
export default FieldModal;