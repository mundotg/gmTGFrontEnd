"use client";

import { useState } from "react";
import {
  Plus,
  FolderKanban,
  Users,
  Database,
  Settings,
  Archive,
  Loader2,
  Target,
  ChevronRight
} from "lucide-react";
import { useSession } from "@/context/SessionContext";

/* =====================
   TYPES & CONSTANTS
===================== */
type ProjectStatus = "Ativo" | "Pausado" | "Arquivado";

interface Projeto {
  id: number;
  name: string;
  description?: string;
  status: ProjectStatus;
  tasks: number;
  connections: number;
  members: number;
  progress: number; // Novo: para feedback visual
}

const STATUS_THEMES: Record<ProjectStatus, string> = {
  Ativo: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Pausado: "bg-amber-50 text-amber-700 border-amber-100",
  Arquivado: "bg-slate-100 text-slate-600 border-slate-200",
};

/* =====================
   COMPONENT
===================== */
export const ProjetosTab = () => {
  const { user } = useSession();
  const permissions = user?.permissions || [];
  
  const canCreate = permissions.includes("project:create") || permissions.includes("admin:*");
  const canEdit = permissions.includes("project:update") || permissions.includes("admin:*");

  const [projects, setProjects] = useState<Projeto[]>([
    {
      id: 1,
      name: "Dashboard Analytics",
      description: "Análises estratégicas e KPIs em tempo real",
      status: "Ativo",
      tasks: 24,
      connections: 2,
      members: 5,
      progress: 65
    },
    {
      id: 2,
      name: "API Integration",
      description: "Sincronização com gateways de pagamento",
      status: "Pausado",
      tasks: 18,
      connections: 1,
      members: 3,
      progress: 30
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateProject = async (data: Partial<Projeto>) => {
    setLoading(true);
    // Simulação de API
    await new Promise(r => setTimeout(r, 1000));
    
    const newProject: Projeto = {
      id: Date.now(),
      name: data.name || "Sem nome",
      description: data.description,
      status: "Ativo",
      tasks: 0,
      connections: 0,
      members: 1,
      progress: 0
    };

    setProjects(prev => [newProject, ...prev]);
    setLoading(false);
    setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Projetos</h2>
          <p className="text-gray-500 text-sm">Gerencie o ecossistema de dados e equipes da sua organização.</p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Novo Projeto
          </button>
        )}
      </div>

      {/* PROJECT GRID */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} canEdit={canEdit} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
          <FolderKanban size={64} strokeWidth={1} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">Nenhum projeto encontrado</p>
          <p className="text-sm">Comece criando seu primeiro workspace de dados.</p>
        </div>
      )}

      {/* METAS SECTION */}
      <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
              <Target size={14} /> OKRs & Milestones
            </div>
            <h3 className="text-xl font-bold">Objetivos Estratégicos</h3>
            <p className="text-gray-400 text-sm max-w-xl">
              Acompanhe o progresso global através de indicadores de sucesso. 
              Conecte tarefas a metas trimestrais da empresa.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors backdrop-blur-sm border border-white/10">
            Configurar Metas <ChevronRight size={16} />
          </button>
        </div>
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      </div>

      {showModal && (
        <CreateProjectModal 
          onClose={() => setShowModal(false)} 
          onSubmit={handleCreateProject}
          loading={loading}
        />
      )}
    </div>
  );
};

/* =====================
   SUB-COMPONENTS
===================== */

const ProjectCard = ({ project, canEdit }: { project: Projeto, canEdit: boolean }) => (
  <div className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner group-hover:scale-110 transition-transform">
          {project.name.charAt(0)}
        </div>
        <div>
          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-1">
            {project.description || "Sem descrição disponível"}
          </p>
        </div>
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${STATUS_THEMES[project.status]}`}>
        {project.status}
      </span>
    </div>

    {/* PROGRESS BAR */}
    <div className="mb-6 space-y-1.5">
      <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
        <span>Progresso</span>
        <span>{project.progress}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 rounded-full transition-all duration-500" 
          style={{ width: `${project.progress}%` }}
        />
      </div>
    </div>

    {/* STATS GRID */}
    <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-50 mb-4">
      <Stat icon={<FolderKanban size={14} />} label="Tasks" value={project.tasks} />
      <Stat icon={<Database size={14} />} label="DBs" value={project.connections} />
      <Stat icon={<Users size={14} />} label="Equipe" value={project.members} />
    </div>

    <div className="flex justify-between items-center">
      <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors uppercase tracking-wider">
        Workspace <ChevronRight size={14} />
      </button>

      {canEdit && (
        <div className="flex gap-1">
          <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            <Settings size={16} />
          </button>
          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Archive size={16} />
          </button>
        </div>
      )}
    </div>
  </div>
);

const Stat = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) => (
  <div className="text-center space-y-0.5">
    <div className="flex justify-center text-gray-400">{icon}</div>
    <div className="text-xs font-bold text-gray-900">{value}</div>
    <div className="text-[10px] text-gray-400 uppercase tracking-tight">{label}</div>
  </div>
);

const CreateProjectModal = ({ onClose, onSubmit, loading }: any) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Novo Workspace</h3>
          <p className="text-gray-500 text-sm">Inicie um novo projeto para sua equipe.</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({ name, description: desc }); }}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome do Projeto</label>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Expansão Q3"
              className="w-full border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Descrição (Opcional)</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Breve resumo do objetivo..."
              className="w-full border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name}
              className="flex-1 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg shadow-gray-200"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Criar Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};