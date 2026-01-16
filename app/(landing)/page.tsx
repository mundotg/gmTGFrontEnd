"use client";
import React, { useMemo } from "react";
import { Button } from "@/app/component";
import { useI18n } from "@/context/I18nContext";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Database, Zap, ShieldCheck, Filter, Copy, ListTree, 
  Terminal, Network, History, LifeBuoy, Rocket, Layers, 
  LayoutDashboard, Users, Radio, ScanText, LogOut, ChevronRight
} from "lucide-react";

export default function HomePage() {
  const { t } = useI18n();
  const route = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useSession();

  // Mapeamento de ícones para dar vida aos itens da Apple
  const featureIcons = [<Database />, <Zap />, <ShieldCheck />, <Filter />, <Copy />, <ListTree />, <Terminal />, <Network />, <History />, <LifeBuoy />];
  const futureIcons = [<LayoutDashboard />, <Layers />, <Radio />, <Users />, <Rocket />];

  const features = useMemo(() => [
    t("features.consultas"), t("features.pesquisa"), t("features.validacao"),
    t("features.filtros"), t("features.duplicados"), t("features.detalhes"),t("futures.relacionamentos"),
    t("features.sql"), t("features.conexoes"), t("features.historico"), t("features.suporte"),
  ], [t]);

  const future = useMemo(() => [
    t("futures.dashboard"),  t("futures.logs"),
    t("futures.colaboracao"), t("futures.integracao"),
  ], [t]);

  const logoutHandle = () => {
    logout().then(() => route.push("/auth/login"));
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-black">
        <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] font-sans antialiased transition-colors">
      
      {/* HEADER ESTILO APPLE (GLASS) */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#007AFF] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[#007AFF]/20">
              <Database size={18} />
            </div>
            <span className="font-bold tracking-tight text-lg">Brain DB</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/task" className="text-sm font-medium hover:text-[#007AFF] transition-colors">Tasks</Link>
            <Link href="/ocr" className="text-sm font-medium hover:text-[#007AFF] transition-colors flex items-center gap-1">
               <ScanText size={16}/> OCR
            </Link>
            {isAuthenticated ? (
              <button onClick={logoutHandle} className="ml-4 p-2 text-[#FF3B30] hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-all">
                <LogOut size={20} />
              </button>
            ) : (
              <Link href="/auth/login" className="ml-4 bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-transform active:scale-95">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24 space-y-24">
        
        {/* HERO SECTION */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight">
             {t("home.title").split(' ').map((word, i) => i === 0 ? <span key={i}>{word} </span> : <span key={i} className="text-[#86868B]">{word} </span>)}
          </h1>
          <p className="text-xl md:text-2xl text-[#86868B] font-medium leading-relaxed">
            {isAuthenticated ? `Bem-vindo de volta, ${user?.email?.split('@')[0]}.` : t("home.description")}
          </p>
          <div className="flex justify-center gap-4 pt-4">
             <Link href="/home" className="bg-[#007AFF] text-white px-8 py-3 rounded-full font-bold shadow-xl shadow-[#007AFF]/20 hover:bg-[#0071E3] transition-all flex items-center gap-2 group">
                Começar Agora <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>
        </section>

        {/* FEATURES GRID - ESTILO BENTO BOX */}
        <section className="space-y-8">
          <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-4">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#007AFF]">Capabilities</span>
             <h2 className="text-2xl font-bold tracking-tight">{t("home.featuresTitle")}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[2rem] border border-black/5 dark:border-white/10 transition-all hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-white/5 group">
                <div className="w-10 h-10 bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-2xl flex items-center justify-center text-[#007AFF] mb-4 group-hover:scale-110 transition-transform">
                   {featureIcons[i % featureIcons.length]}
                </div>
                <p className="font-semibold text-sm leading-snug">{f}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FUTURE ROADMAP - GLASS CARDS */}
        <section className="bg-white/40 dark:bg-[#1C1C1E]/40 backdrop-blur-2xl rounded-[3rem] border border-black/5 dark:border-white/10 p-10 md:p-16">
          <div className="max-w-2xl">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF9500]">Roadmap</span>
             <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2 mb-8">{t("home.futureTitle")}</h2>
             
             <div className="space-y-4">
                {future.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <div className="text-[#FF9500]">
                      {futureIcons[i % futureIcons.length]}
                    </div>
                    <span className="font-medium text-lg opacity-80">{f}</span>
                  </div>
                ))}
             </div>
          </div>
        </section>

        <footer className="text-center space-y-4 pt-10 border-t border-black/5 dark:border-white/10">
          <p className="text-[#86868B] text-sm font-medium">{t("home.footer")}</p>
          <div className="flex justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
             <Database size={20} />
             <Terminal size={20} />
             <ShieldCheck size={20} />
          </div>
        </footer>
      </main>
    </div>
  );
}