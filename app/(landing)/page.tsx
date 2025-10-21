"use client";
import React, { useMemo } from "react";
import { Button } from "@/app/component";
import { useI18n } from "@/context/I18nContext";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const { t } = useI18n();
  const route = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useSession();

  const features = useMemo(() => [
    t("features.consultas"),
    t("features.pesquisa"),
    t("features.validacao"),
    t("features.filtros"),
    t("features.duplicados"),
    t("features.detalhes"),
    t("features.sql"),
    t("features.conexoes"),
    t("features.historico"),
    t("features.suporte"),
  ], [t]);

  const future = useMemo(() => [
    t("futures.dashboard"),
    t("futures.relacionamentos"),
    t("futures.logs"),
    t("futures.colaboracao"),
    t("futures.integracao"),
  ], [t]);

  const logoutHandle = () => {
    logout().then(() => {
      route.push("/auth/login");
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white text-lg">
        Carregando sessão...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <h1 className="text-3xl font-bold text-white">🧠 {t("home.title")}</h1>
          <div className="flex gap-2">
            <Link
              href="/home"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Ir para Home
            </Link>

            {/* ✅ Novo botão para Task Sprint */}
            <Link
              href="/task"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Ir para Task Sprint
            </Link>

            {isAuthenticated && (
              <Button
                onClick={logoutHandle}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
              >
                Sair
              </Button>
            )}
          </div>
        </div>

        {isAuthenticated ? (
          <p className="text-lg text-white/90 mb-6">
            Bem-vindo, <span className="font-semibold">{user?.email}</span>!
          </p>
        ) : (
          <p className="text-lg text-white/80 mb-6">{t("home.description")}</p>
        )}

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-green-200">
            {t("home.featuresTitle")}
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-white">
            {features.map((f, i) => (
              <li key={i} className="text-white/90">{f}</li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-200">
            {t("home.futureTitle")}
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-white">
            {future.map((f, i) => (
              <li key={i} className="text-white/80">{f}</li>
            ))}
          </ul>
        </section>

        <footer className="text-center text-sm text-white/70 mt-10 border-t border-white/20 pt-4">
          {t("home.footer")}
        </footer>
      </div>
    </main>
  );
}
