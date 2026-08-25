"use client";

import React, { useMemo, useState } from "react";
import {
  X,
  Shield,
  Bookmark,
  Save,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  Upload,
  Download,
  Cloud,
  Plus,
} from "lucide-react";

import { AuthType, HttpMethod, SavedRequest } from "../types";
import { useTesterConfig } from "../hook/useTesterConfig";

type CurrentRequest = {
  name: string;
  method: HttpMethod;
  url: string;
  headers: string;
  body: string;
  authType: AuthType;
  authToken: string;
  encodeBasicAuth: boolean;
};

type Props = {
  onClose: () => void;
  current: CurrentRequest;
  onLoadRequest: (req: SavedRequest) => void;
  onEnvSaved?: (env: Record<string, string | number | boolean | null>) => void;
};

const methodColor = (m: string) => {
  switch (m) {
    case "GET":
      return "text-emerald-400";
    case "POST":
      return "text-blue-400";
    case "PUT":
    case "PATCH":
      return "text-amber-400";
    case "DELETE":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
};

export default function SettingsModal({ onClose, current, onLoadRequest, onEnvSaved }: Props) {
  const {
    envVars,
    savedRequests,
    updatedAt,
    loading,
    saving,
    error,
    saveEnv,
    saveRequest,
    deleteRequest,
    reload,
  } = useTesterConfig();

  const [tab, setTab] = useState<"env" | "requests">("env");
  const [envInput, setEnvInput] = useState("");
  const [envDirty, setEnvDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [reqName, setReqName] = useState(current.name || "");

  // Preenche a caixa de env quando a config chega da BD (uma vez).
  const envReady = useMemo(() => JSON.stringify(envVars, null, 2), [envVars]);
  React.useEffect(() => {
    if (!envDirty) setEnvInput(envReady);
  }, [envReady, envDirty]);

  const flash = (ok: boolean, msg: string) => {
    setFeedback({ ok, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveEnv = async () => {
    let parsed: Record<string, string | number | boolean | null>;
    try {
      parsed = JSON.parse(envInput);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Deve ser um objeto JSON.");
      }
    } catch (e) {
      flash(false, `JSON inválido: ${(e as Error).message}`);
      return;
    }
    const ok = await saveEnv(parsed);
    setEnvDirty(false);
    if (ok) {
      onEnvSaved?.(parsed);
      flash(true, "Variáveis guardadas na sua conta.");
    } else {
      flash(false, error || "Não foi possível guardar.");
    }
  };

  const handleSaveCurrentRequest = async () => {
    const nome = reqName.trim();
    if (!nome) {
      flash(false, "Dê um nome ao request.");
      return;
    }
    if (!current.url.trim()) {
      flash(false, "O request atual não tem URL.");
      return;
    }
    await saveRequest({
      name: nome,
      method: current.method,
      url: current.url,
      headers: current.headers,
      body: current.body,
      authType: current.authType,
      authToken: current.authToken,
      encodeBasicAuth: current.encodeBasicAuth,
    });
    setReqName("");
    flash(true, `"${nome}" guardado na coleção.`);
  };

  const exportConfig = () => {
    const blob = new Blob(
      [JSON.stringify({ env_vars: envVars, saved_requests: savedRequests }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tester-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Cloud className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Configurações do tester</h2>
              <p className="text-[11px] text-slate-500">
                Guardado na sua conta
                {updatedAt ? ` · atualizado ${new Date(updatedAt).toLocaleString()}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-3">
          <TabBtn active={tab === "env"} onClick={() => setTab("env")} icon={<Shield className="w-4 h-4" />}>
            Variáveis de ambiente
          </TabBtn>
          <TabBtn active={tab === "requests"} onClick={() => setTab("requests")} icon={<Bookmark className="w-4 h-4" />}>
            Requests guardados
            {savedRequests.length > 0 && (
              <span className="ml-1 text-[10px] bg-slate-700 rounded-full px-1.5">{savedRequests.length}</span>
            )}
          </TabBtn>
          <div className="ml-auto flex items-center gap-1 py-2">
            <button
              onClick={exportConfig}
              title="Exportar configuração"
              className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`mx-5 mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
              feedback.ok
                ? "border-emerald-600/40 bg-emerald-950/30 text-emerald-300"
                : "border-red-600/40 bg-red-950/30 text-red-300"
            }`}
          >
            {feedback.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {feedback.msg}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" /> A carregar…
            </div>
          ) : tab === "env" ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Use <code className="text-cyan-400">{"${NOME}"}</code> nos URLs, headers e corpos.
                Estas variáveis ficam guardadas na sua conta.
              </p>
              <textarea
                value={envInput}
                onChange={(e) => {
                  setEnvInput(e.target.value);
                  setEnvDirty(true);
                }}
                spellCheck={false}
                className="h-64 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-300 focus:border-cyan-500 outline-none resize-none"
                placeholder='{\n  "BASE_URL": "http://localhost:8000",\n  "TOKEN": "..."\n}'
              />
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setEnvInput(envReady);
                    setEnvDirty(false);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Repor
                </button>
                <button
                  onClick={handleSaveEnv}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar na conta
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Guardar o request atual */}
              <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-2">
                  <Plus className="w-4 h-4 text-cyan-400" /> Guardar o request atual
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <span className={`font-bold ${methodColor(current.method)}`}>{current.method}</span>
                  <span className="font-mono truncate">{current.url || "(sem URL)"}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveCurrentRequest()}
                    placeholder="Nome (ex: Login admin)"
                    className="flex-1 rounded bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                  />
                  <button
                    onClick={handleSaveCurrentRequest}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> Guardar
                  </button>
                </div>
              </div>

              {/* Coleção */}
              <div>
                <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-2">
                  <Bookmark className="w-4 h-4 text-cyan-400" /> A minha coleção
                </h3>
                {savedRequests.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8 border border-dashed border-slate-700 rounded-lg">
                    Ainda não guardou nenhum request.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedRequests.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 hover:border-slate-600 transition"
                      >
                        <span className={`text-xs font-bold w-14 ${methodColor(r.method)}`}>
                          {r.method}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-200 truncate">{r.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{r.url}</p>
                        </div>
                        <button
                          onClick={() => {
                            onLoadRequest(r);
                            onClose();
                          }}
                          className="flex items-center gap-1 rounded bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-xs font-medium"
                        >
                          <Upload className="w-3.5 h-3.5" /> Carregar
                        </button>
                        <button
                          onClick={() => deleteRequest(r.id)}
                          title="Apagar"
                          className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && !feedback && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-red-600/40 bg-red-950/30 px-3 py-2 text-xs text-red-300">
              <span>{error}</span>
              <button onClick={reload} className="underline hover:text-red-200">
                Tentar de novo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
        active
          ? "border-cyan-500 text-cyan-400"
          : "border-transparent text-slate-400 hover:text-slate-200"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
