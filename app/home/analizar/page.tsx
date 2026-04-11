"use client";

import React, { useState } from "react";
import { Activity, Database, RefreshCw, Download, LucideActivitySquare, TableRowsSplit } from "lucide-react";
import { TabButton } from "./ComponentAnlytics/AnalyticsUI"; // Presumindo que este botão aceita estilos ou já está ajustado
import { DatabaseModule } from "./DatabaseContent";
import { ProjectModule } from "./TaskProject";
import { useI18n } from "@/context/I18nContext";

export default function AnalyticsPage() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"db" | "project">("db");
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    // Disparar evento de refresh global ou via Context/EventEmitter
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TOP NAV BAR (Padrão Oficial - Estilo Card) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                {mode === "db" ? (
                  <>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Activity className="text-blue-600 w-6 h-6" />
                    </div>
                    {t('analytics.dbTitle') || "Observabilidade"}
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <LucideActivitySquare className="text-purple-600 w-6 h-6" />
                    </div>
                    {t('analytics.projectTitle') || "Gestão de Operações"}
                  </>
                )}
              </h1>
              <p className="text-gray-500 text-sm font-medium">
                {mode === "db" 
                  ? (t('analytics.dbDesc') || "Monitoramento de infraestrutura e performance em tempo real.") 
                  : (t('analytics.projectDesc') || "Controle de tasks, sprints e auditoria de equipe.")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Seletor de Modo (Tabs) */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200 font-medium text-sm">
                <TabButton active={mode === "db"} onClick={() => setMode("db")}>
                  <div className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${mode === "db" ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
                    <Database size={16} className="mr-2" /> {t('analytics.tabDatabase') || "Database"}
                  </div>
                </TabButton>
                <TabButton active={mode === "project"} onClick={() => setMode("project")}>
                  <div className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${mode === "project" ? 'bg-white shadow-sm text-purple-700' : 'text-gray-600 hover:text-gray-900'}`}>
                    <TableRowsSplit size={16} className="mr-2" /> {t('analytics.tabProjects') || "Projetos"}
                  </div>
                </TabButton>
              </div>
              
              <div className={`h-8 w-px hidden sm:block bg-gray-200`}></div>
              
              {/* Ações */}
              <div className="flex gap-2">
                <button 
                  onClick={handleRefresh} 
                  className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                  title={t('actions.refresh') || "Atualizar"}
                >
                  <RefreshCw size={18} className={loading ? "animate-spin text-blue-600" : ""} />
                </button>
                <button 
                  className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 font-medium text-sm"
                  title={t('actions.downloadReport') || "Baixar Relatório"}
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">{t('actions.download') || "Download"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODULAR CONTENT */}
        <div className="transition-all duration-300">
          {mode === "db" ? <DatabaseModule /> : <ProjectModule />}
        </div>
      </div>
    </main>
  );
}