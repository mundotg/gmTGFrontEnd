"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Save, Plus, Trash2, Database, FileText, ShieldCheck } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { TableInfoCreate } from "@/types";

type ModalMode = "create" | "edit";

export interface TableModalProps {
  mode: ModalMode;
  isOpen: boolean;

  oldName?: string;
  oldSchema?: string;

  table?: TableInfoCreate | null;

  schemas: string[];
  engines?: string[];
  charsets?: string[];
  collations?: string[];

  isBusy?: boolean;
  onClose: () => void;

  onCreate: (payload: TableInfoCreate & { ifNotExists?: boolean }) => Promise<void> | void;
  onUpdate: (payload: { oldName: string; oldSchema?: string } & TableInfoCreate) => Promise<void> | void;
  onDelete: (ctx: { name: string; schema?: string }) => Promise<void> | void;
}

type FORMDATA = {
  name: string;
  schema: string;
  comment: string;

  ifNotExists: boolean;
  temporary: boolean;

  engine: string;
  charset: string;
  collation: string;
};

const EMPTY: FORMDATA = {
  name: "",
  schema: "",
  comment: "",
  ifNotExists: true,
  temporary: false,
  engine: "",
  charset: "",
  collation: "",
};

const sjson = (x: any) => {
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
};

const TableModal: React.FC<TableModalProps> = ({
  mode,
  isOpen,
  oldName,
  oldSchema,
  table,
  schemas,
  engines,
  charsets,
  collations,
  isBusy,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [localBusy, setLocalBusy] = useState(false);
  const busy = !!isBusy || localBusy;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<FORMDATA>(EMPTY);

  const snapRef = useRef(sjson(EMPTY));
  const syncSnapshot = useCallback((next: FORMDATA) => (snapRef.current = sjson(next)), []);
  const isDirty = useMemo(() => sjson(form) !== snapRef.current, [form]);

  const safeClose = useCallback(() => {
    if (busy) return;
    if (isDirty) {
      const ok = window.confirm(t("common.unsavedClose") || "Tens alterações não salvas. Fechar mesmo assim?");
      if (!ok) return;
    }
    onClose();
  }, [busy, isDirty, onClose, t]);

  const setK = useCallback(<K extends keyof FORMDATA>(k: K, v: FORMDATA[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
  }, []);

  const title = useMemo(
    () => (mode === "create" ? t("modals.createTable") || "Criar Tabela" : t("modals.editTable") || "Editar Tabela"),
    [mode, t]
  );

  const subtitle = useMemo(
    () =>
      mode === "create"
        ? t("modals.createTableDesc") || "Crie uma nova tabela no schema selecionado."
        : t("modals.editTableDesc") || "Altere metadados e configurações desta tabela.",
    [mode, t]
  );

  const primaryText = useMemo(
    () => (mode === "create" ? t("actions.create") || "Criar" : t("actions.saveChanges") || "Salvar alterações"),
    [mode, t]
  );

  // Prefill/reset quando abrir
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);

    if (mode === "edit" && !table) {
      setForm(EMPTY);
      syncSnapshot(EMPTY);
      setErrorMsg(t("tableForm.selectToEdit") || "Selecione uma tabela para editar.");
      return;
    }

    if (mode === "edit" && table) {
      const next: FORMDATA = {
        ...EMPTY,
        name: table.name || "",
        schema: table.schema || "",
        comment: table.comment || "",
        temporary: !!table.temporary,
        engine: table.engine || "",
        charset: table.charset || "",
        collation: table.collation || "",
        ifNotExists: false,
      };
      setForm(next);
      syncSnapshot(next);
      setShowAdvanced(!!(next.engine || next.charset || next.collation));
      return;
    }

    // create
    const next: FORMDATA = { ...EMPTY, schema: schemas?.[0] ?? "", ifNotExists: true };
    setForm(next);
    syncSnapshot(next);
    setShowAdvanced(false);
  }, [isOpen, mode, table, schemas, syncSnapshot, t]);

  // ESC fecha
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") safeClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, safeClose]);

  const onBackdropClick = (e: React.MouseEvent) => {
    if (busy) return;
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) safeClose();
  };

  const isValid = useMemo(() => {
    const nm = form.name.trim();
    return !!nm && !/\s/.test(nm);
  }, [form.name]);

  const resolveOld = useCallback(() => {
    const n = (oldName ?? table?.name ?? "").trim();
    const s = (oldSchema ?? table?.schema ?? "").trim();
    return { oldName: n, oldSchema: s || undefined };
  }, [oldName, oldSchema, table]);

  const handlePrimary = useCallback(async () => {
    setErrorMsg(null);
    if (!isValid) {
      setErrorMsg(t("tableForm.invalidName") || "Preencha o nome corretamente (sem espaços).");
      return;
    }

    setLocalBusy(true);
    try {
      const payload: TableInfoCreate = {
        name: form.name.trim(),
        schema: form.schema || undefined,
        comment: form.comment.trim() || undefined,
        temporary: form.temporary,
        engine: form.engine || undefined,
        charset: form.charset || undefined,
        collation: form.collation || undefined,
      };

      if (mode === "create") {
        await onCreate({ ...payload, ifNotExists: form.ifNotExists });
      } else {
        const old = resolveOld();
        if (!old.oldName) {
          setErrorMsg(t("tableForm.missingOldName") || "Tabela atual não informada.");
          return;
        }
        await onUpdate({ ...payload, ...old });
      }

      syncSnapshot(form);
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || (t("common.operationFailed") || "Falha ao executar operação."));
    } finally {
      setLocalBusy(false);
    }
  }, [form, isValid, mode, onCreate, onUpdate, onClose, resolveOld, syncSnapshot, t]);

  const handleDelete = useCallback(async () => {
    const name = (oldName ?? table?.name ?? "").trim();
    const schema = (oldSchema ?? table?.schema ?? "").trim();
    if (!name) return;

    const full = schema ? `${schema}.${name}` : name;
    const ok = window.confirm(
      (t("tableForm.confirmDelete") || "Eliminar a tabela '{full}'? Isso é destrutivo.").replace("{full}", full)
    );
    if (!ok) return;

    setErrorMsg(null);
    setLocalBusy(true);
    try {
      await onDelete({ name, schema: schema || undefined });
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || (t("tableForm.deleteFailed") || "Falha ao eliminar tabela."));
    } finally {
      setLocalBusy(false);
    }
  }, [oldName, oldSchema, table, onDelete, onClose, t]);

  if (!isOpen) return null;

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors placeholder:text-gray-400";
  const labelClass =
    "block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1 flex items-center gap-1.5";

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200"
      >
        {/* Topbar */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Database size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {title}
                {mode === "edit" ? (
                  <>
                    : <span className="text-blue-600">{form.name || table?.name || oldName}</span>
                  </>
                ) : null}
              </h2>
              <p className="text-xs font-medium text-gray-500">{subtitle}</p>
              {mode === "edit" && (oldSchema ?? table?.schema) ? (
                <p className="mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Schema: <span className="text-gray-600">{oldSchema ?? table?.schema}</span>
                </p>
              ) : null}
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
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {errorMsg && (
            <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm font-semibold">
              ❌ {errorMsg}
            </div>
          )}

          {/* Principal */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Database size={16} className="text-blue-600" /> {t("tableForm.main") || "Definição Principal"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelClass}>
                  {t("tableForm.nameLabel") || "Nome da tabela"} <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setK("name", e.target.value)}
                  className={inputClass}
                  placeholder={t("tableForm.namePlaceholder") || "Ex: usuarios"}
                  disabled={busy}
                />
                {/\s/.test(form.name) && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {t("tableForm.noSpaces") || "O nome não deve conter espaços."}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>{t("tableForm.schemaLabel") || "Schema (opcional)"}</label>
                <select
                  value={form.schema}
                  onChange={(e) => setK("schema", e.target.value)}
                  className={`${inputClass} appearance-none cursor-pointer`}
                  disabled={busy}
                >
                  <option value="">{t("tableForm.defaultSchema") || "(padrão)"}</option>
                  {schemas.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  <FileText size={14} /> {t("fields.comment") || "Comentário / Descrição"}
                </label>
                <input
                  value={form.comment}
                  onChange={(e) => setK("comment", e.target.value)}
                  className={inputClass}
                  placeholder={t("tableForm.commentPlaceholder") || "Ex: Tabela de usuários do sistema"}
                  disabled={busy}
                />
              </div>
            </div>
          </div>

          {/* Opções */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600" /> {t("tableForm.options") || "Opções"}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <ToggleCard
                label="IF NOT EXISTS"
                checked={mode === "create" ? form.ifNotExists : false}
                onChange={(v) => setK("ifNotExists", v)}
                disabled={busy || mode !== "create"}
                hint={
                  mode !== "create"
                    ? t("tableForm.onlyCreate") || "Só disponível ao criar."
                    : t("tableForm.ifNotExistsHint") || "Evita erro se a tabela já existir."
                }
              />

              <ToggleCard
                label="TEMPORARY"
                checked={form.temporary}
                onChange={(v) => setK("temporary", v)}
                disabled={busy}
                hint={t("tableForm.temporaryHint") || "Alguns bancos suportam tabelas temporárias."}
              />

              <ToggleCard
                label={
                  showAdvanced
                    ? t("tableForm.hideAdvanced") || "Ocultar Avançado"
                    : t("tableForm.showAdvanced") || "Mostrar Avançado"
                }
                checked={showAdvanced}
                onChange={setShowAdvanced}
                disabled={busy}
                hint={t("tableForm.advancedHint") || "Engine/Charset/Collation (principalmente MySQL/MariaDB)"}
              />
            </div>
          </div>

          {showAdvanced && (
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-5">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600" /> {t("tableForm.advanced") || "Configurações Avançadas"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectOrInput
                  label="Engine"
                  value={form.engine}
                  setValue={(v) => setK("engine", v)}
                  options={engines}
                  placeholder="Ex: InnoDB"
                  disabled={busy}
                  inputClass={inputClass}
                  labelClass={labelClass}
                />
                <SelectOrInput
                  label="Charset"
                  value={form.charset}
                  setValue={(v) => setK("charset", v)}
                  options={charsets}
                  placeholder="Ex: utf8mb4"
                  disabled={busy}
                  inputClass={inputClass}
                  labelClass={labelClass}
                />
                <div className="md:col-span-2">
                  <SelectOrInput
                    label="Collation"
                    value={form.collation}
                    setValue={(v) => setK("collation", v)}
                    options={collations}
                    placeholder="Ex: utf8mb4_0900_ai_ci"
                    disabled={busy}
                    inputClass={inputClass}
                    labelClass={labelClass}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 font-medium">
                {t("tableForm.advancedTip") ||
                  "Dica: Engine/Charset/Collation são mais relevantes em MySQL/MariaDB. Em outros bancos, pode ser ignorado pelo backend (sem drama)."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gray-50 border-t border-gray-200">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span className="text-red-500">*</span> {t("tableForm.required") || "Campos obrigatórios"}
          </div>

          <div className="flex w-full sm:w-auto gap-3">
            {mode === "edit" && (oldName || table?.name) && (
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
              onClick={handlePrimary}
              disabled={!isValid || busy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === "create" ? <Plus size={16} /> : <Save size={16} />}
              {busy ? t("common.loading") || "Aguarde..." : primaryText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleCard = ({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
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
          ? "bg-blue-50 border-blue-400 text-blue-900 shadow-sm"
          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"
      }
    `}
  >
    <input type="checkbox" className="sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    <span className="text-[11px] font-bold uppercase tracking-wider leading-tight">{label}</span>
  </label>
);

const SelectOrInput = ({
  label,
  value,
  setValue,
  options,
  placeholder,
  disabled,
  inputClass,
  labelClass,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  options?: string[];
  placeholder: string;
  disabled: boolean;
  inputClass: string;
  labelClass: string;
}) => (
  <div>
    <label className={labelClass}>{label}</label>
    {options?.length ? (
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`${inputClass} appearance-none cursor-pointer`}
        disabled={disabled}
      >
        <option value="">(padrão)</option>
        {options.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
    ) : (
      <input value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} placeholder={placeholder} disabled={disabled} />
    )}
  </div>
);

export default TableModal;