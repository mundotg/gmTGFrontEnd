"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "@/context/SessionContext"; // já existente no teu projeto
import { Button } from "@/app/component";
import {
  BarChart2,
  PieChart,
  Clock,
  Database,
  User,
  AlertTriangle,
  Download,
  RefreshCw,
} from "lucide-react";
import ProjectAnalytics from "./TaskProject";

/**
 * AnalyticsPage.tsx
 * Página Analítica combinada:
 * - DB Analytics
 * - Project Analytics
 *
 * Observações:
 * - Substitui os endpoints fetch pelos reais da tua API.
 * - Para gráficos reais substitui os placeholders por uma lib (recharts / chart.js / apexcharts).
 */

type QueryRow = {
  id: number | string;
  sql_sample: string;
  duration_ms: number;
  user_email?: string;
  connection_name?: string;
  type?: string; // SELECT/INSERT/UPDATE/DELETE
  executed_at?: string;
  status?: "success" | "error";
};

export default function AnalyticsPage() {
  const { api, user } = useSession(); // assume context fornece api (axios-like) e user
  const [mode, setMode] = useState<"db" | "project">("db");

  // Loading / error
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [overview, setOverview] = useState<any>(null);
  const [topQueries, setTopQueries] = useState<QueryRow[]>([]);
  const [projectOverview, setProjectOverview] = useState<any>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState<string>(() =>
    new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [connectionFilter, setConnectionFilter] = useState<string | "">("");
  const [userFilter, setUserFilter] = useState<string | "">("");
  const [queryTypeFilter, setQueryTypeFilter] = useState<string | "">("");

  // Pagination for queries
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Mock fetch URLs - replace with os reais
  const DB_OVERVIEW_URL = "/analytics/db/overview";
  const DB_TOP_QUERIES_URL = "/analytics/db/top-queries";
  const PROJECT_OVERVIEW_URL = "/analytics/projects/overview";

  useEffect(() => {
    loadOverview();
    loadTopQueries();
    loadProjectOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, connectionFilter, userFilter, queryTypeFilter, page, mode]);

  async function loadOverview() {
    setLoadingOverview(true);
    setError(null);
    try {
      if (!api) {
        // placeholder data if api not available
        setOverview({
          activeConnections: 7,
          databases: 4,
          queriesLast24h: 1240,
          avgLatencyMs: 84,
          errorsLast24h: 3,
          queriesByType: { SELECT: 900, INSERT: 150, UPDATE: 120, DELETE: 70 },
          queriesTrend: Array.from({ length: 7 }, (_, i) => ({ day: `D-${6 - i}`, value: Math.round(400 + Math.random() * 600) })),
        });
        return;
      }

      const resp = await api.get(DB_OVERVIEW_URL, {
        params: { from: dateFrom, to: dateTo, connection: connectionFilter, user: userFilter },
      });
      setOverview(resp.data);
    } catch (err: any) {
      console.error("loadOverview error", err);
      setError("Erro ao carregar visão geral");
      // fallback minimal
      setOverview(null);
    } finally {
      setLoadingOverview(false);
    }
  }

  async function loadTopQueries() {
    setLoadingQueries(true);
    setError(null);
    try {
      if (!api) {
        const sample: QueryRow[] = new Array(12).fill(null).map((_, i) => ({
          id: i + 1,
          sql_sample: `SELECT * FROM tabela_dummy WHERE id = ${i + 1}`,
          duration_ms: Math.round(50 + Math.random() * 2000),
          user_email: i % 2 === 0 ? "joao@ex.com" : "maria@ex.com",
          connection_name: i % 3 === 0 ? "prod-db" : "dev-db",
          type: i % 4 === 0 ? "INSERT" : "SELECT",
          executed_at: new Date(Date.now() - i * 3600 * 1000).toISOString(),
          status: i % 10 === 0 ? "error" : "success",
        }));
        setTopQueries(sample);
        return;
      }

      const resp = await api.get(DB_TOP_QUERIES_URL, {
        params: { from: dateFrom, to: dateTo, connection: connectionFilter, user: userFilter, qtype: queryTypeFilter, page, pageSize },
      });
      setTopQueries(resp.data.items || resp.data || []);
    } catch (err) {
      console.error("loadTopQueries error", err);
      setError("Erro ao carregar top queries");
      setTopQueries([]);
    } finally {
      setLoadingQueries(false);
    }
  }

  async function loadProjectOverview() {
    try {
      if (!api) {
        setProjectOverview({
          totalProjects: 12,
          activeProjects: 8,
          overdueTasks: 14,
          tasksCompletedLast30d: 132,
          burndown: Array.from({ length: 10 }, (_, i) => ({ day: `T-${9 - i}`, remaining: Math.max(0, 100 - i * 8) })),
          tasksByUser: [
            { user: "Alice", completed: 34 },
            { user: "Bob", completed: 21 },
            { user: "Carol", completed: 18 },
          ],
        });
        return;
      }
      const resp = await api.get(PROJECT_OVERVIEW_URL, { params: { from: dateFrom, to: dateTo } });
      setProjectOverview(resp.data);
    } catch (err) {
      console.error("loadProjectOverview error", err);
      setProjectOverview(null);
    }
  }

  const totalQueries = useMemo(() => overview?.queriesLast24h ?? 0, [overview]);

  function exportQueriesCsv() {
    // implementar export real ou usar quickExportToCsv
    console.log("Export queries CSV (filtros):", { dateFrom, dateTo, connectionFilter, userFilter, queryTypeFilter });
    // se api existir, chamar endpoint /analytics/db/export?...
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
      <div className="max-w-7xl mx-auto bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Analítica — Gestor</h1>
            <p className="text-sm text-white/80">Visão geral de bases de dados e projetos</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-md bg-white/10 p-1">
              <button
                onClick={() => setMode("db")}
                className={`px-3 py-2 rounded-md ${mode === "db" ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white" : "text-white/80"}`}
              >
                Database
              </button>
              <button
                onClick={() => setMode("project")}
                className={`px-3 py-2 rounded-md ${mode === "project" ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white" : "text-white/80"}`}
              >
                Projetos
              </button>
            </div>

            <Button onClick={() => { loadOverview(); loadTopQueries(); loadProjectOverview(); }} className="bg-white/10 text-white px-3 py-2">
              <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
            </Button>
            <Button onClick={exportQueriesCsv} className="bg-emerald-500 text-white px-3 py-2">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <input
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            type="date"
            className="p-2 rounded-md text-black"
            title="From"
          />
          <input
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            type="date"
            className="p-2 rounded-md text-black"
            title="To"
          />
          <input
            value={connectionFilter}
            onChange={(e) => setConnectionFilter(e.target.value)}
            placeholder="Filtro: conexão (nome)"
            className="p-2 rounded-md text-black"
          />
          <input
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="Filtro: usuário (email)"
            className="p-2 rounded-md text-black"
          />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Overview cards */}
          <div className="col-span-2 space-y-4">
            {/* Overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="Conexões Ativas" value={overview?.activeConnections ?? "—"} icon={<Database />} subtitle="atualmente" />
              <StatCard title="Bancos" value={overview?.databases ?? "—"} icon={<BarIcon />} subtitle="ativos" />
              <StatCard title="Queries (período)" value={totalQueries ?? "—"} icon={<PieIcon />} subtitle="total" />
              <StatCard title="Latência média (ms)" value={overview?.avgLatencyMs ?? "—"} icon={<Clock />} subtitle="média" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Tendência de Queries">
                {loadingOverview ? <LoadingPlaceholder /> : <LineChartPlaceholder data={overview?.queriesTrend} />}
              </Card>
              <Card title="Tipo de Queries (percentual)">
                {loadingOverview ? <LoadingPlaceholder /> : <DonutPlaceholder data={overview?.queriesByType} />}
              </Card>
              <Card title="Top 5 Queries Mais Lentas" className="md:col-span-2">
                {loadingQueries ? <LoadingPlaceholder /> : <TopQueriesList data={topQueries.slice(0, 5)} />}
              </Card>
            </div>

            {/* DB-specific table */}
            {mode === "db" && (
              <Card title="Top Queries (tabela)">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex gap-2 items-center">
                    <select
                      value={queryTypeFilter}
                      onChange={(e) => setQueryTypeFilter(e.target.value)}
                      className="rounded-md p-2 text-black"
                    >
                      <option value="">Todos tipos</option>
                      <option value="SELECT">SELECT</option>
                      <option value="INSERT">INSERT</option>
                      <option value="UPDATE">UPDATE</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                    <input
                      placeholder="Filtrar por SQL (sample) ..."
                      className="p-2 rounded-md text-black"
                      onChange={(e) => {
                        // pesquisa local simples - para demo
                        const q = e.target.value.toLowerCase();
                        setTopQueries((prev) => (prev || []).filter((r) => r.sql_sample.toLowerCase().includes(q)));
                      }}
                    />
                  </div>
                  <div className="text-sm text-white/80">{topQueries.length} resultados</div>
                </div>

                <div className="overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-white/90 bg-white/5">
                      <tr>
                        <th className="p-2">Usuário</th>
                        <th className="p-2">Conexão</th>
                        <th className="p-2">Tipo</th>
                        <th className="p-2">Duração (ms)</th>
                        <th className="p-2">SQL (amostra)</th>
                        <th className="p-2">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topQueries.slice((page - 1) * pageSize, page * pageSize).map((row) => (
                        <tr className="hover:bg-white/5" key={row.id}>
                          <td className="p-2">{row.user_email ?? "—"}</td>
                          <td className="p-2">{row.connection_name ?? "—"}</td>
                          <td className="p-2">{row.type ?? "—"}</td>
                          <td className={`p-2 ${row.duration_ms > 1000 ? "text-red-400 font-semibold" : ""}`}>{row.duration_ms}</td>
                          <td className="p-2 truncate max-w-xl">{row.sql_sample}</td>
                          <td className="p-2">{row.executed_at ? new Date(row.executed_at).toLocaleString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="py-3 flex items-center justify-between">
                    <div className="text-sm text-white/80">Página {page}</div>
                    <div className="flex gap-2">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-white/5">Anterior</button>
                      <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded bg-white/5">Próximo</button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Project analytics */}
            {mode === "project" && (
              <ProjectAnalytics/>
            )}
          </div>

          {/* Right column - Alerts & Activity */}
          <aside className="space-y-4">
            <Card title="Alertas recentes">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <div>
                    <div className="text-sm font-semibold">Banco com latência alta</div>
                    <div className="text-xs text-white/80">postgres-prod - média 540ms nas últimas 5m</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-sm font-semibold">Query lenta detectada</div>
                    <div className="text-xs text-white/80">INSERT massivo por user@empresa</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Atividade dos Usuários">
              <div className="space-y-2">
                <div className="text-sm text-white/80">Usuários mais ativos</div>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>joao@empresa</span></div>
                    <div className="text-sm text-white/70">432 queries</div>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>maria@empresa</span></div>
                    <div className="text-sm text-white/70">221 queries</div>
                  </li>
                </ul>
              </div>
            </Card>

            <Card title="Conexões">
              <div className="text-sm text-white/80">
                <div className="flex items-center justify-between">
                  <span>prod-db</span><span className="text-green-300">Ativa</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span>dev-db</span><span className="text-yellow-300">Limite</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>

        {error && <div className="mt-4 text-red-400">{error}</div>}
      </div>
    </main>
  );
}

/* -------------------
   Small UI subcomponents
   ------------------- */

function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/5 rounded-xl p-4 ${className}`}>
      {title && <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">{title}</h3></div>}
      <div>{children}</div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }: { title: string; value: React.ReactNode; subtitle?: string; icon?: React.ReactNode; }) {
  return (
    <div className="p-3 rounded-lg bg-white/5 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-white/10">{icon}</div>
      <div>
        <div className="text-xs text-white/80">{title}</div>
        <div className="text-xl font-bold">{value}</div>
        {subtitle && <div className="text-xs text-white/70">{subtitle}</div>}
      </div>
    </div>
  );
}

/* Simple SVG placeholders for charts - replace with real charts if desired */
function LineChartPlaceholder({ data }: { data?: any[] }) {
  // simple sparkline display
  const points = (data || []).map((d, i) => ({ x: i, y: d?.value ?? Math.random() * 200 }));
  const maxY = Math.max(...points.map((p) => p.y), 1);
  const w = 320, h = 80;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${Math.round((p.x / Math.max(points.length - 1, 1)) * w)} ${Math.round(h - (p.y / maxY) * h)}`).join(" ");
  return (
    <div className="h-28 w-full">
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <path d={path} fill="none" stroke="white" strokeWidth={2} strokeOpacity={0.9} />
        <rect x="0" y="0" width={w} height={h} fill="transparent" />
      </svg>
    </div>
  );
}

function DonutPlaceholder({ data }: { data?: Record<string, number> }) {
  const entries = Object.entries(data || { SELECT: 60, INSERT: 20, UPDATE: 12, DELETE: 8 });
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  let angle = -90;
  const w = 120;
  const cx = 60, cy = 60, r = 40;
  return (
    <div className="flex gap-4 items-center">
      <svg width={w} height={w}>
        {entries.map(([k, v], i) => {
          const sweep = (v / total) * 360;
          const large = sweep > 180 ? 1 : 0;
          const start = angle;
          const end = angle + sweep;
          const sx = cx + r * Math.cos((start * Math.PI) / 180);
          const sy = cy + r * Math.sin((start * Math.PI) / 180);
          const ex = cx + r * Math.cos((end * Math.PI) / 180);
          const ey = cy + r * Math.sin((end * Math.PI) / 180);
          const d = `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} z`;
          angle += sweep;
          const color = ["#60A5FA", "#34D399", "#F59E0B", "#FB7185"][i % 4];
          return <path key={k} d={d} fill={color} opacity={0.95} />;
        })}
      </svg>

      <div className="text-sm">
        {entries.map(([k, v], i) => (
          <div key={k} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ background: ["#60A5FA", "#34D399", "#F59E0B", "#FB7185"][i % 4] }} />
            <span>{k}: {v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopQueriesList({ data }: { data: QueryRow[] }) {
  if (!data || data.length === 0) return <div className="text-sm text-white/80">Nenhuma query encontrada</div>;
  return (
    <ul className="space-y-2">
      {data.map((q) => (
        <li key={q.id} className="p-2 rounded bg-white/3 flex items-start gap-3">
          <div className="flex-1">
            <div className="text-sm font-semibold truncate">{q.sql_sample}</div>
            <div className="text-xs text-white/70">Usuário: {q.user_email ?? "—"} • DB: {q.connection_name ?? "—"} • {new Date(q.executed_at ?? Date.now()).toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className={`text-sm ${q.duration_ms > 1000 ? "text-rose-400" : "text-white/90"}`}>{q.duration_ms} ms</div>
            <div className="text-xs text-white/60">{q.type}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function LoadingPlaceholder() {
  return <div className="py-8 flex items-center justify-center text-white/70">Carregando...</div>;
}

function BarIcon() { return <BarChart2 className="w-5 h-5" />; }
function PieIcon() { return <PieChart className="w-5 h-5" />; }

function BarChartPlaceholder({ data }: { data?: any[] }) {
  const series = data || [{ user: "A", completed: 30 }, { user: "B", completed: 20 }, { user: "C", completed: 10 }];
  const max = Math.max(...series.map((s) => s.completed), 1);
  return (
    <div className="flex gap-4 items-end h-36">
      {series.map((s) => (
        <div key={s.user} className="flex-1">
          <div style={{ height: `${(s.completed / max) * 100}%` }} className="bg-indigo-400 rounded-t-md transition-all" />
          <div className="text-xs text-center mt-2">{s.user}</div>
        </div>
      ))}
    </div>
  );
}
