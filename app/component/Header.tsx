"use client";
import React from "react";
import { useI18n } from "@/context/I18nContext";

export default function Header() {
  const { t } = useI18n();

  return (
    // Transformamos o header em um "card" como no seu form de conexões
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="mb-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
          {t("header.welcome") || "Bem-vindo ao MustaInf, uma"}{" "}
          {/* Mantive o gradiente no texto de destaque para dar um visual moderno */}
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-600">
            {t("header.platformType") || "Data Pipeline and Analytics Platform"}
          </span>
        </h2>

        <p className="text-base text-gray-600 leading-relaxed max-w-5xl">
          {t("header.desc.part1") || "Projeto end-to-end que integra "}
          <strong className="font-semibold text-gray-900">
            {t("header.desc.highlight1") || "engenharia de dados, análise e fundamentos de ciência de dados"}
          </strong>
          {t("header.desc.part2") || " para monitorar, auditar e extrair insights acionáveis de bases de dados relacionais. A solução combina "}
          <strong className="font-semibold text-gray-900">
            {t("header.desc.highlight2") || "API em FastAPI"}
          </strong>,{" "}
          <strong className="font-semibold text-gray-900">
            {t("header.desc.highlight3") || "PostgreSQL"}
          </strong>,{" "}
          <strong className="font-semibold text-gray-900">
            {t("header.desc.highlight4") || "dashboards"}
          </strong>
          {t("header.desc.part3") || " e um "}
          <strong className="font-semibold text-gray-900">
            {t("header.desc.highlight5") || "módulo de ML opcional"}
          </strong>
          {t("header.desc.part4") || " para apoiar a tomada de decisão."}
        </p>
      </div>
    </div>
  );
}