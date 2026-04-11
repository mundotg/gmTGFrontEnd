"use client";
import React, { useState, useMemo } from "react";
import { useI18n } from "@/context/I18nContext";
import { 
  Database, Zap, ChevronRight, Search, Cpu, Terminal, 
   ScanText, Layout, Code2, Globe2, Share2, Info
} from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState("intro");
  const [searchQuery, setSearchQuery] = useState("");

  const menu = useMemo(() => [
    {
      id: "getting-started",
      title: t("docs.menu.intro") || "Primeiros Passos",
      icon: <Zap size={18} />,
      items: [
        { id: "intro", label: "O que é o Brain DB?" },
        { id: "theme", label: "Design System 2026" },
        { id: "conn", label: "Gestão de Conexões" }
      ]
    },
    {
      id: "core-features",
      title: t("docs.menu.features") || "Funcionalidades Core",
      icon: <Cpu size={18} />,
      items: [
        { id: "query-builder", label: "Query Builder No-Code" },
        { id: "ocr", label: "OCR Vision AI" },
        { id: "sse", label: "Streaming de Dados (SSE)" }
      ]
    },
    {
      id: "technical",
      title: t("docs.menu.technical") || "Referência Técnica",
      icon: <Terminal size={18} />,
      items: [
        { id: "audit", label: "Logs & Auditoria" },
        { id: "security", label: "Protocolos de Segurança" }
      ]
    }
  ], [t]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans antialiased selection:bg-blue-500/20">
      
      {/* NAVBAR GLASSMORPHISM */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-6 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Database size={18} strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-tight text-lg">Brain DB <span className="text-blue-600">Docs</span></span>
          </Link>
          
          <div className="relative hidden md:block w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder={t("docs.search") || "Pesquisar documentação..."}
              className="w-full px-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        
        {/* SIDEBAR NAVEGAÇÃO */}
        <aside className="w-full md:w-72 p-6 md:sticky md:top-16 md:h-[calc(100vh-64px)] overflow-y-auto border-r border-gray-200 dark:border-white/5">
          <div className="space-y-10">
            {menu.map((group) => (
              <div key={group.id} className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 px-3">
                  {group.icon} {group.title}
                </label>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <button 
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-between group ${
                          activeSection === item.id 
                            ? "bg-blue-600 text-white shadow-sm" 
                            : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        {item.label}
                        <ChevronRight size={14} className={activeSection === item.id ? "rotate-90" : "opacity-0 group-hover:opacity-100"} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* CONTEÚDO DINÂMICO */}
        <main className="flex-1 p-6 md:p-16">
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {activeSection === "intro" && (
              <article className="space-y-8">
                <header className="space-y-4">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Introdução ao Projeto</label>
                  <h1 className="text-5xl font-black tracking-tighter text-gray-900">OrionForgeNexus.</h1>
                  <p className="text-lg text-gray-500 font-medium leading-relaxed">
                    Uma plataforma centralizada para engenharia de dados e análise preditiva. O Brain DB atua como o motor de visualização e manipulação de bases de dados relacionais (PostgreSQL, Oracle, SQL Server, SQLite).
                  </p>
                </header>

                <div className="grid gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Layout size={18} className="text-blue-600"/> Arquitetura de Interface
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-medium">
                      O projeto utiliza Next.js 14 com a App Router, garantindo máxima performance através de Server Components e hidratação seletiva para componentes interativos como tabelas virtualizadas.
                    </p>
                  </div>
                </div>
              </article>
            )}

            {activeSection === "theme" && (
              <article className="space-y-8">
                <header className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Design System</label>
                  <h2 className="text-4xl font-black tracking-tighter">Padrão Oficial 2026</h2>
                </header>

                <div className="space-y-6">
                  <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-6">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3 block">Transição de Estados (Exemplo)</label>
                      <input 
                        type="text" 
                        placeholder="Clique para ver o foco..." 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">Arredondamento</label>
                        <div className="text-sm font-bold">rounded-xl (12px)</div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">Sombra</label>
                        <div className="text-sm font-bold">shadow-sm</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <Info className="text-amber-600 shrink-0" size={20} />
                    <p className="text-xs font-medium text-amber-800 leading-relaxed">
                      <strong>Nota de UI:</strong> Todos os botões primários devem usar `bg-blue-600` e labels informais de suporte devem sempre ser uppercase com espaçamento entre letras.
                    </p>
                  </div>
                </div>
              </article>
            )}

            {activeSection === "ocr" && (
              <article className="space-y-8">
                <header className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Módulo de Visão</label>
                  <h2 className="text-4xl font-black tracking-tighter">OCR Vision AI</h2>
                </header>
                
                <p className="text-gray-500 font-medium">Extração inteligente de dados a partir de documentos e imagens técnicas.</p>
                
                <div className="bg-white border border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center text-center gap-4 shadow-sm border-dashed border-2">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                    <ScanText size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-gray-900">Motor de Processamento Neural</h4>
                    <p className="text-xs text-gray-400 font-medium">Suporte para PNG, JPG e PDF estruturado.</p>
                  </div>
                </div>
              </article>
            )}

            {activeSection === "query-builder" && (
              <article className="space-y-8">
                <header className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Ferramentas SQL</label>
                  <h2 className="text-4xl font-black tracking-tighter">Query Builder</h2>
                </header>
                
                <div className="space-y-4">
                  <p className="text-gray-500 font-medium">Capacidade de gerar consultas complexas via interface visual, suportando:</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["Múltiplos JOINS (Inner/Left)", "Agregações Dinâmicas", "Filtros com Sub-queries", "Ordenação Virtualizada"].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            )}

            {/* Placeholder de Seções vazias */}
            {!["intro", "theme", "ocr", "query-builder"].includes(activeSection) && (
              <div className="py-20 text-center space-y-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <Code2 className="mx-auto text-gray-200" size={48} />
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Documentação em Atualização</h3>
              </div>
            )}

          </div>

          {/* FOOTER DOCS */}
          <footer className="mt-24 pt-10 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-6">
               <div className="flex flex-col">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Core Engine</label>
                  <span className="text-xs font-bold text-blue-600">v4.2.0-stable</span>
               </div>
               <div className="w-[1px] h-8 bg-gray-200" />
               <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider">
                 <Globe2 size={14} /> {t("docs.language") || "Português"}
               </button>
             </div>
             
             <div className="flex gap-3">
                <button className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-black transition-all shadow-sm flex items-center gap-2">
                  {t("docs.community") || "Comunidade"} <Share2 size={14} />
                </button>
             </div>
          </footer>
        </main>
      </div>
    </div>
  );
}