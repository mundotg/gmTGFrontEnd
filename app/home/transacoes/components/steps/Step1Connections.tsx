// components/steps/Step1Connections.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Server, ArrowRight, AlertTriangle, CheckCircle, Database } from "lucide-react";
import { JoinSelect, Option } from "@/app/task/components/select_Component";
import type { DBConnection } from "@/types/db-structure";
import { getDatabaseIcon } from "./utils";

interface Step1ConnectionsProps {
  loading: boolean;
  sourceDb: DBConnection | undefined;
  targetDb: DBConnection | undefined;
  onSourceDbChange: (value: DBConnection | undefined) => void;
  onTargetDbChange: (value: DBConnection | undefined) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchDBConnections: (page: number, search: string) => Promise<any>;
}

export const Step1Connections: React.FC<Step1ConnectionsProps> = ({
  loading,
  sourceDb,
  targetDb,
  onSourceDbChange,
  onTargetDbChange,
  fetchDBConnections,
}) => {
  // Pool de conexões carregadas em memória para resolução instantânea de ID -> DBConnection
  const [connectionsPool, setConnectionsPool] = useState<Record<string, DBConnection>>(() => {
    const initial: Record<string, DBConnection> = {};
    if (sourceDb?.id) initial[String(sourceDb.id)] = sourceDb;
    if (targetDb?.id) initial[String(targetDb.id)] = targetDb;
    return initial;
  });

  // Função para buscar opções no backend e registrar no pool local
  const handleFetchOptions = useCallback(
    async (page: number, search: string) => {
      try {
        const data = await fetchDBConnections(page, search);

        if (data?.data?.items && Array.isArray(data.data.items)) {
          setConnectionsPool((prev) => {
            const next = { ...prev };
            data.data.items.forEach((item: DBConnection) => {
              if (item?.id) next[String(item.id)] = item;
            });
            return next;
          });
        }

        return {
          options: data?.options || [],
          hasMore: Boolean(data?.hasMore),
          total: data?.total || 0,
        };
      } catch (err) {
        console.error("Erro ao buscar conexões de DB:", err);
        return { options: [], hasMore: false, total: 0 };
      }
    },
    [fetchDBConnections]
  );

  // Initial options para os selects não começarem vazios antes do fetch
  const initialSourceOption: Option | undefined = useMemo(() => {
    if (!sourceDb?.id) return undefined;
    return {
      value: String(sourceDb.id),
      label: `${getDatabaseIcon(sourceDb.type)} ${sourceDb.name} (${sourceDb.database_name})`,
    };
  }, [sourceDb]);

  const initialTargetOption: Option | undefined = useMemo(() => {
    if (!targetDb?.id) return undefined;
    return {
      value: String(targetDb.id),
      label: `${getDatabaseIcon(targetDb.type)} ${targetDb.name} (${targetDb.database_name})`,
    };
  }, [targetDb]);

  const isSameConnection = Boolean(sourceDb?.id && targetDb?.id && sourceDb.id === targetDb.id);

  return (
    <div className="space-y-6">
      {/* Guia explicativo */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Selecione as Conexões de Banco de Dados
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Defina o banco de onde os dados serão lidos e o banco onde serão gravados.
          </p>
        </div>

        {sourceDb && targetDb && !isSameConnection && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Conexões prontas para migração</span>
          </div>
        )}
      </div>

      {/* Grid de Seleção Origem e Destino */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Origem */}
        <div className="space-y-3 bg-white border border-blue-100 rounded-2xl p-5 shadow-xs relative">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <Server className="w-4 h-4 text-blue-600" />
              Banco de Origem (Leitura)
            </label>
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">
              Source
            </span>
          </div>

          <JoinSelect
            value={sourceDb?.id ? String(sourceDb.id) : ""}
            onChange={(value) => {
              if (!value) {
                onSourceDbChange(undefined);
                return;
              }
              const found = connectionsPool[value];
              if (found) {
                onSourceDbChange(found);
              }
            }}
            fetchOptions={loading ? undefined : handleFetchOptions}
            initialOption={initialSourceOption}
            placeholder="Clique para pesquisar ou selecionar a conexão de origem..."
            className="w-full"
            buttonClassName="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-colors shadow-2xs font-medium"
          />

          {sourceDb && (
            <SelectedDbDetails
              db={sourceDb}
              side="origem"
            />
          )}
        </div>

        {/* Destino */}
        <div className="space-y-3 bg-white border border-emerald-100 rounded-2xl p-5 shadow-xs relative">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <Server className="w-4 h-4 text-emerald-600" />
              Banco de Destino (Escrita)
            </label>
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
              Target
            </span>
          </div>

          <JoinSelect
            value={targetDb?.id ? String(targetDb.id) : ""}
            onChange={(value) => {
              if (!value) {
                onTargetDbChange(undefined);
                return;
              }
              const found = connectionsPool[value];
              if (found) {
                onTargetDbChange(found);
              }
            }}
            fetchOptions={loading ? undefined : handleFetchOptions}
            initialOption={initialTargetOption}
            placeholder="Clique para pesquisar ou selecionar a conexão de destino..."
            className="w-full"
            buttonClassName="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-400 transition-colors shadow-2xs font-medium"
          />

          {targetDb && (
            <SelectedDbDetails
              db={targetDb}
              side="destino"
            />
          )}
        </div>
      </div>

      {/* Alerta de mesma conexão (origem === destino) */}
      {isSameConnection && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-800 space-y-1">
            <strong>Atenção: A base de dados de origem e destino são a mesma!</strong>
            <p>
              Você está realizando uma migração interna dentro do mesmo banco.
              Certifique-se de renomear a tabela ou campos de destino no passo de mapeamento para não conflitar com os registros já existentes.
            </p>
          </div>
        </div>
      )}

      {/* Resumo do fluxo */}
      {sourceDb && targetDb && (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center gap-3 text-xs sm:text-sm text-gray-700 flex-wrap">
          <span className="font-semibold text-blue-700 flex items-center gap-1.5">
            <span>{getDatabaseIcon(sourceDb.type)}</span>
            <span>{sourceDb.name}</span>
          </span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
            <span>{getDatabaseIcon(targetDb.type)}</span>
            <span>{targetDb.name}</span>
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">
            {sourceDb.type.toUpperCase()} ➔ {targetDb.type.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};

// Subcomponente estilizado com Tailwind estático seguro
const SelectedDbDetails: React.FC<{ db: DBConnection; side: "origem" | "destino" }> = ({ db, side }) => {
  const isSource = side === "origem";

  return (
    <div
      className={`p-3.5 rounded-xl border text-xs transition-colors ${
        isSource
          ? "bg-blue-50/70 border-blue-200 text-blue-950"
          : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getDatabaseIcon(db.type)}</span>
          <strong className="text-sm font-bold text-gray-900">{db.name}</strong>
        </div>
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            isSource ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {db.type}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-2 border-t border-gray-200/60 font-mono">
        <div>
          <span className="text-gray-400 font-sans font-medium uppercase text-[10px] block">Host:</span>
          <span className="truncate block font-semibold text-gray-800">{db.host}:{db.port}</span>
        </div>
        <div>
          <span className="text-gray-400 font-sans font-medium uppercase text-[10px] block">Database:</span>
          <span className="truncate block font-semibold text-gray-800">{db.database_name}</span>
        </div>
      </div>
    </div>
  );
};

