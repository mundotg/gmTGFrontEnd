"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  Lock,
  Palette,
  User,
  Shield,
  Key,
  Globe,
  Clock,
  Download,
  Trash2,
  Save,
  X,
  CheckCircle2,
  Camera,
  LogOut,
  ChevronRight
} from "lucide-react";
import { useSession, Usuario } from "@/context/SessionContext";
// Assumindo que Input venha do seu projeto, mantive. 
// Se der erro, substitua por um input HTML padrão com classes Tailwind.
import { Input } from "@/app/component"; 

/* =======================
   INTERFACES
======================= */
interface UserSettingItem {
  id: string;
  icon: any;
  title: string;
  description: string;
  permission?: string;
  badge?: string;
  color?: string;
}

/* =======================
   COMPONENTES AUXILIARES
======================= */

// Card de Estatística Pequeno
const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
    <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
      <Icon size={20} className={color.replace('bg-', 'text-').replace('-50', '-600')} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">{label}</p>
    </div>
  </div>
);

// Item de Configuração (Card Principal)
const SettingItem = ({ icon: Icon, title, description, badge, onClick, color = "text-blue-600 bg-blue-50" }: any) => (
  <button
    onClick={onClick}
    className="group relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-300 text-left w-full overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300">
      <ChevronRight size={20} />
    </div>
    
    <div className="flex items-start gap-4">
      <div className={`p-3.5 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} />
      </div>
      <div className="flex-1 pr-6">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{title}</h3>
          {badge && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] uppercase tracking-wider rounded-full font-bold">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  </button>
);

/* =======================
   MODAL DE EDIÇÃO
======================= */
interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  settingId: string;
  title: string;
  user?: Usuario | null;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, settingId, title, user }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (user) {
      setForm({
        nome: user.nome || "",
        email: user.email || "",
        telefone: user?.telefone || "",
        cargo: user?.cargo?.position || "",
        avatar_url: user?.avatar_url || "",
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  const renderContent = () => {
    switch (settingId) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400 bg-gray-100">
                      {user?.nome?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Clique para alterar foto</p>
            </div>

            <div className="grid gap-4">
                <Input label="Nome completo" value={form.nome} onChange={(e:any) => setForm({...form, nome: e.target.value})} />
                <Input label="Email" value={form.email} disabled hint="Entre em contato com o suporte para alterar." />
                <div className="grid grid-cols-2 gap-4">
                     <Input label="Telefone" value={form.telefone} placeholder="+244..." />
                     <Input label="Cargo" value={form.cargo} />
                </div>
            </div>
          </div>
        );
      case "security":
        return (
          <div className="space-y-5">
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex gap-3">
              <Shield className="text-orange-500 shrink-0" size={20} />
              <div className="text-sm text-orange-800">
                <span className="font-bold block mb-1">Recomendação de Segurança</span>
                Ative a autenticação de dois fatores para evitar acessos não autorizados.
              </div>
            </div>
            <div className="space-y-3 pt-2">
                <Input label="Senha atual" type="password" />
                <Input label="Nova senha" type="password" />
                <Input label="Confirmar senha" type="password" />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex gap-3 items-center">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Key size={18} /></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Autenticação em 2 Fatores (2FA)</p>
                  <p className="text-xs text-gray-500">Adiciona uma camada extra de segurança</p>
                </div>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                  <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition"/>
              </div>
            </div>
          </div>
        );
      default: return <div className="text-center py-10 text-gray-500">Configuração em desenvolvimento</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                <CheckCircle2 size={32} />
              </div>
              <p className="text-lg font-semibold text-gray-900">Alterações salvas!</p>
            </div>
          ) : renderContent()}
        </div>

        {!success && (
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm rounded-lg transition-all">
              Cancelar
            </button>
            <button 
                onClick={handleSave} 
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg shadow-sm flex justify-center items-center gap-2 transition-all disabled:opacity-70"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={16} />}
              <span>Salvar Alterações</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* =======================
   COMPONENTE PRINCIPAL
======================= */
export function UsuarioTab() {
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const { user } = useSession();

  const settings: UserSettingItem[] = [
    {
      id: "profile",
      icon: User,
      title: "Perfil Pessoal",
      description: "Gerencie seus dados de identificação e contato.",
      permission: "user:update",
      color: "text-purple-600 bg-purple-50"
    },
    {
      id: "security",
      icon: Lock,
      title: "Login e Segurança",
      description: "Proteja sua conta e verifique atividades suspeitas.",
      permission: "security:update",
      badge: "Crítico",
      color: "text-orange-600 bg-orange-50"
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notificações",
      description: "Escolha como e quando você quer ser alertado.",
      permission: "notifications:update",
      color: "text-blue-600 bg-blue-50"
    },
    {
      id: "appearance",
      icon: Palette,
      title: "Preferências",
      description: "Ajuste o tema, idioma e visualização do sistema.",
      color: "text-pink-600 bg-pink-50"
    },
  ];

  const recentActivities = [
    { action: "Login realizado (Chrome/Windows)", time: "Agora mesmo", icon: Globe },
    { action: "Senha alterada", time: "Há 2 semanas", icon: Lock },
    { action: "Backup automático", time: "Ontem, 14:00", icon: Save },
  ];

  const hasPermission = (permissions: string[], permission?: string) => {
    if (!permission) return true;
    return permissions.includes(permission);
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      
      {/* HEADER SECTION */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Minha Conta</h1>
        <p className="text-gray-500 mt-1">Gerencie suas informações pessoais, privacidade e segurança.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA DA ESQUERDA: CONFIGURAÇÕES (8/12 no desktop) */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* Grid de Cards de Configuração */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings
                .filter((item) => hasPermission(user?.permissions || [], item.permission))
                .map((item) => (
                    <SettingItem
                        key={item.id}
                        {...item}
                        onClick={() => setModalOpen(item.id)}
                    />
                ))}
            </div>

            {/* Área de Perigo / Ações Secundárias */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                <div className="flex gap-4 items-center">
                    <div className="p-3 bg-white rounded-full text-red-500 shadow-sm">
                        <Trash2 size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-red-900">Zona de Perigo</h4>
                        <p className="text-sm text-red-700">Ações irreversíveis como excluir sua conta.</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-4 py-2 bg-white text-gray-700 border border-gray-200 hover:border-gray-300 rounded-lg text-sm font-medium shadow-sm flex items-center justify-center gap-2">
                        <Download size={16} /> Exportar
                    </button>
                    <button className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium shadow-sm flex items-center justify-center gap-2">
                        Excluir Conta
                    </button>
                </div>
            </div>
        </div>

        {/* COLUNA DA DIREITA: SIDEBAR / INFO (4/12 no desktop) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
            
            {/* Card de Perfil Resumido */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10"></div>
                <div className="relative mt-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md">
                        {user?.nome?.charAt(0) || "U"}
                    </div>
                    <h2 className="mt-3 text-lg font-bold text-gray-900">{user?.nome || "Usuário"}</h2>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <span className="inline-block mt-3 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full border border-gray-200">
                        {user?.role?.name || "Membro"}
                    </span>
                </div>
            </div>

            {/* Mini Dashboard de Stats */}
            <div className="grid grid-cols-2 gap-3">
                 <StatCard icon={CheckCircle2} value="42" label="Tarefas" color="bg-green-50 text-green-600" />
                 <StatCard icon={Clock} value="12d" label="Ativo" color="bg-blue-50 text-blue-600" />
            </div>

            {/* Feed de Atividade */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Clock size={16} /> Atividade Recente
                </h3>
                <div className="space-y-0 relative">
                    {/* Linha conectora vertical */}
                    <div className="absolute left-4 top-2 bottom-4 w-0.5 bg-gray-100"></div>
                    
                    {recentActivities.map((activity, i) => (
                        <div key={i} className="flex gap-4 relative py-3 first:pt-0 last:pb-0">
                            <div className="relative z-10 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                                <activity.icon size={14} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Botão de Logout Rápido */}
             <button className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium">
                <LogOut size={18} /> Sair da conta
             </button>
        </div>

      </div>

      {modalOpen && (
        <EditModal
          user={user}
          isOpen={!!modalOpen}
          onClose={() => setModalOpen(null)}
          settingId={modalOpen}
          title={settings.find(s => s.id === modalOpen)?.title || ""}
        />
      )}
    </div>
  );
}