"use client";
import React, { useMemo } from 'react';
import {
  BarChart3, Database, TableProperties, Search,
  TrendingUp, Activity, Zap, Shield, Filter, Eye,
  FileText, GitBranch, Clock, Share2
} from 'lucide-react';
import Header from '../component/Header';
import StatsCards from '../component/StatsCards';
import DatabaseList from '../component/DatabaseList';
import FeatureSection from '../component/FeatureSection';
import UpcomingFeatures from '../component/UpcomingFeatures';
import QuickActions from '../component/QuickActions';
import { useI18n } from '@/context/I18nContext';
import { useSession } from '@/context/SessionContext';

const DatabaseManager = () => {
  const { t } = useI18n();
  const { user } = useSession();

  const stats = useMemo(() => [
    {
      label: t('Tabelas Conectadas'),
      value: user?.InfPlus?.ultima_consulta_em ? "1" : "0",
      icon: TableProperties,
      color: 'text-blue-600',
    },
    {
      label: t('Consultas Hoje'),
      value: `${user?.InfPlus?.num_consultas ?? 0}`,
      icon: Activity,
      color: 'text-green-600',
    },
    {
      label: t('Conexões Ativas'),
      value: user?.InfPlus?.ultima_consulta_em ? "1" : "0",
      icon: Database,
      color: 'text-purple-600',
    },
    {
      label: t('Registros Analisados'),
      value: `${user?.InfPlus?.registros_analizados ?? 0}`,
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
    status: user?.InfPlus?.type === db.type ? t('Conectado') : t('Disponível'),
  })), [user, t]);

  const features = [
    { title: t('Consultas Simplificadas'), description: t('Realize consultas digitando apenas o nome da tabela'), icon: Zap },
    { title: t('Pesquisa Rápida'), description: t('Encontre rapidamente as tabelas desejadas'), icon: Search },
    { title: t('Validação Automática'), description: t('Garantia de dados corretos conforme o tipo'), icon: Shield },
    { title: t('Filtros Personalizados'), description: t('Digite os campos que deseja filtrar facilmente'), icon: Filter },
    { title: t('Análise de Duplicados'), description: t('Identificação de duplicações com insights detalhados'), icon: Eye },
    { title: t('Modo SQL Avançado'), description: t('Execute comandos SQL diretamente'), icon: FileText },
  ];

  const upcomingFeatures = [
    { title: t('Visualização de Dados'), description: t('Dashboards interativos para acompanhar crescimento'), icon: BarChart3 },
    { title: t('Editor Visual de Relacionamentos'), description: t('Navegação entre tabelas com visualização'), icon: GitBranch },
    { title: t('Logs e Auditoria'), description: t('Registro de todas as ações do usuário'), icon: Clock },
    { title: t('Colaboração em Tempo Real'), description: t('Trabalhe com equipe em consultas simultâneas'), icon: Share2 },
  ];

  return (
    <main className="flex-1 overflow-auto p-8 space-y-10">
      <Header />
      <StatsCards stats={stats} />
      <DatabaseList databases={databases} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FeatureSection features={features} />
        <UpcomingFeatures upcomingFeatures={upcomingFeatures} />
      </div>
      <QuickActions />
    </main>
  );
};

export default DatabaseManager;
