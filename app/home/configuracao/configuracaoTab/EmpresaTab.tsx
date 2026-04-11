"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Shield,
  Plus,
  X,
  Check,
  ChevronRight,
  Briefcase
} from "lucide-react";

/* =======================
   CONSTANTES E TIPOS
======================= */

const ALL_PERMISSIONS = [
  {
    group: "Usuários",
    items: [
      { id: "user:create", label: "Criar Usuário" },
      { id: "user:read", label: "Ver Usuários" },
      { id: "user:update", label: "Editar Usuário" },
      { id: "user:delete", label: "Excluir Usuário" },
      { id: "user:invite", label: "Convidar" },
    ],
  },
  {
    group: "Projetos",
    items: [
      { id: "project:create", label: "Criar Projeto" },
      { id: "project:read", label: "Ver Projetos" },
      { id: "project:update", label: "Editar Projeto" },
      { id: "project:delete", label: "Remover Projeto" },
    ],
  },
];

interface Cargo {
  id: number;
  nome: string;
  nivel: "junior" | "pleno" | "senior";
  descricao?: string;
  permissions: string[];
}

/* =======================
   COMPONENTE PRINCIPAL
======================= */

export const EmpresaTab = () => {
  const [saving, setSaving] = useState(false);
  const [cargoSelecionado, setCargoSelecionado] = useState<Cargo | null>(null);
  // const [searchTerm, setSearchTerm] = useState("");

  const [empresa, setEmpresa] = useState({
    nome: "Tech Solutions Lda",
    documento: "700000000",
    email: "contato@empresa.com",
    telefone: "+244 999 999 999",
  });

  const [cargos, setCargos] = useState<Cargo[]>([
    {
      id: 1,
      nome: "Administrador",
      nivel: "senior",
      descricao: "Acesso total ao sistema",
      permissions: ALL_PERMISSIONS.flatMap(g => g.items.map(i => i.id)),
    },
    {
      id: 2,
      nome: "Analista",
      nivel: "pleno",
      descricao: "Acesso a operações de rotina",
      permissions: ["user:read", "project:read"],
    },
  ]);

  const handleSaveAll = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    // Idealmente usar um Toast aqui
  };

  const togglePermission = (permId: string) => {
    if (!cargoSelecionado) return;
    const hasPerm = cargoSelecionado.permissions.includes(permId);
    setCargoSelecionado({
      ...cargoSelecionado,
      permissions: hasPerm 
        ? cargoSelecionado.permissions.filter(p => p !== permId)
        : [...cargoSelecionado.permissions, permId]
    });


  };

 useEffect(() => {
    // Simula fetch dos dados da empresa e cargos
    if (!empresa) return;
    const fetchData = async () => {
      // Simulação de delay
      await new Promise(r => setTimeout(r, 800));
      setEmpresa({
        nome: "Tech Solutions Lda",
        documento: "700000000",
        email: "contato@techsolutions.com",
        telefone: "+244 999 999 999"
      });
      // Aqui você faria fetch real e setaria os estados com os dados
    };
    fetchData();
  }, [empresa]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex justify-between items-end border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Gestão da Organização</h2>
          <p className="text-gray-500 mt-1">Controle dados institucionais, hierarquia de cargos e níveis de acesso.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: DADOS EMPRESA */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 size={20} />
              </div>
              <h3 className="font-bold text-gray-800">Identidade</h3>
            </div>
            
            <div className="space-y-4">
              <Input label="Nome da Organização" value={empresa.nome} />
              <Input label="NIF / Documento" value={empresa.documento} />
              <Input label="E-mail Institucional" value={empresa.email} />
              <Input label="Telefone de Contato" value={empresa.telefone} />
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA: CARGOS */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Briefcase size={20} />
                </div>
                <h3 className="font-bold text-gray-800">Cargos e Funções</h3>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                <Plus size={16} /> Novo Cargo
              </button>
            </div>

            <div className="grid gap-3">
              {cargos.map(cargo => (
                <div 
                  key={cargo.id}
                  className="group flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                      <Shield size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{cargo.nome}</p>
                        <Badge nivel={cargo.nivel} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{cargo.descricao}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setCargoSelecionado(cargo)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-purple-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-all"
                  >
                    Permissões <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO GLOBAIS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-4 z-40">
        <div className="max-w-5xl mx-auto flex justify-end gap-3">
          <button className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            Descartar Alterações
          </button>
          <button 
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-70 transition-all shadow-lg shadow-gray-200"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
            Salvar Configurações
          </button>
        </div>
      </div>

      {/* MODAL DE PERMISSÕES (RBAC) */}
      {cargoSelecionado && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Definir Acessos</h3>
                <p className="text-sm text-gray-500">Configurando permissões para <span className="font-semibold text-purple-600">{cargoSelecionado.nome}</span></p>
              </div>
              <button 
                onClick={() => setCargoSelecionado(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              {ALL_PERMISSIONS.map(group => (
                <div key={group.group}>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-8 h-px bg-gray-100"></span> {group.group}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.items.map(perm => {
                      const isActive = cargoSelecionado.permissions.includes(perm.id);
                      return (
                        <button
                          key={perm.id}
                          onClick={() => togglePermission(perm.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                            isActive 
                              ? "border-purple-200 bg-purple-50 text-purple-700 shadow-sm" 
                              : "border-gray-100 bg-gray-50/50 text-gray-500 hover:border-gray-200"
                          }`}
                        >
                          <span className="text-sm font-medium">{perm.label}</span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isActive ? "bg-purple-600 border-purple-600 text-white" : "bg-white border-gray-300"
                          }`}>
                            {isActive && <Check size={12} strokeWidth={4} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t bg-gray-50/50 flex justify-end gap-3">
              <button 
                className="px-4 py-2 text-sm font-medium text-gray-600"
                onClick={() => setCargoSelecionado(null)}
              >
                Voltar
              </button>
              <button 
                className="px-6 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-100"
                onClick={() => {
                  setCargos(prev => prev.map(c => c.id === cargoSelecionado.id ? cargoSelecionado : c));
                  setCargoSelecionado(null);
                }}
              >
                Confirmar Acessos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =======================
   SUB-COMPONENTES
======================= */

function Input({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">
        {label}
      </label>
      <input
        value={value}
        readOnly
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-default"
      />
    </div>
  );
}

function Badge({ nivel }: { nivel: Cargo["nivel"] }) {
  const styles = {
    junior: "bg-emerald-50 text-emerald-700 border-emerald-100",
    pleno: "bg-blue-50 text-blue-700 border-blue-100",
    senior: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${styles[nivel]}`}>
      {nivel}
    </span>
  );
}