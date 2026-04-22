"use client";
import React, { useEffect, useMemo } from 'react';
import {
  BarChart3, Database, TableProperties, Search,
  TrendingUp, Activity, Zap, Shield, Filter, Eye,
  FileText, GitBranch, Clock, Share2
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

  const alreadyLogged = sessionStorage.getItem("login_done");

  useEffect(() => {
    if (!user || alreadyLogged) return;

    fetch("/api/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: user?.email }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        sessionStorage.setItem("login_done", "1");
        window.location.reload();
      })
      .catch(() => {
        if (!sessionStorage.getItem("login_retry")) {
          sessionStorage.setItem("login_retry", "1");
          window.location.reload();
        }
      });
  }, [user]);

  const stats = useMemo(() => [
    {
      label: t('dashboard_cards.tabelasConectadas') || t('Tabelas Conectadas'),
      value: user?.info_extra?.ultima_consulta_em ? "1" : "0",
      icon: TableProperties,
      color: 'text-blue-600',
    },
    {
      label: t('dashboard_cards.consultasHoje') || t('Consultas Hoje'),
      value: `${user?.info_extra?.num_consultas ?? 0}`,
      icon: Activity,
      color: 'text-green-600',
    },
    {
      label: t('dashboard_cards.conexoesAtivas') || t('Conexões Ativas'),
      value: user?.info_extra?.ultima_consulta_em ? "1" : "0",
      icon: Database,
      color: 'text-purple-600',
    },
    {
      label: t('dashboard_cards.registrosAnalisados') || t('Registros Analisados'),
      value: `${user?.info_extra?.registros_analizados ?? 0}`,
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ], [user, t]);

  const databases = useMemo(() => [
    { name: 'SQL Server', icon: '🔷', type: 'sqlserver', color: 'bg-blue-500' },
    { name: 'Oracle', icon: '🔴', type: 'oracle', color: 'bg-red-500' },
    { name: 'MySQL', icon: '🟠', type: 'mysql', color: 'bg-orange-500' },
    { name: 'PostgreSQL', icon: '🔵', type: 'postgresql', color: 'bg-indigo-500' },
    { name: 'MongoDB', icon: '🟢', type: 'mongodb', color: 'bg-green-500' },
    { name: 'SQLite', icon: '⚫', type: 'sqlite', color: 'bg-gray-500' },
  ].map(db => ({
    ...db,
    status: user?.info_extra?.type === db.type ? (t('status.connected') || t('Conectado')) : (t('status.available') || t('Disponível')),
  })), [user, t]);

  const features = useMemo(() => [
    {
      title: t('dashboard_cards.consultasSimplificadas') || t('Consultas Simplificadas'),
      description: t('dashboard_cards.consultasSimplificadasDesc') || t('Realize consultas digitando apenas o nome da tabela'),
      icon: Zap
    },
    {
      title: t('dashboard_cards.pesquisaRapida') || t('Pesquisa Rápida'),
      description: t('dashboard_cards.pesquisaRapidaDesc') || t('Encontre rapidamente as tabelas desejadas'),
      icon: Search
    },
    {
      title: t('dashboard_cards.validacaoAutomatica') || t('Validação Automática'),
      description: t('dashboard_cards.validacaoAutomaticaDesc') || t('Garantia de dados corretos conforme o tipo'),
      icon: Shield
    },
    {
      title: t('dashboard_cards.filtrosPersonalizados') || t('Filtros Personalizados'),
      description: t('dashboard_cards.filtrosPersonalizadosDesc') || t('Digite os campos que deseja filtrar facilmente'),
      icon: Filter
    },
    {
      title: t('dashboard_cards.analiseDuplicados') || t('Análise de Duplicados'),
      description: t('dashboard_cards.analiseDuplicadosDesc') || t('Identificação de duplicações com insights detalhados'),
      icon: Eye
    },
    {
      title: t('dashboard_cards.modoSql') || t('Modo SQL Avançado'),
      description: t('dashboard_cards.modoSqlDesc') || t('Execute comandos SQL diretamente'),
      icon: FileText
    },
  ], [t]);

  const upcomingFeatures = useMemo(() => [
    {
      title: t('dashboard_cards.visualizacaoDados') || t('Visualização de Dados'),
      description: t('dashboard_cards.visualizacaoDadosDesc') || t('Dashboards interativos para acompanhar crescimento'),
      icon: BarChart3
    },
    {
      title: t('dashboard_cards.editorRelacionamentos') || t('Editor Visual de Relacionamentos'),
      description: t('dashboard_cards.editorRelacionamentosDesc') || t('Navegação entre tabelas com visualização'),
      icon: GitBranch
    },
    {
      title: t('dashboard_cards.logsAuditoria') || t('Logs e Auditoria'),
      description: t('dashboard_cards.logsAuditoriaDesc') || t('Registro de todas as ações do usuário'),
      icon: Clock
    },
    {
      title: t('dashboard_cards.colaboracaoTempoReal') || t('Colaboração em Tempo Real'),
      description: t('dashboard_cards.colaboracaoTempoRealDesc') || t('Trabalhe com equipe em consultas simultâneas'),
      icon: Share2
    },
  ], [t]);

  return (
    // Aplicando exatamente a sua estrutura de fundo e padding
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* O Header e os outros componentes já devem ter os cards internos estilizados como bg-white rounded-xl shadow-sm border,
            mas o container principal em volta deles segue a regra do gray-50 e do max-w-7xl que você definiu. */}
        <Header />

        <StatsCards stats={stats} />

        <DatabaseList databases={databases} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureSection features={features} />
          <UpcomingFeatures upcomingFeatures={upcomingFeatures} />
        </div>

        <QuickActions />

      </div>
    </div>
  );
};

export default DatabaseManager;