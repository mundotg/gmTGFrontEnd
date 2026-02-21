"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Activity,
  Download,
  Target,
  ShieldAlert,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { AnalizeDataType } from "@/types";
import { hasPermission } from "@/permissions_val";
import { useI18n } from "@/context/I18nContext";

/* =======================
   MOCK DATA
======================= */
const mockData: AnalizeDataType = {
  overview: {
    activeProjects: 12,
    completedTasks: 48,
    teamMembers: 24,
    overdueProjects: 3,
    totalProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
  },
  recentActivity: [
    {
      id: 1,
      user: "João Silva",
      action: "concluiu uma task",
      project: "Portal Admin",
      time: "há 2h",
    },
    {
      id: 2,
      user: "Maria Santos",
      action: "atualizou milestone",
      project: "API Gateway",
      time: "há 4h",
    },
    {
      id: 3,
      user: "Pedro Costa",
      action: "iniciou projeto",
      project: "Mobile App",
      time: "há 6h",
    },
  ],
  projectProgress: [
    { name: "Portal Admin", progress: 85, tasks: 0, completed: 0 },
    { name: "API Gateway", progress: 60, tasks: 0, completed: 0 },
    { name: "Mobile App", progress: 45, tasks: 0, completed: 0 },
  ],
  weeklyActivity: [],
  teamPerformance: [],
  taskStatus: [],
  projectTypes: [],
};

/* =======================
   COMPONENT
======================= */
export function ProjectModule() {
  const { user } = useSession();
  const { t } = useI18n();
  const permissions = user?.permissions ?? [];

  const canView = hasPermission(permissions, "analytics:project:view");
  const canExport = hasPermission(permissions, "analytics:project:export");

  const [timeRange, setTimeRange] = useState<"week" | "month">("month");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalizeDataType | null>(null);

  useEffect(() => {
    if (!canView) return;

    setLoading(true);
    const timer = setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [timeRange, canView]);

  if (!canView) return <AccessDenied t={t} />;
  if (loading || !data) return <SkeletonLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {t("projects.performanceTitle") || "Desempenho de Projetos"}
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {t("projects.performanceSubtitle") || "Visão geral e progresso das milestones"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 border border-gray-200 p-1 rounded-lg">
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

          {canExport && (
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              <Download size={16} />
              <span className="hidden sm:inline">{t("actions.export") || "Exportar"}</span>
            </button>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("projects.statActive") || "Projetos Ativos"}
          value={data.overview.activeProjects}
          icon={<Target className="text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          title={t("projects.statCompleted") || "Tasks Concluídas"}
          value={data.overview.completedTasks}
          icon={<CheckCircle className="text-green-600" />}
          iconBg="bg-green-50"
        />
        <StatCard
          title={t("projects.statMembers") || "Total de Membros"}
          value={data.overview.teamMembers}
          icon={<Users className="text-purple-600" />}
          iconBg="bg-purple-50"
        />
        <StatCard
          title={t("projects.statOverdue") || "Atrasados"}
          value={data.overview.overdueProjects}
          icon={<AlertTriangle className="text-red-600" />}
          iconBg="bg-red-50"
        />
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ACTIVITY */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock size={16} className="text-gray-500" /> 
            {t("projects.activityLog") || "Histórico de Execução"}
          </h3>

          <div className="space-y-6">
            {data.recentActivity.map((a, idx) => (
              <div key={a.id} className="relative pl-5 border-l-2 border-gray-100">
                <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-white border-2 border-blue-500" />
                <p className="text-sm text-gray-700 font-medium">
                  <span className="text-gray-900 font-bold">
                    {a.user.split(" ")[0]}
                  </span>{" "}
                  {a.action} {idx === 0 && <span className="text-emerald-500 text-xs font-bold animate-pulse">● Novo</span>}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {a.project} • {a.time}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESS */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity size={16} className="text-gray-500" /> 
            {t("projects.milestones") || "Progresso das Milestones"}
          </h3>

          <div className="space-y-5">
            {data.projectProgress.map((p) => (
              <div key={p.name} className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-900">
                    {p.name}
                  </span>
                  <span className="text-xs font-bold text-gray-600">
                    {p.progress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      p.progress >= 80 ? 'bg-green-500' : p.progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}

/* =======================
   SMALL COMPONENTS
======================= */

type StatCardProps = {
  title: string;
  value?: number;
  icon: React.ReactNode;
  iconBg: string;
};

function StatCard({ title, value, icon, iconBg }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex items-center justify-between transition-shadow hover:shadow-md">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900">
          {value ?? 0}
        </p>
      </div>
      <div className={`p-3 rounded-lg ${iconBg}`}>{icon}</div>
    </div>
  );
}

type FilterBtnProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function FilterBtn({ active, label, onClick }: FilterBtnProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
        active
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

function AccessDenied({ t }: { t: (valor: string) => string }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
        <ShieldAlert className="text-amber-600" size={28} />
      </div>
      <p className="text-lg font-bold text-gray-900 mb-1">
        {t("projects.accessDenied") || "Acesso Restrito ao Módulo"}
      </p>
      <p className="text-sm text-gray-500 font-medium">
        {t("projects.accessDeniedDesc") || "Contacte o administrador do MustaInf."}
      </p>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 bg-gray-200 w-1/4 rounded-lg" />
        <div className="h-8 bg-gray-200 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="lg:col-span-2 h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}