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
  ChevronRight,
  Construction,
  LucideIcon
} from "lucide-react";
import { useSession, Usuario } from "@/context/SessionContext";
// Assumindo que Input venha do seu projeto, mantive. 
// Se der erro, substitua por um input HTML padrão com classes Tailwind.
import { useI18n } from "@/context/I18nContext";
import Image from "next/image";

/* =======================
   INTERFACES
======================= */
interface UserSettingItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  permission?: string;
  badge?: string;
  color?: string;
}

/* =======================
   COMPONENTES AUXILIARES
======================= */

// Componente StatCard auxiliar
interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, color }) => {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs font-medium opacity-90 mt-1">{label}</p>
        </div>
        <Icon size={20} className="opacity-80" />
      </div>
    </div>
  );
};

// Item de Configuração (Card Principal)
const SettingItem = ({ icon: Icon, title, description, badge, onClick, color = "text-blue-600 bg-blue-50" }: 
  { icon: LucideIcon; title: string; description: string; badge?: string; onClick: () => void; color?: string }) => (
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
  const { t } = useI18n();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cargo: "",
    avatar_url: "",
    senhaAtual: "",
    roles: [] as string[],
    empresa: "",
    novaSenha: "",
    confirmarSenha: "",
    doisFatoresAtivo: false
  });

  // Inicializar o form com os dados do usuário
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        nome: user.nome || "",
        email: user.email || "",
        telefone: user?.telefone || "",
        cargo: user?.cargo?.position || "",
        empresa: typeof user?.empresa === 'string' ? user.empresa : user?.empresa?.company || "",
        roles: Array.isArray(user?.roles) ? user.roles.map(role => typeof role === 'string' ? role : role.name || '') : [],
        avatar_url: user?.avatar_url || "",
      }));
    }
  }, [user, isOpen]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Resetar estado quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSuccess(false);
        setLoading(false);
        setForm({
          nome: "",
          email: "",
          telefone: "",
          cargo: "",
          avatar_url: "",
          senhaAtual: "",
          roles: [],
          empresa: "",
          novaSenha: "",
          confirmarSenha: "",
          doisFatoresAtivo: false
        });
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof typeof form, value: string | boolean | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validações básicas
      if (settingId === "security") {
        if (form.novaSenha && form.novaSenha !== form.confirmarSenha) {
          alert(t("modal.passwordsMismatch") || "As senhas não coincidem!");
          setLoading(false);
          return;
        }
        if (form.novaSenha && !form.senhaAtual) {
          alert(t("modal.enterCurrentPassword") || "Digite sua senha atual para alterar!");
          setLoading(false);
          return;
        }
      }

      if (settingId === "profile") {
        if (!form.nome.trim()) {
          alert(t("modal.nameRequired") || "Nome completo é obrigatório!");
          setLoading(false);
          return;
        }
      }

      // Simular API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Em produção, aqui seria sua chamada à API
      console.log("Dados a serem enviados:", form);
      
      setSuccess(true);
      
      // Fechar automaticamente após sucesso
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert(t("modal.saveError") || "Erro ao salvar alterações");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação básica
    if (!file.type.startsWith('image/')) {
      alert(t("modal.invalidImage") || "Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert(t("modal.imageTooLarge") || "A imagem deve ter no máximo 5MB");
      return;
    }

    // Em produção, aqui você faria upload para um servidor
    const reader = new FileReader();
    reader.onloadend = () => {
      handleInputChange('avatar_url', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const availableRoles = [
    "admin",
    "editor", 
    "viewer",
    "manager",
    "user"
  ];

  const renderContent = () => {
    switch (settingId) {
      case "profile":
        return (
          <div className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center">
              <label className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
                <div className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {form.avatar_url ? (
                    <Image 
                      src={form.avatar_url} 
                      alt={t("modal.avatarAlt", { name: form.nome }) || `Avatar de ${form.nome}`}
                      className="w-full h-full object-cover" 
                      width={112}
                      height={112}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400 dark:text-gray-300 bg-gray-100 dark:bg-gray-700">
                      {form.nome?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 dark:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t("modal.changePhotoHint") || "Clique para alterar foto (max. 5MB)"}
              </p>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4">
              {/* Nome Completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.fullName") || "Nome completo"} *
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                  placeholder={t("modal.enterYourName") || "Digite seu nome completo"}
                />
              </div>

              {/* Email (disabled) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.email") || "Email"}
                </label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("modal.emailHelp") || "Entre em contato com o suporte para alterar o email."}
                </p>
              </div>

              {/* Grid: Telefone e Cargo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.phone") || "Telefone"}
                  </label>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="+244 900 000 000"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.position") || "Cargo"}
                  </label>
                  <input
                    type="text"
                    value={form.cargo}
                    onChange={(e) => handleInputChange('cargo', e.target.value)}
                    placeholder={t("modal.yourPosition") || "Seu cargo atual"}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Grid: Empresa e Roles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.company") || "Empresa"}
                  </label>
                  <input
                    type="text"
                    value={form.empresa}
                    onChange={(e) => handleInputChange('empresa', e.target.value)}
                    placeholder={t("modal.companyName") || "Nome da empresa"}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.roles") || "Funções"}
                  </label>
                  <select
                    multiple
                    value={form.roles}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      handleInputChange('roles', selected);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[42px] max-h-32 overflow-y-auto"
                    size={3}
                  >
                    {availableRoles.map((role) => (
                      <option 
                        key={role} 
                        value={role}
                        className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {t(`roles.${role}`) || role}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("modal.rolesHint") || "Mantenha Ctrl/Cmd pressionado para selecionar múltiplas"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-5">
            {/* Security Warning */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-lg p-4 flex gap-3">
              <Shield className="text-orange-500 dark:text-orange-400 shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-orange-800 dark:text-orange-300">
                <span className="font-bold block mb-1">
                  {t("modal.securityRecommendation") || "Recomendação de Segurança"}
                </span>
                {t("modal.securityAdvice") || "Ative a autenticação de dois fatores para evitar acessos não autorizados."}
              </div>
            </div>

            {/* Password Change Form */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.currentPassword") || "Senha atual"}
                </label>
                <input
                  type="password"
                  value={form.senhaAtual}
                  onChange={(e) => handleInputChange('senhaAtual', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.newPassword") || "Nova senha"}
                </label>
                <input
                  type="password"
                  value={form.novaSenha}
                  onChange={(e) => handleInputChange('novaSenha', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("modal.passwordRequirements") || "Mínimo 8 caracteres com letras, números e símbolos."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.confirmPassword") || "Confirmar nova senha"}
                </label>
                <input
                  type="password"
                  value={form.confirmarSenha}
                  onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* 2FA Toggle */}
            <div 
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
              onClick={() => handleInputChange('doisFatoresAtivo', !form.doisFatoresAtivo)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleInputChange('doisFatoresAtivo', !form.doisFatoresAtivo);
                }
              }}
            >
              <div className="flex gap-3 items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <Key size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("modal.twoFactorAuth") || "Autenticação em 2 Fatores (2FA)"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("modal.twoFactorDescription") || "Adiciona uma camada extra de segurança"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.doisFatoresAtivo ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleInputChange('doisFatoresAtivo', !form.doisFatoresAtivo);
                }}
                aria-label={form.doisFatoresAtivo ? t("modal.disable2FA") : t("modal.enable2FA")}
              >
                <span 
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.doisFatoresAtivo ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
              <Construction size={32} />
            </div>
            <p className="text-lg font-medium mb-2 dark:text-gray-300">
              {t("modal.inDevelopment") || "Configuração em desenvolvimento"}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t("modal.comingSoon") || "Esta funcionalidade estará disponível em breve."}
            </p>
          </div>
        );
    }
  };

  return (
    <>
      {/* Backdrop com animação */}
      <div 
        className={`fixed inset-0 z-50 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? 'animate-in fade-in' : 'animate-out fade-out'}`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 transform transition-all duration-200 ${isOpen ? 'animate-in zoom-in-95' : 'animate-out zoom-out-95'}`}
      >
        <div 
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-2xl dark:shadow-black/50 flex flex-col max-h-[90vh] mx-4 border border-gray-100 dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
              {settingId === "profile" && user?.email && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors disabled:opacity-50"
              disabled={loading}
              aria-label={t("modal.close") || "Fechar"}
            >
              <X size={20} />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {success ? (
              <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="text-green-600 dark:text-green-400" size={32} />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t("modal.changesSaved") || "Alterações salvas!"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("modal.changesSavedDescription") || "Suas alterações foram salvas com sucesso."}
                </p>
              </div>
            ) : renderContent()}
          </div>

          {/* Rodapé */}
          {!success && (
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-2xl flex flex-col sm:flex-row gap-3">
              <button 
                onClick={onClose}
                disabled={loading}
                className="px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                {t("modal.cancel") || "Cancelar"}
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-5 py-3 text-sm font-medium text-white bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg shadow-sm flex justify-center items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
                    <span>{t("modal.saving") || "Salvando..."}</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{t("modal.saveChanges") || "Salvar Alterações"}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
/* =======================
   COMPONENTE PRINCIPAL
======================= */
export function UsuarioTab() {
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const { user } = useSession();
  const { t } = useI18n();

  const settings: UserSettingItem[] = [
    {
      id: "profile",
      icon: User,
      title: t("profile.personal.title") || "Perfil Pessoal",
      description: t("profile.personal.description") || "Gerencie seus dados de identificação e contato.",
      permission: "user:update",
      color: "text-purple-600 bg-purple-50"
    },
    {
      id: "security",
      icon: Lock,
      title: t("profile.security.title") || "Login e Segurança",
      description: t("profile.security.description") || "Proteja sua conta e verifique atividades suspeitas.",
      permission: "security:update",
      badge: t("profile.critical") || "Crítico",
      color: "text-orange-600 bg-orange-50"
    },
    {
      id: "notifications",
      icon: Bell,
      title: t("profile.notifications.title") || "Notificações",
      description: t("profile.notifications.description") || "Escolha como e quando você quer ser alertado.",
      permission: "notifications:update",
      color: "text-blue-600 bg-blue-50"
    },
    {
      id: "appearance",
      icon: Palette,
      title: t("profile.preferences.title") || "Preferências",
      description: t("profile.preferences.description") || "Ajuste o tema, idioma e visualização do sistema.",
      color: "text-pink-600 bg-pink-50"
    },
  ];

  const recentActivities = [
    { 
      action: t("activity.login") || "Login realizado", 
      details: "Chrome/Windows",
      time: t("time.justNow") || "Agora mesmo", 
      icon: Globe 
    },
    { 
      action: t("activity.passwordChanged") || "Senha alterada", 
      time: t("time.weeksAgo", { count: 2 }) || "Há 2 semanas", 
      icon: Lock 
    },
    { 
      action: t("activity.autoBackup") || "Backup automático", 
      time: t("time.yesterdayAt", { time: "14:00" }) || "Ontem, 14:00", 
      icon: Save 
    },
  ];

  const hasPermission = (permissions: string[], permission?: string) => {
    if (!permission) return true;
    return permissions.includes(permission);
  };

  const handleExportData = () => {
    // Implementar exportação de dados
    console.log("Exportar dados do usuário");
  };

  const handleDeleteAccount = () => {
    // Implementar lógica de exclusão
    if (window.confirm(t("profile.deleteConfirmation") || "Tem certeza que deseja excluir sua conta? Esta ação é irreversível.")) {
      console.log("Excluir conta");
    }
  };

  const handleLogout = () => {
    // Implementar logout
    console.log("Logout");
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 px-4 sm:px-6 lg:px-8">
      
      {/* HEADER SECTION */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight dark:text-white">
          {t("profile.title") || "Minha Conta"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t("profile.subtitle") || "Gerencie suas informações pessoais, privacidade e segurança."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA DA ESQUERDA: CONFIGURAÇÕES */}
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-white dark:bg-red-900/40 rounded-full text-red-500 dark:text-red-300 shadow-sm">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-red-900 dark:text-red-100">
                  {t("profile.dangerZone.title") || "Zona de Perigo"}
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {t("profile.dangerZone.description") || "Ações irreversíveis como excluir sua conta."}
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={handleExportData}
                className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <Download size={16} /> 
                {t("profile.export") || "Exportar"}
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <Trash2 size={16} />
                {t("profile.deleteAccount") || "Excluir Conta"}
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA DA DIREITA: SIDEBAR / INFO */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
          
          {/* Card de Perfil Resumido */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm text-center relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10 dark:opacity-20"></div>
            <div className="relative mt-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 text-white flex items-center justify-center text-2xl font-bold border-4 border-white dark:border-gray-800 shadow-lg group-hover:scale-105 transition-transform">
                {user?.nome?.charAt(0).toUpperCase() || "U"}
              </div>
              <h2 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                {user?.nome || t("profile.defaultUsername") || "Usuário"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate px-4">
                {user?.email}
              </p>
              <span className="inline-block mt-3 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full border border-gray-200 dark:border-gray-600">
                {user?.roles?.map?.(role => typeof role === 'string' ? role : role.name).join(', ') || t("profile.defaultRole") || "Membro"}
              </span>
            </div>
            
            {/* Info adicional */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.memberSince") || "Membro desde"}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.lastLogin") || "Último login"}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Mini Dashboard de Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard 
              icon={CheckCircle2} 
              value={user?.projects_participating?.length?.toString() || "0"} 
              label={t("profile.stats.tasks") || "Tarefas"} 
              color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 border border-green-100 dark:border-green-800/30" 
            />
            <StatCard 
              icon={Clock} 
              value={user?.assigned_tasks ? `${user?.assigned_tasks.length}d` : "0d"} 
              label={t("profile.stats.active") || "Ativo"} 
              color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30" 
            />
          </div>

          {/* Feed de Atividade */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Clock size={16} /> 
              {t("profile.recentActivity") || "Atividade Recente"}
            </h3>
            <div className="space-y-0 relative">
              {/* Linha conectora vertical */}
              <div className="absolute left-4 top-2 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-700"></div>
              
              {recentActivities.map((activity, i) => (
                <div key={i} className="flex gap-4 relative py-3 first:pt-0 last:pb-0 group">
                  <div className="relative z-10 w-8 h-8 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-300 shrink-0 group-hover:scale-110 transition-transform">
                    <activity.icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {activity.action}
                    </p>
                    {activity.details && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.details}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
              
              {recentActivities.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("profile.noActivity") || "Nenhuma atividade recente"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Botão de Logout Rápido */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-sm font-medium border border-red-100 dark:border-red-800/30 hover:border-red-200 dark:hover:border-red-700"
          >
            <LogOut size={18} /> 
            {t("profile.logout") || "Sair da conta"}
          </button>
        </div>
      </div>

      {/* Modal de Edição */}
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

