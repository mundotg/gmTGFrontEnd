"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Activity,
  Download,
  Target,
} from "lucide-react";

import { useSession } from "@/context/SessionContext";
import { AnalizeDataType } from "@/types";
import { hasPermission } from "@/permissions_val";
import { useI18n } from "@/context/I18nContext";

import {
  AccessDenied,
  FilterBtn,
  SkeletonLoader,
  StatCard,
} from "./ComponentAnlytics/TaskUiAnalytics";

export function ProjectModule({
  refreshKey = 0,
  downloadSignal = 0,
}: {
  refreshKey?: number;
  downloadSignal?: number;
}) {
  const { user, api } = useSession();
  const { t } = useI18n();

  const permissions = user?.permissions ?? [];
  const canView = hasPermission(permissions, "analytics:project:view");
  const canExport = hasPermission(permissions, "analytics:project:export");

  const [timeRange, setTimeRange] = useState<"week" | "month">("month");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalizeDataType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔥 fetch isolado (melhor para retry)
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/analytics/projects/", {
        params: { range: timeRange },
        signal,
      });

      setData(response.data);
    } catch (err) {
      if ((err as Error)?.name === "CanceledError") return;

      console.error("[PROJECT_ANALYTICS_ERROR]", err);
      setError("Erro ao carregar dados");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [api, timeRange]);

  // refreshKey força novo fetch quando o botão do topo é premido.
  useEffect(() => {
    if (!canView) return;

    const controller = new AbortController();
    fetchData(controller.signal);

    return () => controller.abort(); // evita memory leak 👌
  }, [fetchData, canView, refreshKey]);

  // Exporta o resumo em CSV (botão Download do topo ou o próprio botão).
  const exportCsv = useCallback(() => {
    if (!data) return;
    const o = data.overview;
    const linhas: string[][] = [
      ["Métrica", "Valor"],
      ["Projetos ativos", String(o.activeProjects)],
      ["Tasks concluídas", String(o.completedTasks)],
      ["Total de membros", String(o.teamMembers)],
      ["Projetos atrasados", String(o.overdueProjects)],
      ["Total de projetos", String(o.totalProjects)],
      ["Total de tasks", String(o.totalTasks)],
    ];
    const csv = linhas
      .map((l) => l.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-projetos-${timeRange}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, timeRange]);

  useEffect(() => {
    if (downloadSignal && canExport) exportCsv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadSignal]);

  if (!canView) return <AccessDenied t={t} />;
  if (loading) return <SkeletonLoader />;
  if (error || !data)
    return <ErrorState message={error} onRetry={() => fetchData()} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {t("projects.performanceTitle") || "Desempenho de Projetos"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("projects.performanceSubtitle") ||
              "Visão geral e progresso das milestones"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* FILTER */}
          <div className="flex bg-gray-100 border p-1 rounded-lg">
            <FilterBtn
              active={timeRange === "week"}
              label={t("projects.filter7D") || "7D"}
              onClick={() => setTimeRange("week")}
            />
            <FilterBtn
              active={timeRange === "month"}
              label={t("projects.filter30D") || "30D"}
              onClick={() => setTimeRange("month")}
            />
          </div>

          {/* EXPORT */}
          {canExport && (
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 px-4 py-2 bg-white border text-sm rounded-lg hover:bg-gray-50 shadow-sm"
            >
              <Download size={16} />
              <span className="hidden sm:inline">
                {t("actions.export") || "Exportar"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Projetos Ativos"
          value={data.overview.activeProjects}
          icon={<Target className="text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Tasks Concluídas"
          value={data.overview.completedTasks}
          icon={<CheckCircle className="text-green-600" />}
          iconBg="bg-green-50"
        />
        <StatCard
          title="Total de Membros"
          value={data.overview.teamMembers}
          icon={<Users className="text-purple-600" />}
          iconBg="bg-purple-50"
        />
        <StatCard
          title="Atrasados"
          value={data.overview.overdueProjects}
          icon={<AlertTriangle className="text-red-600" />}
          iconBg="bg-red-50"
        />
      </div>

      {/* TASK STATUS BREAKDOWN */}
      {data.taskStatus?.length ? (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-gray-900">
            <Activity size={16} /> Distribuição de tarefas por estado
          </h3>
          <TaskStatusBar items={data.taskStatus} />
        </div>
      ) : null}

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ACTIVITY */}
        <div className="lg:col-span-1 bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
            <Clock size={16} />
            Histórico de Execução
          </h3>

          <div className="space-y-6">
            {data.recentActivity?.length ? (
              data.recentActivity.map((a, idx) => (
                <div key={a.id} className="relative pl-5 border-l-2">
                  <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-blue-500 bg-white" />

                  <p className="text-sm">
                    <span className="font-bold">
                      {a.user?.split(" ")[0] || "User"}
                    </span>{" "}
                    {a.action}

                    {idx === 0 && (
                      <span className="text-emerald-500 text-xs ml-1 animate-pulse">
                        ● Novo
                      </span>
                    )}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {a.project} • {a.time}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState label="Sem atividade recente" />
            )}
          </div>
        </div>

        {/* PROGRESS */}
        <div className="lg:col-span-2 bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
            <Activity size={16} />
            Progresso das Milestones
          </h3>

          <div className="space-y-5">
            {data.projectProgress?.length ? (
              data.projectProgress.map((p) => (
                <div key={p.name} className="p-4 bg-gray-50 border rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold">{p.name}</span>
                    <span className="text-xs font-bold">{p.progress}%</span>
                  </div>

                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${
                        p.progress >= 80
                          ? "bg-green-500"
                          : p.progress >= 50
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState label="Sem progresso disponível" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =======================
   STATES
======================= */

function ErrorState({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="h-64 flex flex-col items-center justify-center gap-3 text-red-500">
      <AlertTriangle />
      <p>{message || "Erro inesperado"}</p>
      <button
        onClick={onRetry}
        className="text-sm px-4 py-1 bg-red-100 rounded-md hover:bg-red-200"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center text-gray-400 text-sm py-6">
      {label}
    </div>
  );
}

/* =======================
   TASK STATUS BAR
======================= */
const STATUS_COLORS: Record<string, string> = {
  concluida: "bg-emerald-500",
  em_andamento: "bg-blue-500",
  pendente: "bg-amber-500",
  em_revisao: "bg-purple-500",
  bloqueada: "bg-red-500",
  cancelada: "bg-gray-400",
};

function TaskStatusBar({
  items,
}: {
  items: { status: string; label: string; count: number }[];
}) {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  if (total === 0) return <EmptyState label="Sem tarefas registadas" />;

  return (
    <div className="space-y-4">
      {/* Barra proporcional */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
        {items.map((i) => (
          <div
            key={i.status}
            className={`${STATUS_COLORS[i.status] || "bg-gray-300"} transition-all`}
            style={{ width: `${(i.count / total) * 100}%` }}
            title={`${i.label}: ${i.count}`}
          />
        ))}
      </div>

      {/* Legenda */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((i) => (
          <div key={i.status} className="flex items-center gap-2 text-xs">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                STATUS_COLORS[i.status] || "bg-gray-300"
              }`}
            />
            <span className="text-gray-600">{i.label}</span>
            <span className="ml-auto font-bold text-gray-900">{i.count}</span>
            <span className="text-gray-400">
              ({Math.round((i.count / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}