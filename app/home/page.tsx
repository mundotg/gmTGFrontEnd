"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3, Database, TableProperties, 
  TrendingUp, Activity, Zap, Shield,  Eye,
   GitBranch, Clock, Sparkles,
  ArrowRight, CheckCircle2, AlertCircle, X, Terminal,
  Workflow, Settings, Brain, ScanText, Cloud,
  LayoutTemplate, Users, BookOpen
} from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { useSession } from '@/context/SessionContext';
import Header from '@/app/component/Header';
import StatsCards from '@/app/component/StatsCards';
import DatabaseList from '@/app/component/DatabaseList';
import FeatureSection from '@/app/component/FeatureSection';
import UpcomingFeatures from '@/app/component/UpcomingFeatures';
import QuickActions from '@/app/component/QuickActions';

const DatabaseManager = () => {
  const { t } = useI18n();
  const { user } = useSession();
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.email) return;

    const alreadyLogged = sessionStorage.getItem("login_done");
    if (alreadyLogged) return;

    fetch("/api/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: user.email }),
    })
      .then((res) => {
        if (res.ok) {
          sessionStorage.setItem("login_done", "1");
        }
      })
      .catch(() => {
        // silencioso para não disparar reloads ou interrupções
      });
  }, [user]);

  const stats = useMemo(() => {
    const hasDb = Boolean(user?.info_extra?.name_db);
    return [
      {
        label: t('dashboard_cards.tabelasConectadas') || 'Tabelas Conectadas',
        value: `${user?.info_extra?.num_table ?? (hasDb ? '1+' : '0')}`,
        icon: TableProperties,
        color: 'text-blue-600',
        href: '/home/tabelas',
        description: hasDb ? 'Explorar schemas e dados' : 'Conectar banco para carregar',
        badge: hasDb ? 'Sincronizado' : undefined,
      },
      {
        label: t('dashboard_cards.consultasHoje') || 'Consultas Realizadas',
        value: `${user?.info_extra?.num_consultas ?? 0}`,
        icon: Activity,
        color: 'text-green-600',
        href: '/home/historico',
        description: 'Histórico de execuções recentes',
        badge: user?.info_extra?.num_consultas ? 'Ativo' : undefined,
      },
      {
        label: t('dashboard_cards.conexoesAtivas') || 'Conexões Ativas',
        value: hasDb ? '1' : '0',
        icon: Database,
        color: 'text-purple-600',
        href: '/home/conexao',
        description: hasDb ? `BD: ${user?.info_extra?.name_db}` : 'Nenhuma conexão ativa',
        badge: user?.info_extra?.type ? user.info_extra.type.toUpperCase() : undefined,
      },
      {
        label: t('dashboard_cards.registrosAnalisados') || 'Registros Analisados',
        value: `${user?.info_extra?.registros_analizados ?? 0}`,
        icon: TrendingUp,
        color: 'text-orange-600',
        href: '/home/analizar',
        description: 'Auditoria e consistência de dados',
        badge: user?.info_extra?.registros_analizados ? 'Otimizado' : undefined,
      },
    ];
  }, [user, t]);

  const databases = useMemo(() => [
    { name: 'SQL Server', icon: '🔷', type: 'sqlserver', color: 'bg-blue-500' },
    { name: 'Oracle', icon: '🔴', type: 'oracle', color: 'bg-red-500' },
    { name: 'MySQL', icon: '🟠', type: 'mysql', color: 'bg-orange-500' },
    { name: 'PostgreSQL', icon: '🔵', type: 'postgresql', color: 'bg-indigo-500' },
    { name: 'MongoDB', icon: '🟢', type: 'mongodb', color: 'bg-green-500' },
    { name: 'SQLite', icon: '⚫', type: 'sqlite', color: 'bg-gray-500' },
  ].map(db => {
    const isCurrent = user?.info_extra?.type?.toLowerCase() === db.type.toLowerCase();
    return {
      ...db,
      status: isCurrent ? (t('status.connected') || 'Conectado') : (t('status.available') || 'Disponível'),
      isConnected: isCurrent,
      href: isCurrent ? '/home/tabelas' : `/home/conexao?type=${db.type}`,
    };
  }), [user, t]);

  const features = useMemo(() => [
    {
      title: t('dashboard_cards.consultasSimplificadas') || 'Consultas Simplificadas',
      description: t('dashboard_cards.consultasSimplificadasDesc') || 'Realize consultas digitando apenas o nome da tabela com filtros inteligentes',
      icon: Zap,
      href: '/home/consultas',
      badge: 'Pronto',
    },
    {
      title: t('dashboard_cards.pesquisaRapida') || 'Pesquisa & Exploração de Tabelas',
      description: t('dashboard_cards.pesquisaRapidaDesc') || 'Encontre rapidamente tabelas, schemas, colunas e visualize dados em tempo real',
      icon: TableProperties,
      href: '/home/tabelas',
      badge: 'Ativo',
    },
    {
      title: t('dashboard_cards.modoSql') || 'Modo SQL Avançado',
      description: t('dashboard_cards.modoSqlDesc') || 'Terminal completo com autocomplete, linting e execução de scripts SQL complexos',
      icon: Terminal,
      href: '/home/editorsql',
      badge: 'Terminal',
    },
    {
      title: t('dashboard_cards.gerenciadorConexoes') || 'Gerenciador Multi-Banco',
      description: t('dashboard_cards.gerenciadorConexoesDesc') || 'Conecte e alterne com segurança entre PostgreSQL, MySQL, SQL Server, Oracle e SQLite',
      icon: Database,
      href: '/home/conexao',
      badge: 'Multi-BD',
    },
    {
      title: t('dashboard_cards.validacaoAutomatica') || 'Auditoria & Validação de Dados',
      description: t('dashboard_cards.validacaoAutomaticaDesc') || 'Garantia de integridade, verificação de tipos e conformidade das colunas',
      icon: Shield,
      href: '/home/analizar',
      badge: 'Auditoria',
    },
    {
      title: t('dashboard_cards.analiseDuplicados') || 'Análise de Duplicados & Inconsistências',
      description: t('dashboard_cards.analiseDuplicadosDesc') || 'Identificação automática de registros duplicados e divergências de dados',
      icon: Eye,
      href: '/home/analizar',
      badge: 'Qualidade',
    },
    {
      title: t('dashboard_cards.assistenteIa') || 'Assistente IA de Dados',
      description: t('dashboard_cards.assistenteIaDesc') || 'Geração assistida de queries SQL, otimização e insights com IA generativa',
      icon: Sparkles,
      href: '/home/ai',
      badge: 'IA Ativa',
    },
    {
      title: t('dashboard_cards.logsAuditoria') || 'Histórico & Logs de Execução',
      description: t('dashboard_cards.logsAuditoriaDesc') || 'Rastreabilidade detalhada de consultas executadas, tempos e status',
      icon: Clock,
      href: '/home/historico',
      badge: 'Logs',
    },
    {
      title: t('dashboard_cards.configuracoes') || 'Configurações do Workspace',
      description: t('dashboard_cards.configuracoesDesc') || 'Personalização de ambiente, parâmetros de rede e ajustes de conta',
      icon: Settings,
      href: '/home/configuracao',
      badge: 'Sistema',
    },
  ], [t]);

  const upcomingFeatures = useMemo(() => [
    {
      title: t('dashboard_cards.visualizacaoDados') || 'Ciência de Dados & BI',
      description: t('dashboard_cards.visualizacaoDadosDesc') || 'Dashboards analíticos interativos, gráficos de dispersão, linhas e barras',
      icon: BarChart3,
      href: '/datascience',
      badge: 'Disponível',
    },
    {
      title: t('dashboard_cards.machineLearning') || 'Machine Learning & Predições',
      description: t('dashboard_cards.machineLearningDesc') || 'Treinamento de modelos preditivos, regressão e classificação com dados do banco',
      icon: Brain,
      href: '/home/mll',
      badge: 'Disponível',
    },
    {
      title: t('dashboard_cards.extracaoOcr') || 'Extração Inteligente OCR',
      description: t('dashboard_cards.extracaoOcrDesc') || 'Conversão de documentos e imagens em dados tabulares para importação direta no banco',
      icon: ScanText,
      href: '/home/ocr',
      badge: 'Disponível',
    },
    {
      title: t('dashboard_cards.integracaoCloud') || 'Integração Cloud & Storage',
      description: t('dashboard_cards.integracaoCloudDesc') || 'Gerenciamento de infraestrutura em nuvem, armazenamento e replicação de dados',
      icon: Cloud,
      href: '/clouds',
      badge: 'Disponível',
    },
    {
      title: t('dashboard_cards.geradorTemplates') || 'Criador de Templates SQL',
      description: t('dashboard_cards.geradorTemplatesDesc') || 'Modelos reutilizáveis de consultas estruturadas, relatórios e automações',
      icon: LayoutTemplate,
      href: '/createtamplete',
      badge: 'Disponível',
    },
    {
      title: t('dashboard_cards.colaboracaoTempoReal') || 'Gestão de Tarefas & Equipe',
      description: t('dashboard_cards.colaboracaoTempoRealDesc') || 'Compartilhamento de queries, gestão de tarefas e anotações com o time',
      icon: Users,
      href: '/task',
      badge: 'Disponível',
    },
    {
      title: t('dashboard_cards.dicionarioReferencia') || 'Dicionário & Referência de Dados',
      description: t('dashboard_cards.dicionarioReferenciaDesc') || 'Documentação de regras de negócio, glossário técnico e dicionário de schemas',
      icon: BookOpen,
      href: '/referencia',
      badge: 'Disponível',
    },
    {
      title: t('dashboard_cards.editorRelacionamentos') || 'Editor Visual de Relacionamentos (ER)',
      description: t('dashboard_cards.editorRelacionamentosDesc') || 'Diagramação canvas interativa de chaves primárias e estrangeiras (JOIN visual)',
      icon: GitBranch,
      badge: 'Em Breve',
      onClick: () => setShowRoadmapModal(true),
    },
  ], [t]);

  const isDbConnected = Boolean(user?.info_extra?.name_db);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header com dados do usuário e status da sessão */}
        <Header />

        {/* Hero Banner Dinâmico: Conexão Atual & Ações Rápidas */}
        <div className={`p-5 rounded-2xl border shadow-sm transition-all ${
          isDbConnected 
            ? 'bg-gradient-to-r from-emerald-90/90   text-white border-emerald-500/30' 
            : 'bg-gradient-to-r from-slate-90   text-white border-indigo-500/20'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-2xl ${
                isDbConnected ? ' text-emerald-300 ring-1 ' : ' text-amber-300 ring-1 '
              }`}>
                {isDbConnected ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${isDbConnected ? 'animate-pulse' : 'bg-amber-400'}`}></span>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {isDbConnected 
                      ? `Conectado ao Banco: ${user?.info_extra?.name_db}` 
                      : 'Nenhuma Conexão Ativa no Momento'}
                  </h2>
                  {user?.info_extra?.type && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                      {user.info_extra.type}
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-sm text-gray-300 mt-1">
                  {isDbConnected 
                    ? `${user?.info_extra?.num_table ?? 0} tabelas disponíveis • ${user?.info_extra?.num_consultas ?? 0} consultas executadas na sessão`
                    : 'Conecte sua base de dados PostgreSQL, MySQL, SQL Server, Oracle ou SQLite para começar a consultar e auditar seus dados.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {isDbConnected ? (
                <>
                  <Link
                    href="/home/tabelas"
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-sm hover:shadow active:scale-95"
                  >
                    <TableProperties className="w-4 h-4" />
                    <span>Explorar Tabelas</span>
                  </Link>
                  <Link
                    href="/home/editorsql"
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/10 transition-all hover:border-white/25 active:scale-95"
                  >
                    <Terminal className="w-4 h-4 text-emerald-300" />
                    <span>Editor SQL</span>
                  </Link>
                  <Link
                    href="/home/ai"
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 font-medium text-sm border border-indigo-400/30 transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>IA Assistant</span>
                  </Link>
                  <Link
                    href="/home/conexao"
                    className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-all border border-white/10"
                    title="Configurações de Conexão"
                  >
                    <Database className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <Link
                  href="/home/conexao"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95"
                >
                  <Database className="w-4 h-4" />
                  <span>Configurar Nova Conexão</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas Interativas */}
        <StatsCards stats={stats} />

        {/* Gerenciador / Lista de Bancos Suportados */}
        <DatabaseList databases={databases} />

        {/* Seção de Funcionalidades & Roadmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureSection features={features} />
          <UpcomingFeatures upcomingFeatures={upcomingFeatures} />
        </div>

        {/* Ações Rápidas em Grid com Ícones & Links */}
        <QuickActions />

      </div>

      {/* Modal Interativo do Roadmap (Ex: Editor Visual de Relacionamentos) */}
      {showRoadmapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setShowRoadmapModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                <Workflow className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 uppercase">
                  Em Desenvolvimento
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  Editor Visual de Relacionamentos (ER)
                </h3>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              Estamos integrando um diagrama interativo de Entidade-Relacionamento no estilo canvas, permitindo arrastar tabelas, visualizar chaves estrangeiras (FK), índices e gerar visualmente consultas <code className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded font-mono">JOIN</code> sem escrever código manual.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 space-y-2 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Exploração de Schemas e Colunas (Já disponível na página Tabelas)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Consultas com filtros e ordenação inteligente (Página Consultas)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Diagramação automática com exportação PNG/SVG (Próximo lançamento)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRoadmapModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Fechar
              </button>
              <Link
                href="/home/tabelas"
                onClick={() => setShowRoadmapModal(false)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm"
              >
                <span>Explorar Tabelas Agora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;