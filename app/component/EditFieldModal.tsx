"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { X, Save, Plus, Trash2 } from "lucide-react";
import { CampoDetalhado, tipo_db_Options } from "@/types";
import { tiposPorBanco } from "@/constant";
import { useSession } from "@/context/SessionContext";
import { extrairTipoBase, mapColumnTypeToDbType } from "../services";
import { JoinSelect } from "./BuildQueryComponent/JoinSelect";

interface EditFieldModalProps {
  isOpen: boolean;
  tabelaExistenteNaDB: string[];
  onClose: () => void;
  field: CampoDetalhado | null;
  onSave: (updatedField: CampoDetalhado & { tableName: string }) => void;
}

const defaultValueOptions: Record<string, string[]> = {
  varchar: ["", "NULL", "CURRENT_USER", "UNKNOWN"],
  text: ["", "NULL", "PENDING", "DRAFT"],
  int: ["0", "1", "-1", "NULL"],
  bigint: ["0", "1", "-1", "NULL"],
  decimal: ["0.00", "1.00", "NULL"],
  float: ["0.0", "1.0", "NULL"],
  boolean: ["true", "false", "NULL"],
  date: ["NULL", "CURRENT_DATE"],
  datetime: ["NULL", "CURRENT_TIMESTAMP", "NOW()"],
  timestamp: ["NULL", "CURRENT_TIMESTAMP", "NOW()"],
};

interface FORMDATA {
    nome: string;
    tipo: tipo_db_Options | "";
    length: number | undefined;
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
const EditFieldModal: React.FC<EditFieldModalProps> = ({
  isOpen,
  tabelaExistenteNaDB,
  onClose,
  field,
  onSave,
}) => {
  const { user } = useSession();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FORMDATA>({
    nome: "",
    tipo: "",
    length: undefined as number | undefined,
    isNullable: false,
    isUnique: false,
    isPrimaryKey: false,
    isAutoIncrement: false,
    defaultValue: "",
    comentario: "",
    enumValues: [] as string[],
    newEnumValue: "",
    referencedTable: "",
    fieldReferences: "",
    onDeleteAction: "NO ACTION",
    onUpdateAction: "NO ACTION",
  });

  // Atualiza formulário ao abrir
  useEffect(() => {
    if (field) {
      setForm({
        nome: field.nome || "",
        tipo: field.tipo || "",
        length: field.length || undefined,
        isNullable: field.is_nullable || false,
        isUnique: field.is_unique || false,
        isPrimaryKey: field.is_primary_key || false,
        isAutoIncrement: field.is_auto_increment || false,
        defaultValue: field.default || "",
        comentario: field.comentario || "",
        enumValues: field.enum_valores_encontrados || [],
        newEnumValue: "",
        referencedTable: field.referenced_table || "",
        fieldReferences: field.field_references || "",
        onDeleteAction: field.on_delete_action ?? "NO ACTION",
        onUpdateAction: field.on_update_action ?? "NO ACTION",
      });
    }
  }, [field]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Fechar clicando fora
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Handler genérico
  const updateFormField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Salvar alterações
  const handleSave = useCallback(() => {
    if (!field) return;
    const updatedField: CampoDetalhado & { tableName: string } = {
      ...field,
      nome: form.nome,
      tipo: form.tipo as tipo_db_Options,
      length: form.length,
      is_nullable: form.isNullable,
      is_unique: form.isUnique,
      is_primary_key: form.isPrimaryKey,
      is_auto_increment: form.isAutoIncrement,
      default: form.defaultValue,
      comentario: form.comentario,
      enum_valores_encontrados: form.enumValues,
      referenced_table: form.referencedTable,
      field_references: form.fieldReferences,
      on_delete_action: form.onDeleteAction,
      on_update_action: form.onUpdateAction,
      tableName: "",
    };
    onSave(updatedField);
    onClose();
  }, [field, form, onSave, onClose]);

  // ENUM
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

  const handleEnumKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEnumValue();
    }
  };

  // Valores derivados
  const currentDefaults = useMemo( () =>  {

    if(form.enumValues.length>0)
      return form.enumValues
    return  defaultValueOptions[mapColumnTypeToDbType(extrairTipoBase(form.tipo))] || ["", "NULL"]
  },
    [form.tipo,form.enumValues]
  );

  const isEnumType = useMemo(
    () =>
      form.tipo.toLowerCase().includes("enum") ||
      (field?.enum_valores_encontrados?.length ?? 0) > 0,
    [form.tipo, field]
  );

  const isForeignKey = useMemo(
    () => !!form.referencedTable && !!form.fieldReferences,
    [form.referencedTable, form.fieldReferences]
  );

