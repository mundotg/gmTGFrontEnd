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
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { AnalizeDataType } from "@/types";
import { hasPermission } from "@/permissions_val";

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

  if (!canView) return <AccessDenied />;
  if (loading || !data) return <SkeletonLoader />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-8 bg-blue-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Analytics Engine
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Desempenho de Projetos
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#1a1a1a] border border-white/5 p-1 rounded-lg">
            <FilterBtn
              active={timeRange === "week"}
              label="7D"
              onClick={() => setTimeRange("week")}
            />
            <FilterBtn
              active={timeRange === "month"}
              label="30D"
              onClick={() => setTimeRange("month")}
            />
          </div>

          {canExport && (
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-black rounded-lg hover:bg-slate-200 transition-all uppercase tracking-tighter">
              <Download size={14} />
              Exportar
            </button>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Projetos Ativos"
          value={data.overview.activeProjects}
          icon={<Target className="text-blue-400" />}
        />
        <StatCard
          title="Tasks Concluídas"
          value={data.overview.completedTasks}
          icon={<CheckCircle className="text-emerald-400" />}
        />
        <StatCard
          title="Total de Membros"
          value={data.overview.teamMembers}
          icon={<Users className="text-purple-400" />}
        />
        <StatCard
          title="Overdue Projects"
          value={data.overview.overdueProjects}
          icon={<AlertTriangle className="text-red-400" />}
        />
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ACTIVITY */}
        <div className="lg:col-span-1 bg-[#0f0f0f] border border-white/5 rounded-2xl p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
            <Clock size={14} /> Histórico de Execução
          </h3>

          <div className="space-y-6">
            {data.recentActivity.map((a) => (
              <div key={a.id} className="relative pl-6 border-l border-white/10">
                <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-slate-700" />
                <p className="text-xs text-slate-200 font-medium">
                  <span className="text-blue-400">
                    @{a.user.split(" ")[0]}
                  </span>{" "}
                  {a.action}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">
                  {a.project} • {a.time}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESS */}
        <div className="lg:col-span-2 bg-[#0f0f0f] border border-white/5 rounded-2xl p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
            <Activity size={14} /> Progresso das Milestones
          </h3>

          <div className="space-y-4">
            {data.projectProgress.map((p) => (
              <div
                key={p.name}
                className="p-4 bg-white/[0.02] border border-white/5 rounded-xl"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-slate-200">
                    {p.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {p.progress}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-700"
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
};

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded-2xl flex justify-between">
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {title}
        </p>
        <p className="text-3xl font-bold text-white tracking-tighter">
          {value ?? 0}
        </p>
      </div>
      <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
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
      className={`px-3 py-1 text-[10px] font-bold rounded-md ${
        active
          ? "bg-white/10 text-white"
          : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function AccessDenied() {
  return (
    <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
      <AlertTriangle className="text-amber-500 mb-3" size={32} />
      <p className="text-sm font-bold text-slate-300">
        Acesso Restrito ao Módulo
      </p>
      <p className="text-xs text-slate-500">
        Contacte o administrador do MustaInf.
      </p>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-white/5 w-1/4 rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
