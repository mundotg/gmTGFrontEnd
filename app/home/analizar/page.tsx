"use client";

import React, { useState } from "react";
import { Activity, Database, RefreshCw, Download, LucideActivitySquare, TableRowsSplit } from "lucide-react";
import { TabButton } from "./ComponentAnlytics/AnalyticsUI";
import { DatabaseModule } from "./DatabaseContent";
import { ProjectModule } from "./TaskProject";


export default function AnalyticsPage() {
  const [mode, setMode] = useState<"db" | "project">("db");
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    // Disparar evento de refresh global ou via Context/EventEmitter
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* TOP NAV BAR */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 ">
              {mode === "db" ? (
                <><Activity className="text-blue-500" /> Observabilidade</>
              ) : (
                <><LucideActivitySquare className="text-purple-500" /> Gestão de Operações</>
              )}
            </h1>
            <p className="text-gray-400 text-sm italic">
              {mode === "db" 
                ? "Monitoramento de infraestrutura e performance em tempo real." 
                : "Controle de tasks, sprints e auditoria de equipe."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2  p-1 rounded-xl border border-white/10 font-mono">
              <TabButton active={mode === "db"} onClick={() => setMode("db")}>
                <Database size={14} className="mr-2" /> Database
              </TabButton>
              <TabButton active={mode === "project"} onClick={() => setMode("project")}>
                <TableRowsSplit size={14} className="mr-2" /> Projetos
              </TabButton>
            </div>
            
            <div className="flex gap-2">
                <button onClick={handleRefresh} className="p-2.5  hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-90">
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
                <button className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                    <Download size={18} />
                </button>
            </div>
          </div>
        </div>

        {/* MODULAR CONTENT */}
        <div className="transition-all duration-500">
          {mode === "db" ? <DatabaseModule /> : <ProjectModule />}
        </div>
      </div>
    </main>
  );
}