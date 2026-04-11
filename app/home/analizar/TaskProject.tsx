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

export function ProjectModule() {
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

      const response = await api.get("/analytics/projects", {
        params: { range: timeRange },
        signal,
      });

      setData(response.data);
    } catch (err: any) {
      if (err.name === "CanceledError") return;

      console.error("[PROJECT_ANALYTICS_ERROR]", err);
      setError("Erro ao carregar dados");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [api, timeRange]);

  useEffect(() => {
    if (!canView) return;

    const controller = new AbortController();
    fetchData(controller.signal);

    return () => controller.abort(); // evita memory leak 👌
  }, [fetchData, canView]);

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
            <button className="flex items-center gap-2 px-4 py-2 bg-white border text-sm rounded-lg hover:bg-gray-50 shadow-sm">
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