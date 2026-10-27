"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Save,
  Plus,
  Trash2,
  Code,
  List,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Database,
  FileJson,
  RotateCcw,
  Info,
} from "lucide-react";
import api from "@/context/axioCuston";
import { CampoDetalhado } from "@/types";
import { useI18n } from "@/context/I18nContext";

export type MongoFieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "array"
  | "object"
  | "objectId";

export interface MongoVisualField {
  id: string;
  key: string;
  type: MongoFieldType;
  value: string;
}

export interface CriarDocumentoMongoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  schemaName?: string | null;
  knownColumns?: CampoDetalhado[];
  onSaveSuccess?: (document: Record<string, any>) => void;
}

export const CriarDocumentoMongoModal: React.FC<CriarDocumentoMongoModalProps> = ({
  isOpen,
  onClose,
  tableName,
  schemaName,
  knownColumns = [],
  onSaveSuccess,
}) => {
  const { t } = useI18n();

  // Modo: "visual" (construtor de chave/valor) ou "json" (editor JSON em código)
  const [activeTab, setActiveTab] = useState<"visual" | "json">("visual");

  // Estado do modo visual
  const [autoGenerateId, setAutoGenerateId] = useState(true);
  const [customId, setCustomId] = useState("");
  const [fields, setFields] = useState<MongoVisualField[]>([]);

  // Estado do modo JSON
  const [jsonText, setJsonText] = useState("{\n  \n}");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Estados gerais
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Nome da coleção / target table
  const collectionName = useMemo(() => {
    const raw = (tableName || "").trim();
    if (raw.includes(".")) return raw;
    return schemaName ? `${schemaName}.${raw}` : raw;
  }, [tableName, schemaName]);

  const displayName = useMemo(() => {
    const parts = (tableName || "").split(".");
    return parts[parts.length - 1] || tableName || "colecao";
  }, [tableName]);

  // Inicialização quando o modal abre
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setAutoGenerateId(true);
    setCustomId("");

    // Se temos colunas conhecidas da coleção (diferentes de _id), inicializa com elas
    const relevantCols = (knownColumns || []).filter(
      (c) => c.nome !== "_id" && c.nome !== "id"
    );

    if (relevantCols.length > 0) {
      const initial: MongoVisualField[] = relevantCols.map((c, idx) => {
        let detectedType: MongoFieldType = "string";
        const t = (c.tipo || "").toLowerCase();
        if (t.includes("int") || t.includes("float") || t.includes("number") || t.includes("double")) {
          detectedType = "number";
        } else if (t.includes("bool")) {
          detectedType = "boolean";
        } else if (t.includes("date") || t.includes("time")) {
          detectedType = "date";
        } else if (t.includes("array") || t.includes("list")) {
          detectedType = "array";
        } else if (t.includes("json") || t.includes("object")) {
          detectedType = "object";
        }

        return {
          id: `field_${Date.now()}_${idx}`,
          key: c.nome,
          type: detectedType,
          value: detectedType === "boolean" ? "true" : "",
        };
      });
      setFields(initial);

      // Prepara o JSON inicial espelhando os campos
      const sampleObj: Record<string, any> = {};
      initial.forEach((f) => {
        sampleObj[f.key] = f.type === "number" ? 0 : f.type === "boolean" ? true : "";
      });
      setJsonText(JSON.stringify(sampleObj, null, 2));
    } else {
      // Coleção vazia: começa com um campo vazio
      const defaultField: MongoVisualField = {
        id: `field_${Date.now()}_0`,
        key: "",
        type: "string",
        value: "",
      };
      setFields([defaultField]);
      setJsonText("{\n  \n}");
    }
  }, [isOpen, knownColumns]);

  // Validar JSON em tempo real no modo editor
  useEffect(() => {
    if (activeTab !== "json") return;
    try {
      if (!jsonText.trim()) {
        setJsonError("O JSON não pode estar vazio.");
        return;
      }
      JSON.parse(jsonText);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || "Sintaxe JSON inválida");
    }
  }, [jsonText, activeTab]);

  // Adicionar novo campo visual
  const handleAddField = useCallback((type: MongoFieldType = "string") => {
    const newField: MongoVisualField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      key: "",
      type,
      value: type === "boolean" ? "true" : type === "number" ? "0" : "",
    };
    setFields((prev) => [...prev, newField]);
  }, []);

  // Remover campo visual
  const handleRemoveField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Atualizar campo visual
  const handleUpdateField = useCallback(
    (id: string, prop: keyof MongoVisualField, val: any) => {
      setFields((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          if (prop === "type") {
            let defaultValue = f.value;
            if (val === "boolean") defaultValue = "true";
            else if (val === "number" && isNaN(Number(f.value))) defaultValue = "0";
            else if (val === "array" && !f.value.startsWith("[")) defaultValue = "[]";
            else if (val === "object" && !f.value.startsWith("{")) defaultValue = "{}";
            return { ...f, type: val as MongoFieldType, value: defaultValue };
          }
          return { ...f, [prop]: val };
        })
      );
    },
    []
  );

  // Sincronizar Visual -> JSON quando o utilizador muda de tab
  const handleSwitchTab = (tab: "visual" | "json") => {
    if (tab === "json" && activeTab === "visual") {
      // Monta objeto a partir dos campos visuais
      const doc: Record<string, any> = {};
      if (!autoGenerateId && customId.trim()) {
        doc["_id"] = customId.trim();
      }
      fields.forEach((f) => {
        const k = f.key.trim();
        if (!k) return;
        if (f.type === "number") {
          const num = Number(f.value);
          doc[k] = isNaN(num) ? 0 : num;
        } else if (f.type === "boolean") {
          doc[k] = f.value === "true";
        } else if (f.type === "array") {
          try {
            doc[k] = JSON.parse(f.value);
          } catch {
            doc[k] = f.value ? [f.value] : [];
          }
        } else if (f.type === "object") {
          try {
            doc[k] = JSON.parse(f.value);
          } catch {
            doc[k] = {};
          }
        } else {
          doc[k] = f.value;
        }
      });
      setJsonText(JSON.stringify(doc, null, 2));
    } else if (tab === "visual" && activeTab === "json") {
      // Monta campos a partir do JSON se for válido
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const newFields: MongoVisualField[] = [];
          if (parsed._id) {
            setAutoGenerateId(false);
            setCustomId(String(parsed._id));
          } else {
            setAutoGenerateId(true);
            setCustomId("");
          }

          Object.entries(parsed).forEach(([k, v], idx) => {
            if (k === "_id") return;
            let ftype: MongoFieldType = "string";
            let fval = "";
            if (typeof v === "number") {
              ftype = "number";
              fval = String(v);
            } else if (typeof v === "boolean") {
              ftype = "boolean";
              fval = v ? "true" : "false";
            } else if (Array.isArray(v)) {
              ftype = "array";
              fval = JSON.stringify(v);
            } else if (typeof v === "object" && v !== null) {
              ftype = "object";
              fval = JSON.stringify(v);
            } else {
              ftype = "string";
              fval = v === null ? "" : String(v);
            }

            newFields.push({
              id: `field_sync_${Date.now()}_${idx}`,
              key: k,
              type: ftype,
              value: fval,
            });
          });

          if (newFields.length > 0) {
            setFields(newFields);
          }
        }
      } catch {
        // Se JSON inválido, não quebra a tab mas avisa
        console.warn("JSON inválido para converter para modo visual");
      }
    }
    setActiveTab(tab);
  };

  // Formatar JSON
  const handlePrettifyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || "Erro de sintaxe JSON");
    }
  };

  // Exemplo rápido
  const handleLoadTemplate = (type: "completo" | "vazio") => {
    if (type === "vazio") {
      setFields([]);
      setJsonText("{\n  \n}");
      return;
    }

    const template = {
      titulo: "Exemplo MongoDB",
      descricao: "Novo documento flexível",
      quantidade: 10,
      ativo: true,
      tags: ["mongodb", "nosql", "documento"],
      metadata: {
        criadoPor: "MustaInf",
        versao: "1.0",
      },
      criadoEm: new Date().toISOString(),
    };

    setJsonText(JSON.stringify(template, null, 2));
    if (activeTab === "visual") {
      handleSwitchTab("visual");
    }
  };

  // Enviar para o backend
  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    let documentToInsert: Record<string, any> = {};

    if (activeTab === "json") {
      try {
        const parsed = JSON.parse(jsonText);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          setErrorMessage("O documento deve ser um objeto JSON (ex: { ... }).");
          return;
        }
        documentToInsert = parsed;
      } catch (err: any) {
        setErrorMessage(`JSON inválido: ${err.message}`);
        return;
      }
    } else {
      // Modo visual
      if (!autoGenerateId && customId.trim()) {
        documentToInsert["_id"] = customId.trim();
      }

      for (const f of fields) {
        const k = f.key.trim();
        if (!k) continue;

        if (f.type === "number") {
          const num = Number(f.value);
          documentToInsert[k] = isNaN(num) ? 0 : num;
        } else if (f.type === "boolean") {
          documentToInsert[k] = f.value === "true";
        } else if (f.type === "array") {
          try {
            documentToInsert[k] = JSON.parse(f.value || "[]");
          } catch {
            setErrorMessage(`Campo '${k}': Array JSON inválido.`);
            return;
          }
        } else if (f.type === "object") {
          try {
            documentToInsert[k] = JSON.parse(f.value || "{}");
          } catch {
            setErrorMessage(`Campo '${k}': Objeto JSON inválido.`);
            return;
          }
        } else {
          documentToInsert[k] = f.value;
        }
      }
    }

    if (Object.keys(documentToInsert).length === 0) {
      setErrorMessage("Por favor, adicione pelo menos um campo ou propriedade ao documento.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Converte o objeto do documento para a estrutura compatível com InsertRequest
      // { createdRow: { [collectionName]: { [field]: { value: string, type_column: string } } } }
      const formattedFields: Record<string, { value: string; type_column: string }> = {};

      // Mapeamento de tipos definidos visualmente (se houver)
      const visualTypesMap = new Map<string, string>();
      if (activeTab === "visual") {
        fields.forEach((f) => {
          const k = f.key.trim();
          if (k) visualTypesMap.set(k, f.type);
        });
      }

      Object.entries(documentToInsert).forEach(([colKey, colVal]) => {
        if (colVal === null || colVal === undefined) return;

        let typeCol = visualTypesMap.get(colKey) || "string";
        let strVal = String(colVal);

        if (colKey === "_id") {
          typeCol = "objectid";
          strVal = String(colVal);
        } else if (typeof colVal === "number") {
          typeCol = Number.isInteger(colVal) ? "int" : "float";
          strVal = String(colVal);
        } else if (typeof colVal === "boolean") {
          typeCol = "bool";
          strVal = colVal ? "true" : "false";
        } else if (Array.isArray(colVal)) {
          typeCol = "array";
          strVal = JSON.stringify(colVal);
        } else if (typeof colVal === "object" && colVal !== null) {
          typeCol = "object";
          strVal = JSON.stringify(colVal);
        } else if (typeof colVal === "string") {
          const trimmed = colVal.trim();
          if (typeCol === "date" || /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(trimmed)) {
            typeCol = "date";
          }
          strVal = trimmed;
        }

        formattedFields[colKey] = {
          value: strVal,
          type_column: typeCol,
        };
      });

      const payload = {
        createdRow: {
          [collectionName]: formattedFields,
        },
      };

      const res = await api.post("/exe/insert_row", payload, {
        withCredentials: true,
      });

      setSuccessMessage("✅ Documento inserido com sucesso na coleção MongoDB!");
      onSaveSuccess?.(documentToInsert);

      // Emite evento para os componentes atualizarem
      window.dispatchEvent(
        new CustomEvent("schema:changed", {
          detail: { table: tableName, mongoDocInserted: true },
        })
      );

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      console.error("Erro ao inserir documento MongoDB:", err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Falha ao inserir documento no MongoDB.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-gray-900 dark:text-gray-100">
        {/* Header com identidade MongoDB */}
        <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-emerald-500/10 via-transparent to-blue-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold truncate">
                  Inserir Documento MongoDB
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  🍃 Schemaless BSON
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Coleção: <span className="font-semibold text-gray-700 dark:text-gray-300">{displayName}</span>
                {schemaName && <span className="ml-1 opacity-70">({schemaName})</span>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Tabs & Ações Rápidas */}
        <div className="px-5 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/70 dark:bg-black/20 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-200/70 dark:bg-gray-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => handleSwitchTab("visual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "visual"
                  ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Campos Chave-Valor</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab("json")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "json"
                  ? "bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Editor JSON Direto</span>
            </button>
          </div>

          {/* Quick templates */}
          <div className="flex items-center gap-2">
            {activeTab === "json" && (
              <button
                type="button"
                onClick={handlePrettifyJson}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1"
                title="Formatar identação do JSON"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Formatar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleLoadTemplate("completo")}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex items-center gap-1"
              title="Carregar exemplo estruturado"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Exemplo</span>
            </button>

            <button
              type="button"
              onClick={() => handleLoadTemplate("vazio")}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center gap-1"
              title="Limpar todos os campos"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-800 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeTab === "visual" ? (
            <div className="space-y-4">
              {/* Opção para o _id */}
              <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="auto-id-mongo"
                    checked={autoGenerateId}
                    onChange={(e) => setAutoGenerateId(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <label
                    htmlFor="auto-id-mongo"
                    className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer"
                  >
                    Gerar identificador <code className="text-emerald-600 dark:text-emerald-400">_id</code> automaticamente pelo MongoDB (ObjectId)
                  </label>
                </div>

                {!autoGenerateId && (
                  <div className="flex items-center gap-2 sm:max-w-xs w-full">
                    <span className="text-xs text-gray-500 font-mono">_id:</span>
                    <input
                      type="text"
                      placeholder="Valor personalizado ou 24 hex"
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Informação didática sobre NoSQL */}
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                <span>
                  No MongoDB os documentos são <strong>flexíveis</strong>. Podes adicionar novos campos dinamicamente, tipos mistos, listas ou sub-documentos sem alterar o esquema da coleção!
                </span>
              </div>

              {/* Lista de Campos Dinâmicos */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Propriedades do Documento ({fields.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddField("string")}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Campo
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-xl border-gray-300 dark:border-gray-700">
                    <p className="text-sm text-gray-500">Nenhum campo adicionado.</p>
                    <button
                      type="button"
                      onClick={() => handleAddField("string")}
                      className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                    >
                      + Adicionar primeiro campo
                    </button>
                  </div>
                ) : (
                  fields.map((field) => (
                    <div
                      key={field.id}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 transition-all hover:border-gray-300 dark:hover:border-gray-700"
                    >
                      {/* Nome do Campo */}
                      <div className="flex-1 min-w-[140px]">
                        <input
                          type="text"
                          placeholder="Nome da chave (ex: nome, idade)"
                          value={field.key}
                          onChange={(e) => handleUpdateField(field.id, "key", e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                        />
                      </div>

                      {/* Tipo do Campo */}
                      <div className="w-full sm:w-[130px] flex-shrink-0">
                        <select
                          value={field.type}
                          onChange={(e) => handleUpdateField(field.id, "type", e.target.value)}
                          className="w-full px-2.5 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-semibold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option value="string">String (Texto)</option>
                          <option value="number">Number (Número)</option>
                          <option value="boolean">Boolean (V/F)</option>
                          <option value="date">Date (Data ISO)</option>
                          <option value="array">Array (Lista JSON)</option>
                          <option value="object">Object (Sub-doc)</option>
                        </select>
                      </div>

                      {/* Valor do Campo dependendo do tipo */}
                      <div className="flex-[1.5] min-w-[160px]">
                        {field.type === "boolean" ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={field.value}
                              onChange={(e) => handleUpdateField(field.id, "value", e.target.value)}
                              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-emerald-700 dark:text-emerald-400"
                            >
                              <option value="true">true (Verdadeiro)</option>
                              <option value="false">false (Falso)</option>
                            </select>
                          </div>
                        ) : field.type === "number" ? (
                          <input
                            type="number"
                            step="any"
                            placeholder="0"
                            value={field.value}
                            onChange={(e) => handleUpdateField(field.id, "value", e.target.value)}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                          />
                        ) : field.type === "date" ? (
                          <input
                            type="datetime-local"
                            value={field.value}
                            onChange={(e) => handleUpdateField(field.id, "value", e.target.value)}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                          />
                        ) : field.type === "array" ? (
                          <input
                            type="text"
                            placeholder='["item1", "item2"] ou [1, 2, 3]'
                            value={field.value}
                            onChange={(e) => handleUpdateField(field.id, "value", e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                          />
                        ) : field.type === "object" ? (
                          <input
                            type="text"
                            placeholder='{"rua": "Principal", "num": 10}'
                            value={field.value}
                            onChange={(e) => handleUpdateField(field.id, "value", e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder="Valor textual"
                            value={field.value}
                            onChange={(e) => handleUpdateField(field.id, "value", e.target.value)}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        )}
                      </div>

                      {/* Botão Remover */}
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex-shrink-0 self-end sm:self-center"
                        title="Remover campo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Botões para adicionar rapidamente por tipo */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                <span className="text-[11px] text-gray-400 font-medium">Adicionar rapidamente:</span>
                <button
                  type="button"
                  onClick={() => handleAddField("string")}
                  className="px-2 py-0.5 text-[11px] rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300"
                >
                  + Texto
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField("number")}
                  className="px-2 py-0.5 text-[11px] rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300"
                >
                  + Número
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField("boolean")}
                  className="px-2 py-0.5 text-[11px] rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300"
                >
                  + Booleano
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField("array")}
                  className="px-2 py-0.5 text-[11px] rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300"
                >
                  + Array / Lista
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField("object")}
                  className="px-2 py-0.5 text-[11px] rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300"
                >
                  + Sub-documento
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Documento JSON (BSON)
                  </span>
                  {jsonError ? (
                    <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Sintaxe inválida
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> JSON válido
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-gray-400">
                  Ctrl+V permitido • Se omitires _id, o MongoDB gera automaticamente
                </span>
              </div>

              <div className="relative rounded-xl border border-gray-300 dark:border-gray-700 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={14}
                  spellCheck={false}
                  placeholder={`{\n  "nome": "João",\n  "idade": 30,\n  "ativo": true\n}`}
                  className="w-full p-4 font-mono text-xs sm:text-sm bg-gray-900 text-emerald-400 dark:bg-[#101012] dark:text-emerald-300 outline-none resize-y leading-relaxed"
                />
              </div>

              {jsonError && (
                <p className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900/40">
                  {jsonError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer com Ações */}
        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting || (activeTab === "json" && !!jsonError)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "A inserir no MongoDB..." : "Inserir Documento"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriarDocumentoMongoModal;
