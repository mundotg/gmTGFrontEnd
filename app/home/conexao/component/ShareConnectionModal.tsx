"use client";

import { useMemo, useState } from "react";
import {
  X,
  Users,
  Loader2,
  AlertTriangle,
  Trash2,
  Crown,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import {
  ACCESS_LEVEL_HELP,
  ACCESS_LEVEL_LABELS,
  ConnectionAccessLevel,
  useConnectionShares,
} from "@/hook/useConnectionShares";
import { extractApiError } from "@/hook/useRbac";

const NIVEIS: ConnectionAccessLevel[] = ["read", "write", "manage"];

interface Props {
  connectionId: number;
  connectionName: string;
  onClose: () => void;
}

/**
 * 🤝 Modal de partilha de uma conexão de BD.
 *
 * Quem criou a conexão (ou um super admin, ou quem recebeu nível "gestão")
 * concede e retira acesso aqui. Apagar a conexão continua reservado ao dono.
 */
export const ShareConnectionModal = ({
  connectionId,
  connectionName,
  onClose,
}: Props) => {
  const { access, candidatos, loading, error, share, updateLevel, revoke } =
    useConnectionShares(connectionId);

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedLevel, setSelectedLevel] =
    useState<ConnectionAccessLevel>("read");
  const [aGuardar, setAGuardar] = useState(false);
  const [emCurso, setEmCurso] = useState<number | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const podeGerir = !!access?.can_share;

  const candidatosOrdenados = useMemo(
    () => [...candidatos].sort((a, b) => a.nome.localeCompare(b.nome)),
    [candidatos]
  );

  const handleShare = async () => {
    if (!selectedUser || aGuardar) return;

    setAGuardar(true);
    setErroAcao(null);
    try {
      await share(Number(selectedUser), selectedLevel);
      setSelectedUser("");
      setSelectedLevel("read");
    } catch (err) {
      setErroAcao(extractApiError(err, "Não foi possível conceder o acesso."));
    } finally {
      setAGuardar(false);
    }
  };

  const handleLevel = async (userId: number, nivel: ConnectionAccessLevel) => {
    setEmCurso(userId);
    setErroAcao(null);
    try {
      await updateLevel(userId, nivel);
    } catch (err) {
      setErroAcao(extractApiError(err, "Não foi possível alterar o nível."));
    } finally {
      setEmCurso(null);
    }
  };

  const handleRevoke = async (userId: number, nome?: string | null) => {
    if (!window.confirm(`Retirar o acesso de ${nome || "este utilizador"}?`)) {
      return;
    }

    setEmCurso(userId);
    setErroAcao(null);
    try {
      await revoke(userId);
    } catch (err) {
      setErroAcao(extractApiError(err, "Não foi possível retirar o acesso."));
    } finally {
      setEmCurso(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Users size={20} className="text-indigo-600" />
              Partilhar conexão
            </h2>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {connectionName}
              {access?.owner_nome && (
                <>
                  {" · "}
                  <span className="text-slate-400">
                    dono: {access.owner_nome}
                  </span>
                </>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">A carregar acessos…</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && access && !podeGerir && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
              <p>
                Tem acesso de{" "}
                <strong>
                  {access.access_level
                    ? ACCESS_LEVEL_LABELS[access.access_level]
                    : "leitura"}
                </strong>{" "}
                a esta conexão, mas só o dono (ou quem tem nível “Gestão”) a pode
                partilhar.
              </p>
            </div>
          )}

          {erroAcao && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <p>{erroAcao}</p>
            </div>
          )}

          {/* CONCEDER ACESSO */}
          {!loading && podeGerir && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                <UserPlus size={16} className="text-emerald-600" />
                Dar acesso a alguém
              </h3>

              {candidatosOrdenados.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Todos os colegas da empresa já têm acesso a esta conexão.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      <option value="">Escolher utilizador…</option>
                      {candidatosOrdenados.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nome} {u.apelido ?? ""} · {u.email}
                        </option>
                      ))}
                    </select>

                    <select
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 sm:w-36"
                      value={selectedLevel}
                      onChange={(e) =>
                        setSelectedLevel(e.target.value as ConnectionAccessLevel)
                      }
                    >
                      {NIVEIS.map((n) => (
                        <option key={n} value={n}>
                          {ACCESS_LEVEL_LABELS[n]}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleShare}
                      disabled={!selectedUser || aGuardar}
                      className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {aGuardar && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      Conceder
                    </button>
                  </div>

                  <p className="text-xs text-slate-500">
                    {ACCESS_LEVEL_HELP[selectedLevel]}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* QUEM TEM ACESSO */}
          {!loading && podeGerir && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-800">
                Quem tem acesso
              </h3>

              <div className="space-y-2">
                {/* Dono */}
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-900">
                      <Crown size={13} className="text-amber-500" />
                      {access?.owner_nome || "Dono da conexão"}
                    </p>
                    <p className="text-xs text-slate-500">Criou esta conexão</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    Acesso total
                  </span>
                </div>

                {access?.shares.length === 0 && (
                  <p className="py-4 text-center text-sm text-slate-400">
                    Ainda não partilhou esta conexão com ninguém.
                  </p>
                )}

                {access?.shares.map((s) => {
                  const ocupado = emCurso === s.user_id;

                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 transition-colors hover:border-slate-200"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {s.user_nome || `Utilizador #${s.user_id}`}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {s.user_email}
                          {s.granted_by_nome && (
                            <span className="text-slate-400">
                              {" · concedido por "}
                              {s.granted_by_nome}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-2">
                        <select
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                          value={s.access_level}
                          disabled={ocupado}
                          onChange={(e) =>
                            handleLevel(
                              s.user_id,
                              e.target.value as ConnectionAccessLevel
                            )
                          }
                        >
                          {NIVEIS.map((n) => (
                            <option key={n} value={n}>
                              {ACCESS_LEVEL_LABELS[n]}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleRevoke(s.user_id, s.user_nome)}
                          disabled={ocupado}
                          title="Retirar acesso"
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                          {ocupado ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-100 px-5 py-4 text-right">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareConnectionModal;
