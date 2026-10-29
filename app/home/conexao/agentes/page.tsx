"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Server } from "lucide-react";
import { MustaLinkManagerModal } from "../component/MustaLinkManagerModal";
import { MustaLinkGuide } from "../component/MustaLinkGuide";

export default function MustaLinkAgentsPage() {
  const [activeTab, setActiveTab] = useState<"guia" | "gestor">("guia");

  return (
    <div className="font-interface min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-200">
        {/* Barra Superior de Navegação */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/home/conexao"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-2xs transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Conexões de Base de Dados
          </Link>

          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("guia")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "guia"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Como Configurar (Guia Passo a Passo)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("gestor")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "gestor"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Server className="h-4 w-4" />
              Painel de Agentes & Credenciais
            </button>
          </div>
        </div>

        {activeTab === "guia" ? (
          <MustaLinkGuide onOpenManager={() => setActiveTab("gestor")} />
        ) : (
          <MustaLinkManagerModal inline />
        )}
      </div>
    </div>
  );
}
