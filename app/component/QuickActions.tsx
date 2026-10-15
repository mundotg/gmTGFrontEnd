import React from 'react';
import Link from 'next/link';
import {
  Search,
  Database,
  BarChart3,
  Terminal,
  TableProperties,
  Bot,
  ArrowUpRight,
} from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      label: 'Nova Consulta',
      desc: 'Consulta assistida por tabela',
      href: '/home/consultas',
      icon: Search,
    },
    {
      label: 'Editor SQL',
      desc: 'Comandos SQL e scripts livres',
      href: '/home/editorsql',
      icon: Terminal,
    },
    {
      label: 'Explorar Tabelas',
      desc: 'Estruturas, colunas e registros',
      href: '/home/tabelas',
      icon: TableProperties,
    },
    {
      label: 'Conectar / Gerir BD',
      desc: 'Configurar novos bancos de dados',
      href: '/home/conexao',
      icon: Database,
    },
    {
      label: 'Auditar & Analisar',
      desc: 'Qualidade, métricas e duplicados',
      href: '/home/analizar',
      icon: BarChart3,
    },
    {
      label: 'Assistente IA',
      desc: 'Pergunte em linguagem natural',
      href: '/home/ai',
      icon: Bot,
    },
  ];

  return (
    <div className="mt-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 rounded-full bg-purple-400/10 blur-2xl pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight">Ações Rápidas do Workspace</h3>
            <p className="text-xs text-blue-100/90 mt-0.5">
              Aceda diretamente às principais ferramentas da sua infraestrutura
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 font-medium text-white/95">
            Acesso Rápido
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                href={action.href}
                className="flex items-center space-x-3.5 bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-md border border-white/20 hover:border-white/40 rounded-xl p-4 transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="p-2.5 rounded-lg bg-white/20 group-hover:bg-white/30 group-hover:scale-105 transition-all shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white truncate">{action.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-white/60 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-blue-100/80 truncate mt-0.5">{action.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}