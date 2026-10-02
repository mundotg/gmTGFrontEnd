"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Database,
  Users,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Search,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import api from "@/context/axioCuston";
import { extractApiError } from "@/hook/useRbac";
import { ShareConnectionModal } from "@/app/home/conexao/component/ShareConnectionModal";

/* =====================
   TIPOS
===================== */
interface ConexaoListada {
  id: number;
  name: string;
  host?: string | null;
  database?: string | null;
  type?: string | null;
  status?: string | null;
  last_used?: string | null;
}

const LIMITE = 10;

/**
 * 🔑 Aba "Acessos": visão global de quem acede a que conexão de base de dados.
 *
 * A lista vem de `/conn/connections/`, que já aplica a regra de visibilidade
 * do backend — um super admin vê todas as conexões, um admin vê as da sua
 * empresa, e os restantes veem as suas e as que lhes foram partilhadas.
 * A gestão em si reutiliza o mesmo modal da página de conexões.
 */
export const AcessosTab = () => {
  const [conexoes, setConexoes] = useState<ConexaoListada[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const [aGerir, setAGerir] = useState<ConexaoListada | null>(null);

  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE));

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      const { data } = await api.get("/conn/connections/", {
        params: { page: pagina, limit: LIMITE },
      });
      setConexoes(data.results ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setErro(extractApiError(err, "Não foi possível carregar as conexões."));
    } finally {
      setLoading(false);
    }
  }, [pagina]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const termo = busca.trim().toLowerCase();
  const visiveis = termo
    ? conexoes.filter(
        (c) =>
          c.name?.toLowerCase().includes(termo) ||
          c.database?.toLowerCase().includes(termo) ||
          c.type?.toLowerCase().includes(termo)
      )
    : conexoes;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Acesso a Conexões
          </h2>
          <p className="text-slate-500 text-sm">
            Gerir utilizadores, empresas associadas e regras avançadas de segurança de cada conexão.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Procurar conexão…"
              className="w-full sm:w-56 pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <button
            onClick={carregar}
            title="Recarregar"
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* NOTA */}
      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-xl px-4 py-3 text-sm">
        <Crown size={16} className="mt-0.5 flex-shrink-0" />
        <p>
          Só o dono da conexão, quem tem nível <strong>Gestão</strong>, e o super
          admin podem conceder ou retirar acessos. Apagar a conexão continua
          reservado ao dono.
        </p>
      </div>

      {/* CONTEÚDO */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin mb-3" />
            <p className="text-sm font-medium">A carregar conexões…</p>
          </div>
        ) : erro ? (
          <div className="text-center py-16 px-6">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={22} />
            </div>
            <p className="font-bold text-slate-900">
              Não foi possível carregar as conexões
            </p>
            <p className="text-sm text-slate-500 mt-1">{erro}</p>
            <button
              onClick={carregar}
              className="mt-4 inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
            >
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        ) : visiveis.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Database size={22} />
            </div>
            <p className="font-bold text-slate-900">Nenhuma conexão</p>
            <p className="text-sm text-slate-500 mt-1">
              {termo
                ? `Nada corresponde a "${busca}".`
                : "Ainda não há conexões de base de dados guardadas."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visiveis.map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Database size={18} className="text-slate-400" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {c.name || `Conexão #${c.id}`}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {c.type} · {c.database}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setAGerir(c)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex-shrink-0"
                >
                  <Users size={16} />
                  Gerir acessos
                </button>
              </div>
            ))}
          </div>
        )}

        {/* PAGINAÇÃO */}
        {!loading && !erro && total > LIMITE && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm">
            <span className="text-slate-500">
              Página {pagina} de {totalPaginas} · {total} conexões
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina >= totalPaginas}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {aGerir && (
        <ShareConnectionModal
          connectionId={aGerir.id}
          connectionName={aGerir.name || `Conexão #${aGerir.id}`}
          onClose={() => setAGerir(null)}
        />
      )}
    </div>
  );
};
