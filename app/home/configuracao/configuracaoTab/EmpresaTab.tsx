"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Shield,
  Plus,
  X,
  Check,
  ChevronRight,
  Briefcase,
  Loader2,
  Lock,
  AlertTriangle,
  RefreshCw,
  Info,
} from "lucide-react";

import api from "@/context/axioCuston";
import {
  extractApiError,
  useRbac,
  type RbacRole,
  type RbacPermission,
} from "@/hook/useRbac";

/* =======================
   TIPOS
======================= */
interface EmpresaForm {
  company: string;
  companySize: string;
  nif: string;
  endereco: string;
}

interface EmpresaResposta extends EmpresaForm {
  id: number;
  can_manage: boolean;
}

type Aviso = { tipo: "success" | "error"; msg: string } | null;

const VAZIO: EmpresaForm = { company: "", companySize: "", nif: "", endereco: "" };

/* =======================
   COMPONENTE PRINCIPAL
======================= */

export const EmpresaTab = () => {
  /* ---- Dados da empresa ---- */
  const [form, setForm] = useState<EmpresaForm>(VAZIO);
  const [original, setOriginal] = useState<EmpresaForm>(VAZIO);
  const [podeEditarEmpresa, setPodeEditarEmpresa] = useState(false);
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);
  const [erroEmpresa, setErroEmpresa] = useState<string | null>(null);
  const [savingEmpresa, setSavingEmpresa] = useState(false);

  /* ---- Cargos / permissões (RBAC real) ---- */
  const {
    roles,
    permissions,
    capabilities,
    loading: loadingRbac,
    loadError: erroRbac,
    reload: reloadRbac,
    createRole,
    setRolePermissions,
  } = useRbac();

  const podeGerirCargos = !!capabilities?.can_manage_roles;

  /* ---- Modais / avisos ---- */
  const [cargoSelecionado, setCargoSelecionado] = useState<RbacRole | null>(null);
  const [criandoCargo, setCriandoCargo] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);

  const notificar = useCallback((msg: string, tipo: "success" | "error" = "success") => {
    setAviso({ tipo, msg });
    setTimeout(() => setAviso(null), 4000);
  }, []);

  /* =======================
     CARREGAR EMPRESA
  ======================= */
  const carregarEmpresa = useCallback(async () => {
    setLoadingEmpresa(true);
    setErroEmpresa(null);
    try {
      const { data } = await api.get<EmpresaResposta>("/empresas/me");
      const f: EmpresaForm = {
        company: data.company ?? "",
        companySize: data.companySize ?? "",
        nif: data.nif ?? "",
        endereco: data.endereco ?? "",
      };
      setForm(f);
      setOriginal(f);
      setPodeEditarEmpresa(!!data.can_manage);
    } catch (err) {
      setErroEmpresa(
        extractApiError(err, "Não foi possível carregar os dados da empresa.")
      );
    } finally {
      setLoadingEmpresa(false);
    }
  }, []);

  useEffect(() => {
    carregarEmpresa();
  }, [carregarEmpresa]);

  const alterou = useMemo(
    () => (Object.keys(form) as (keyof EmpresaForm)[]).some((k) => form[k] !== original[k]),
    [form, original]
  );

  const guardarEmpresa = async () => {
    if (!podeEditarEmpresa || !alterou) return;
    if (!form.company.trim()) {
      notificar("O nome da organização é obrigatório.", "error");
      return;
    }
    setSavingEmpresa(true);
    try {
      const { data } = await api.put<EmpresaResposta>("/empresas/me", {
        company: form.company.trim(),
        companySize: form.companySize.trim() || null,
        nif: form.nif.trim() || null,
        endereco: form.endereco.trim() || null,
      });
      const f: EmpresaForm = {
        company: data.company ?? "",
        companySize: data.companySize ?? "",
        nif: data.nif ?? "",
        endereco: data.endereco ?? "",
      };
      setForm(f);
      setOriginal(f);
      notificar("Dados da empresa atualizados.");
    } catch (err) {
      notificar(extractApiError(err, "Não foi possível guardar a empresa."), "error");
    } finally {
      setSavingEmpresa(false);
    }
  };

  const setCampo = (campo: keyof EmpresaForm) => (v: string) =>
    setForm((prev) => ({ ...prev, [campo]: v }));

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* AVISO FLUTUANTE */}
      {aviso && (
        <div
          className={`fixed top-6 right-6 z-[60] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-in slide-in-from-top-2 ${
            aviso.tipo === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {aviso.tipo === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          {aviso.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-end border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Gestão da Organização
          </h2>
          <p className="text-gray-500 mt-1">
            Dados institucionais, hierarquia de cargos e níveis de acesso.
          </p>
        </div>
        {!podeEditarEmpresa && !loadingEmpresa && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
            <Lock size={13} /> Apenas leitura
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ESQUERDA: DADOS EMPRESA */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 size={20} />
              </div>
              <h3 className="font-bold text-gray-800">Identidade</h3>
            </div>

            {loadingEmpresa ? (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-sm">A carregar…</span>
              </div>
            ) : erroEmpresa ? (
              <div className="text-center py-6">
                <p className="text-sm text-red-600 mb-3">{erroEmpresa}</p>
                <button
                  onClick={carregarEmpresa}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50"
                >
                  <RefreshCw size={14} /> Tentar novamente
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Nome da Organização"
                  value={form.company}
                  onChange={setCampo("company")}
                  disabled={!podeEditarEmpresa}
                  placeholder="Nome da empresa"
                />
                <Input
                  label="NIF / Documento"
                  value={form.nif}
                  onChange={setCampo("nif")}
                  disabled={!podeEditarEmpresa}
                  placeholder="Ex.: 5000000000"
                />
                <Input
                  label="Dimensão"
                  value={form.companySize}
                  onChange={setCampo("companySize")}
                  disabled={!podeEditarEmpresa}
                  placeholder="Ex.: 11-50 colaboradores"
                />
                <Input
                  label="Endereço"
                  value={form.endereco}
                  onChange={setCampo("endereco")}
                  disabled={!podeEditarEmpresa}
                  placeholder="Morada da sede"
                />
              </div>
            )}
          </section>
        </div>

        {/* DIREITA: CARGOS (RBAC REAL) */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Briefcase size={20} />
                </div>
                <h3 className="font-bold text-gray-800">Cargos e Funções</h3>
              </div>
              {podeGerirCargos && (
                <button
                  onClick={() => setCriandoCargo(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <Plus size={16} /> Novo Cargo
                </button>
              )}
            </div>

            {loadingRbac ? (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-sm">A carregar cargos…</span>
              </div>
            ) : erroRbac ? (
              <div className="text-center py-10">
                <p className="text-sm text-red-600 mb-3">{erroRbac}</p>
                <button
                  onClick={reloadRbac}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50"
                >
                  <RefreshCw size={14} /> Tentar novamente
                </button>
              </div>
            ) : !capabilities?.can_read ? (
              <p className="text-sm text-gray-500 py-8 text-center">
                Não tem permissão para ver os cargos desta organização.
              </p>
            ) : roles.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">
                Ainda não há cargos definidos.
              </p>
            ) : (
              <div className="grid gap-3">
                {roles.map((cargo) => (
                  <div
                    key={cargo.id}
                    className="group flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/30 transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors flex-shrink-0">
                        {cargo.is_locked ? <Lock size={18} /> : <Shield size={20} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 capitalize">{cargo.name}</p>
                          {cargo.is_system && <Tag texto="sistema" cor="blue" />}
                          {cargo.is_locked && <Tag texto="protegido" cor="amber" />}
                          <span className="text-[11px] text-gray-400">
                            {cargo.users_count} membro{cargo.users_count === 1 ? "" : "s"} ·{" "}
                            {cargo.permissions.length} permissões
                          </span>
                        </div>
                        {cargo.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{cargo.description}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setCargoSelecionado(cargo)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-purple-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-all flex-shrink-0"
                    >
                      {podeGerirCargos && !cargo.is_locked ? "Permissões" : "Ver"}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* MODAL PERMISSÕES */}
      {cargoSelecionado && (
        <PermissoesModal
          role={cargoSelecionado}
          permissions={permissions}
          editavel={podeGerirCargos && !cargoSelecionado.is_locked}
          onClose={() => setCargoSelecionado(null)}
          onSave={async (ids) => {
            const atualizado = await setRolePermissions(cargoSelecionado.id, ids);
            setCargoSelecionado(null);
            notificar(`Permissões de "${atualizado.name}" guardadas.`);
          }}
          onError={(msg) => notificar(msg, "error")}
        />
      )}

      {/* MODAL NOVO CARGO */}
      {criandoCargo && (
        <NovoCargoModal
          onClose={() => setCriandoCargo(false)}
          onCreate={async (nome, descricao) => {
            const novo = await createRole(nome, descricao);
            setCriandoCargo(false);
            notificar(`Cargo "${novo.name}" criado.`);
          }}
          onError={(msg) => notificar(msg, "error")}
        />
      )}

      {/* BARRA DE AÇÕES (só quando pode editar a empresa e há alterações) */}
      {podeEditarEmpresa && !loadingEmpresa && !erroEmpresa && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-4 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <Info size={13} /> {alterou ? "Alterações por guardar" : "Tudo guardado"}
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => setForm(original)}
                disabled={!alterou || savingEmpresa}
                className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40"
              >
                Descartar
              </button>
              <button
                onClick={guardarEmpresa}
                disabled={!alterou || savingEmpresa}
                className="flex items-center gap-2 px-8 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg shadow-gray-200"
              >
                {savingEmpresa ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =======================
   MODAL: PERMISSÕES DE UM CARGO
======================= */
function PermissoesModal({
  role,
  permissions,
  editavel,
  onClose,
  onSave,
  onError,
}: {
  role: RbacRole;
  permissions: RbacPermission[];
  editavel: boolean;
  onClose: () => void;
  onSave: (ids: number[]) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [draft, setDraft] = useState<Set<number>>(
    () => new Set(role.permissions.map((p) => p.id))
  );
  const [saving, setSaving] = useState(false);

  const grupos = useMemo(() => {
    const m = new Map<string, RbacPermission[]>();
    for (const p of permissions) {
      const cat = p.category || "Outras";
      if (!m.has(cat)) m.set(cat, []);
      m.get(cat)!.push(p);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions]);

  const toggle = (id: number) => {
    if (!editavel) return;
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const guardar = async () => {
    setSaving(true);
    try {
      await onSave(Array.from(draft));
    } catch (err) {
      onError(extractApiError(err, "Não foi possível guardar as permissões."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {editavel ? "Definir Acessos" : "Permissões do Cargo"}
            </h3>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-purple-600 capitalize">{role.name}</span>
              {!editavel && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                  <Lock size={12} /> só leitura
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {grupos.map(([grupo, items]) => (
            <div key={grupo}>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-gray-100" /> {grupo}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((perm) => {
                  const isActive = draft.has(perm.id);
                  return (
                    <button
                      key={perm.id}
                      onClick={() => toggle(perm.id)}
                      disabled={!editavel}
                      title={perm.name}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                        isActive
                          ? "border-purple-200 bg-purple-50 text-purple-700 shadow-sm"
                          : "border-gray-100 bg-gray-50/50 text-gray-500 hover:border-gray-200"
                      } ${!editavel ? "cursor-default opacity-90" : ""}`}
                    >
                      <span className="text-sm font-medium truncate">
                        {perm.description || perm.name}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                          isActive ? "bg-purple-600 border-purple-600 text-white" : "bg-white border-gray-300"
                        }`}
                      >
                        {isActive && <Check size={12} strokeWidth={4} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t bg-gray-50/50 flex justify-end gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-600" onClick={onClose}>
            {editavel ? "Cancelar" : "Fechar"}
          </button>
          {editavel && (
            <button
              onClick={guardar}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-100 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Confirmar Acessos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =======================
   MODAL: NOVO CARGO
======================= */
function NovoCargoModal({
  onClose,
  onCreate,
  onError,
}: {
  onClose: () => void;
  onCreate: (nome: string, descricao?: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  const submeter = async () => {
    if (!nome.trim()) {
      onError("Indique o nome do cargo.");
      return;
    }
    setSaving(true);
    try {
      await onCreate(nome.trim(), descricao.trim() || undefined);
    } catch (err) {
      onError(extractApiError(err, "Não foi possível criar o cargo."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Novo Cargo</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Input label="Nome do cargo" value={nome} onChange={setNome} placeholder="Ex.: Analista" />
          <Input
            label="Descrição (opcional)"
            value={descricao}
            onChange={setDescricao}
            placeholder="O que este cargo faz"
          />
          <p className="text-xs text-gray-400">
            O cargo é criado sem permissões. Depois, abra “Permissões” para as atribuir.
          </p>
        </div>
        <div className="p-6 border-t bg-gray-50/50 flex justify-end gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-600" onClick={onClose}>
            Cancelar
          </button>
          <button
            onClick={submeter}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Criar
          </button>
        </div>
      </div>
    </div>
  );
}

/* =======================
   SUB-COMPONENTES
======================= */
function Input({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={disabled || !onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all ${
          disabled || !onChange
            ? "border-gray-200 bg-gray-50 text-gray-700 cursor-default"
            : "border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        }`}
      />
    </div>
  );
}

function Tag({ texto, cor }: { texto: string; cor: "blue" | "amber" }) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${styles[cor]}`}>
      {texto}
    </span>
  );
}