  if (!isOpen || !field) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 text-black"
      onClick={handleOutsideClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-field-title"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="edit-field-title" className="text-xl font-semibold text-gray-900">
            Editar Campo: <span className="text-blue-600">{field.nome}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid gap-6 md:grid-cols-2">
          {/* Nome */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do campo *
            </label>
            <input
              value={form.nome}
              onChange={(e) => updateFormField("nome", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: usuario_id, nome_completo..."
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo *
            </label>
            <select
              value={form.tipo}
              onChange={(e) => updateFormField("tipo", e.target.value as tipo_db_Options)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>
                -- Selecione o tipo --
              </option>
              {user?.info_extra?.type &&
                tiposPorBanco[user?.info_extra?.type].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.toUpperCase()}
                  </option>
                ))}
              {user?.info_extra?.type &&
                !tiposPorBanco[user?.info_extra?.type].includes(form.tipo as tipo_db_Options) && (
                  <option key={"opt+" + form.tipo} value={form.tipo}>
                    {form.tipo.toUpperCase()}
                  </option>
                )}
            </select>
          </div>

          {/* Tamanho */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamanho
            </label>
            <input
              type="number"
              value={form.length || ""}
              onChange={(e) =>
                updateFormField("length", e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: 255, 50..."
            />
          </div>

          {/* Valor padrão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Padrão
            </label>
            <select
              value={form.defaultValue}
              onChange={(e) => updateFormField("defaultValue", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {currentDefaults.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "" ? "-- Sem valor padrão --" : opt}
                </option>
              ))}
            </select>
          </div>

          {/* Comentário */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentário
            </label>
            <textarea
              value={form.comentario}
              onChange={(e) => updateFormField("comentario", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Descrição do campo..."
            />
          </div>

          {/* ENUM */}
          {isEnumType && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valores ENUM
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  value={form.newEnumValue}
                  onChange={(e) => updateFormField("newEnumValue", e.target.value)}
                  onKeyDown={handleEnumKeyDown}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Adicionar novo valor ENUM"
                />
                <button
                  type="button"
                  onClick={addEnumValue}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>
              <ul className="space-y-2">
                {form.enumValues.map((val, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center px-3 py-2 border rounded-lg bg-gray-50"
                  >
                    <span>{val}</span>
                    <button
                      type="button"
                      onClick={() => removeEnumValue(i)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Flags */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isNullable}
              onChange={(e) => updateFormField("isNullable", e.target.checked)}
            />
            <label>Aceita NULL</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isUnique}
              onChange={(e) => updateFormField("isUnique", e.target.checked)}
            />
            <label>Único</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPrimaryKey}
              onChange={(e) => updateFormField("isPrimaryKey", e.target.checked)}
            />
            <label>Chave Primária</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isAutoIncrement}
              onChange={(e) => updateFormField("isAutoIncrement", e.target.checked)}
            />
            <label>Auto Increment</label>
          </div>

          {/* Foreign Key */}
          <div className="md:col-span-2 border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">Chave Estrangeira</h3>
            <label className="block text-sm mb-1">Tabela Referenciada</label>
            <JoinSelect onChange={(value) => updateFormField("referencedTable", value)}
              className="w-full px-3 py-2 border rounded-lg mb-2"
              placeholder={"Ex: " + tabelaExistenteNaDB[0]}
              value={form.referencedTable}
              options={tabelaExistenteNaDB} />
            <label className="block text-sm mb-1">Coluna Referenciada</label>
            <input
              value={form.fieldReferences}
              onChange={(e) => updateFormField("fieldReferences", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-2"
              placeholder="Ex: id"
            />
            {isForeignKey && (
              <>
                <label className="block text-sm mb-1">Ação ON DELETE</label>
                <JoinSelect onChange={(value) => updateFormField("onDeleteAction", value)}
                  className="w-full px-3 py-2 border rounded-lg mb-2"
                  placeholder="Ação ON UPDATE"
                  value={form.onDeleteAction}
                  options={["NO ACTION", "CASCADE", "SET NULL", "RESTRICT"]} />


                <label className="block text-sm mb-1">Ação ON UPDATE</label>
                <JoinSelect onChange={(value) => updateFormField("onUpdateAction", value)}
                  className="w-full px-3 py-2 border rounded-lg mb-2"
                  placeholder="Ação ON UPDATE"
                  value={form.onUpdateAction}
                  options={["NO ACTION", "CASCADE", "SET NULL", "RESTRICT"]} />

              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">* Campos obrigatórios</div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!form.nome.trim() || !form.tipo}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditFieldModal;
