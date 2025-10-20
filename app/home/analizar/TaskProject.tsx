"use client"
import React, { useState, useEffect } from 'react';
// Importando ícones Lucid (substitua pelos imports reais da sua biblioteca)
import {
  Folder,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  TrendingUp,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { AnalizeDataType } from '@/types';

const ProjectAnalytics = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedProject, setSelectedProject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalizeDataType|null>(null);

  // Dados mockados baseados nos seus modelos
  const mockData:AnalizeDataType = {
    overview: {
      totalProjects: 12,
      activeProjects: 8,
      completedProjects: 3,
      overdueProjects: 1,
      totalTasks: 156,
      completedTasks: 89,
      teamMembers: 24
    },
    projectProgress: [
      { name: 'Projeto A', progress: 85, tasks: 23, completed: 19 },
      { name: 'Projeto B', progress: 62, tasks: 15, completed: 9 },
      { name: 'Projeto C', progress: 45, tasks: 18, completed: 8 },
      { name: 'Projeto D', progress: 92, tasks: 12, completed: 11 },
      { name: 'Projeto E', progress: 78, tasks: 20, completed: 15 }
    ],
    taskStatus: [
      { name: 'Concluída', value: 89 },
      { name: 'Em Andamento', value: 35 },
      { name: 'Pendente', value: 20 },
      { name: 'Em Revisão', value: 8 },
      { name: 'Bloqueada', value: 4 }
    ],
    teamPerformance: [
      { name: 'João Silva', tasks: 23, completed: 21, efficiency: 91 },
      { name: 'Maria Santos', tasks: 18, completed: 16, efficiency: 89 },
      { name: 'Pedro Costa', tasks: 15, completed: 12, efficiency: 80 },
      { name: 'Ana Oliveira', tasks: 20, completed: 18, efficiency: 90 },
      { name: 'Carlos Lima', tasks: 12, completed: 9, efficiency: 75 }
    ],
    weeklyActivity: [
      { week: 'Sem 1', tasks: 45, completed: 32 },
      { week: 'Sem 2', tasks: 38, completed: 28 },
      { week: 'Sem 3', tasks: 52, completed: 45 },
      { week: 'Sem 4', tasks: 41, completed: 35 }
    ],
    projectTypes: [
      { name: 'Desenvolvimento', value: 6 },
      { name: 'Manutenção', value: 3 },
      { name: 'Consultoria', value: 2 },
      { name: 'Pesquisa', value: 1 }
    ],
    recentActivity: [
      { id: 1, user: 'João Silva', action: 'concluiu tarefa', project: 'Projeto A', time: '2 min atrás' },
      { id: 2, user: 'Maria Santos', action: 'atribuiu tarefa', project: 'Projeto B', time: '15 min atrás' },
      { id: 3, user: 'Pedro Costa', action: 'atualizou status', project: 'Projeto C', time: '1 hora atrás' },
      { id: 4, user: 'Ana Oliveira', action: 'comentou', project: 'Projeto A', time: '2 horas atrás' }
    ]
  };

  useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      setAnalyticsData(mockData);
      setLoading(false);
    }, 1000);
  }, [timeRange, selectedProject]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando análise de projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Análise de Projetos
            </h1>
            <p className="text-gray-600 mt-2">Monitoramento de desempenho e produtividade da equipe</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
                <option value="quarter">Último Trimestre</option>
                <option value="year">Último Ano</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Projetos</option>
              <option value="project-a">Projeto A</option>
              <option value="project-b">Projeto B</option>
              <option value="project-c">Projeto C</option>
            </select>
          </div>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total de Projetos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Folder className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Projetos</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData?.overview.totalProjects}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+2 este mês</span>
          </div>
        </div>

        {/* Projetos Ativos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Projetos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData?.overview.activeProjects}</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {analyticsData?.overview.completedProjects} concluídos
          </div>
        </div>

        {/* Tarefas Concluídas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tarefas Concluídas</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData?.overview.completedTasks}</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            de {analyticsData?.overview.totalTasks} total
          </div>
        </div>

        {/* Projetos em Atraso */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Atraso</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData?.overview.overdueProjects}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-orange-600">
            <Clock className="w-4 h-4 mr-1" />
            <span>Necessita atenção</span>
          </div>
        </div>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Progresso dos Projetos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Progresso dos Projetos
            </h3>
          </div>
          <div className="h-80">
            {/* <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.projectProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="progress" name="Progresso (%)" fill="#0088FE" />
                <Bar dataKey="completed" name="Tarefas Concluídas" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer> */}
          </div>
        </div>

        {/* Status das Tarefas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-green-600" />
              Status das Tarefas
            </h3>
          </div>
          <div className="h-80">
            {/* <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.taskStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.taskStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase()]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer> */}
          </div>
        </div>
      </div>

      {/* Segunda Linha de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Desempenho da Equipe */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Desempenho da Equipe
            </h3>
          </div>
          <div className="h-80">
            {/* <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.teamPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="efficiency" name="Eficiência (%)" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer> */}
          </div>
        </div>

        {/* Atividade Semanal */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              Atividade Semanal
            </h3>
          </div>
          <div className="h-80">
            {/* <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tasks" name="Tarefas Criadas" stroke="#0088FE" strokeWidth={2} />
                <Line type="monotone" dataKey="completed" name="Tarefas Concluídas" stroke="#00C49F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer> */}
          </div>
        </div>
      </div>

      {/* Última Atividade */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          Atividade Recente
        </h3>
        <div className="space-y-4">
          {analyticsData?.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{activity.user}</p>
                  <p className="text-sm text-gray-600">
                    {activity.action} em <span className="font-medium">{activity.project}</span>
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalytics;