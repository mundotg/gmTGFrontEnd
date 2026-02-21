"use client";
import React, { useMemo } from "react";
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

  // Ícones mapeados para as funcionalidades
  const featureIcons = [
    <Database key="1" size={20}/>, <Zap key="2" size={20}/>, 
    <ShieldCheck key="3" size={20}/>, <Filter key="4" size={20}/>, 
    <Copy key="5" size={20}/>, <ListTree key="6" size={20}/>, 
    <Terminal key="7" size={20}/>, <Network key="8" size={20}/>, 
    <History key="9" size={20}/>, <LifeBuoy key="10" size={20}/>
  ];

  const futureIcons = [
    <LayoutDashboard key="1" size={24}/>, <Layers key="2" size={24}/>, 
    <Radio key="3" size={24}/>, <Users key="4" size={24}/>, 
    <Rocket key="5" size={24}/>
  ];

  const features = useMemo(() => [
    t("features.consultas"), t("features.pesquisa"), t("features.validacao"),
    t("features.filtros"), t("features.duplicados"), t("features.detalhes"), 
    t("features.relacionamentos"), t("features.sql"), t("features.conexoes"), 
    t("features.historico"), t("features.suporte"),
  ], [t]);

  const future = useMemo(() => [
    t("futures.dashboard"), t("futures.logs"),
    t("futures.colaboracao"), t("futures.integracao"),
  ], [t]);

  const logoutHandle = async () => {
    await logout();
    route.push("/auth/login");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 animate-pulse">
            {t("common.loading") || "Carregando"}
          </span>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] font-sans antialiased selection:bg-[#007AFF]/20 transition-colors">
      
      {/* HEADER GLASSMORPHISM */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 px-6 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Database size={20} strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-tight text-lg hidden sm:block">
              {t("nav.brandName") || "Brain DB"}
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <Link href="/task" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
                {t("nav.tasks")}
              </Link>
              <Link href="/ocr" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                <ScanText size={16}/> {t("nav.ocr")}
              </Link>
            </div>
            
            <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-800 hidden md:block"></div>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 leading-none mb-1">Online</span>
                  <span className="text-xs font-bold opacity-60 truncate max-w-[120px]">{user?.email}</span>
                </div>
                <button onClick={logoutHandle} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-2 rounded-xl text-xs font-bold tracking-tight transition-all hover:opacity-90 active:scale-95 shadow-sm">
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16 md:py-28 space-y-32">
        
        {/* HERO SECTION */}
        <section className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.05] max-w-4xl mx-auto">
             {(t("home.title") || "Gerencie seus dados").split(' ').map((word: string, i: number) => 
               i === 0 
                ? <span key={i} className="text-blue-600 inline-block">{word} </span> 
                : <span key={i} className="text-gray-400 dark:text-gray-600 inline-block">{word} </span>
             )}
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-bold max-w-2xl mx-auto leading-relaxed italic">
            {isAuthenticated 
              ? `${t("home.welcomeBack")}, ${user?.email?.split('@')[0]}.` 
              : t("home.description")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
             <Link href="/home" className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group text-lg">
                {t("home.startNow")} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
             </Link>
             <Link href="/docs" className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-10 py-4 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-lg flex items-center justify-center">
                {t("home.documentation") || "Documentação"}
             </Link>
          </div>
        </section>

        {/* FEATURES GRID - BENTO BOX DESIGN */}
        <section className="space-y-12">
          <div className="flex flex-col items-center text-center gap-3">
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
               {t("home.capabilitiesBadge")}
             </span>
             <h2 className="text-3xl md:text-5xl font-black tracking-tight">{t("home.featuresTitle")}</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className="bg-white dark:bg-[#1C1C1E] p-8 rounded-[2.5rem] border border-gray-200 dark:border-white/5 transition-all hover:border-blue-300 dark:hover:border-blue-900 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 group">
                <div className="w-12 h-12 bg-gray-50 dark:bg-[#2C2C2E] rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                   {featureIcons[i % featureIcons.length]}
                </div>
                <h4 className="font-bold text-base leading-tight mb-2">{f}</h4>
                <div className="w-8 h-1 bg-gray-100 dark:bg-gray-800 rounded-full group-hover:w-full group-hover:bg-blue-600 transition-all duration-500"></div>
              </div>
            ))}
          </div>
        </section>

        {/* FUTURE ROADMAP - GLASS PANEL */}
        <section className="relative overflow-hidden bg-white dark:bg-[#1C1C1E] rounded-[3.5rem] border border-gray-200 dark:border-white/5 p-8 md:p-20 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[120px] rounded-full -mr-20 -mt-20"></div>
          <div className="relative max-w-2xl">
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-orange-500 bg-orange-50 dark:bg-orange-950/30 px-3 py-1 rounded-full">
               {t("home.roadmapBadge")}
             </span>
             <h2 className="text-4xl md:text-6xl font-black tracking-tighter mt-4 mb-12 leading-tight">
               {t("home.futureTitle")}
             </h2>
             
             <div className="grid gap-4">
                {future.map((f, i) => (
                  <div key={i} className="flex items-center gap-5 p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-orange-200 dark:hover:border-orange-900/30 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-orange-500 group-hover:rotate-12 transition-transform">
                      {futureIcons[i % futureIcons.length]}
                    </div>
                    <span className="font-bold text-xl opacity-70 group-hover:opacity-100 transition-opacity">{f}</span>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="text-center space-y-8 pt-20 border-t border-gray-200 dark:border-white/10">
          <div className="flex justify-center gap-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
             <Database size={24} />
             <Terminal size={24} />
             <ShieldCheck size={24} />
             <Network size={24} />
          </div>
          <div className="space-y-2">
            <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em]">{t("home.footer")}</p>
            <p className="text-[10px] text-gray-400 font-medium">© 2026 Brain DB Project • OrionForgeNexus Enterprise</p>
          </div>
        </footer>
      </main>
    </div>
  );
}