"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowLeft,
  Database,
  ShieldCheck,
  Zap,
  HelpCircle,
  FileCheck2,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { DataTransactionForm } from "./components/DataTransactionForm";

export default function TransacoesPage() {
  const router = useRouter();
  const { user } = useSession();

  const dbName = user?.info_extra?.name_db || "Base de Dados Ativa";
  const dbType = user?.info_extra?.type || "Relacional";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200">
      {/* ── TOP HEADER / BREADCRUMBS ── */}
      <div className="border-b bg-white border-gray-200 sticky top-0 z-20 backdrop-blur-md bg-opacity-95 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Back button + Breadcrumb */}
            <div className="flex items-center gap-3">
              <Link
                href="/home/tabelas"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para Tabelas</span>
              </Link>

              <div className="h-4 w-px bg-gray-200" />

              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Link href="/home" className="hover:text-blue-500 transition-colors">
                  Início
                </Link>
                <span>/</span>
                <Link href="/home/tabelas" className="hover:text-blue-500 transition-colors">
                  Tabelas
                </Link>
                <span>/</span>
                <span className="font-semibold text-gray-800">
                  Transação & Transferência
                </span>
              </div>
            </div>

            {/* Right: DB Info */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border bg-blue-50/80 border-blue-100 text-blue-700">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-semibold">{dbName}</span>
                <span className="text-[10px] opacity-75 uppercase">({dbType})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Didático e de Status */}
        <div className="p-6 rounded-2xl border bg-gradient-to-r from-blue-50 via-white to-purple-50/50 border-blue-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                  Transação & Transferência de Dados
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Assistente guiado de migração entre bancos com integridade transacional, mapeamento refinado de colunas e progresso em tempo real
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>Transacional & Seguro</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium">
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                <span>Mapeamento 1-para-1</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FORMULÁRIO STANDALONE ── */}
        <div className="w-full">
          <DataTransactionForm
            standalone={true}
            onClose={() => router.push("/home/tabelas")}
          />
        </div>
      </div>
    </div>
  );
}
