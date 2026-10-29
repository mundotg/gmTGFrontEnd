"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Server } from "lucide-react";
import { MustaLinkGuide } from "../../component/MustaLinkGuide";

export default function MustaLinkGuidePage() {
  return (
    <div className="font-interface min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/home/conexao"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-2xs transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Conexões de Base de Dados
          </Link>

          <Link
            href="/home/conexao/agentes"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-2xs transition hover:bg-emerald-100"
          >
            <Server className="h-4 w-4 text-emerald-600" />
            Gerir Agentes MustaLink
          </Link>
        </div>

        <MustaLinkGuide />
      </div>
    </div>
  );
}

