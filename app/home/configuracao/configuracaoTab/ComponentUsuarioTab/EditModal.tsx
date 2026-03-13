import Image from "next/image";
import { LanguageSelector } from "./LanguageSelector";
import {
  updateProfile,
  changePassword,
  updateTwoFactor,
  uploadAvatar,
  updateNotifications,
  updateAppearance,
  updateLanguage,
} from "@/app/services/settingsApi";
import { Usuario } from "@/context/SessionContext";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { Bell, Camera, CheckCircle2, Clock, Construction, Globe, Key, LucideIcon, Palette, Save, Shield, X } from "lucide-react";

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

type ThemeMode = "light" | "dark" | "system";

export const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, settingId, title, user }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { t } = useI18n();

  const [form, setForm] = useState({
    // profile
    nome: "",
    email: "",
    telefone: "",
    cargo: "",
    empresa: "",
    roles: [] as string[],
    avatar_url: "",

    // security
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
    doisFatoresAtivo: false,

    // notifications
    notifEmail: true,
    notifPush: false,
    notifSms: false,
    notifWeekly: true,

    // appearance
    theme: "system" as ThemeMode,
    language: "pt" as string,
  });

  const availableRoles = useMemo(
    () => ["admin", "editor", "viewer", "manager", "user"],
    []
  );

  // Inicializar o form com os dados do usuário
  useEffect(() => {
    if (!user || !isOpen) return;

    setForm((prev) => ({
      ...prev,
      nome: user.nome || "",
      email: user.email || "",
      telefone: user?.telefone || "",
      cargo: user?.cargo?.position || "",
      empresa: typeof user?.empresa === "string" ? user.empresa : user?.empresa?.company || "",
      roles: Array.isArray(user?.roles)
        ? user.roles.map((role) => (typeof role === "string" ? role : role.name || ""))
        : [],
      avatar_url: user?.avatar_url || "",

      doisFatoresAtivo: Boolean((user as any)?.security?.twoFactorEnabled ?? false),
      notifEmail: Boolean((user as any)?.settings?.notifications?.email ?? true),
      notifPush: Boolean((user as any)?.settings?.notifications?.push ?? false),
      notifSms: Boolean((user as any)?.settings?.notifications?.sms ?? false),
      notifWeekly: Boolean((user as any)?.settings?.notifications?.weeklyDigest ?? true),
      theme: ((user as any)?.settings?.appearance?.theme ?? "system") as ThemeMode,
      language: ((user as any)?.settings?.language ?? "pt") as string,
    }));
  }, [user, isOpen]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Resetar estado quando modal fechar
  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => {
      setSuccess(false);
      setLoading(false);
      setForm({
        nome: "",
        email: "",
        telefone: "",
        cargo: "",
        empresa: "",
        roles: [],
        avatar_url: "",
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
        doisFatoresAtivo: false,
        notifEmail: true,
        notifPush: false,
        notifSms: false,
        notifWeekly: true,
        theme: "system",
        language: "pt",
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (
    field: keyof typeof form,
    value: string | boolean | string[]
  ) => setForm((prev) => ({ ...prev, [field]: value as any }));

  const applyThemeClient = async (mode: ThemeMode) => {
    const root = document.documentElement;
    const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
    const isDark = mode === "dark" || (mode === "system" && systemDark);
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme", mode);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      if (settingId === "security") {
        const wantsChangePassword = Boolean(form.novaSenha || form.confirmarSenha);
        if (wantsChangePassword) {
          if (form.novaSenha !== form.confirmarSenha) {
            alert(t("modal.passwordsMismatch") || "As senhas não coincidem!");
            return;
          }
          if (!form.senhaAtual) {
            alert(t("modal.enterCurrentPassword") || "Digite sua senha atual para alterar!");
            return;
          }
          await changePassword({ senhaAtual: form.senhaAtual, novaSenha: form.novaSenha });
        }

        await updateTwoFactor({ enabled: form.doisFatoresAtivo });
      }

      if (settingId === "profile") {
        if (!form.nome.trim()) {
          alert(t("modal.nameRequired") || "Nome completo é obrigatório!");
          return;
        }

        await updateProfile({
          nome: form.nome.trim(),
          telefone: form.telefone || undefined,
          cargo: form.cargo || undefined,
          empresa: form.empresa || undefined,
          avatar_url: form.avatar_url || undefined,
        });
      }

      if (settingId === "notifications") {
        await updateNotifications({
          email: form.notifEmail,
          push: form.notifPush,
          sms: form.notifSms,
          weeklyDigest: form.notifWeekly,
        });
      }

      if (settingId === "appearance") {
        await updateAppearance({ theme: form.theme });
        applyThemeClient(form.theme);

        await updateLanguage({ language: form.language });
      }

      setSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        t("modal.saveError") ||
        "Erro ao salvar alterações";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t("modal.invalidImage") || "Por favor, selecione uma imagem válida");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(t("modal.imageTooLarge") || "A imagem deve ter no máximo 5MB");
      return;
    }

    try {
      setLoading(true);
      const res = await uploadAvatar(file);
      const url = res?.url;
      if (!url) throw new Error("Upload não retornou URL");
      handleInputChange("avatar_url", url);
    } catch (err) {
      console.error(err);
      alert(t("modal.saveError") || "Erro ao enviar imagem");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const ToggleRow = ({
    title,
    description,
    value,
    onToggle,
    icon: Icon,
  }: {
    title: string;
    description: string;
    value: boolean;
    onToggle: () => void;
    icon: LucideIcon;
  }) => (
    <div
      className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 xs:p-4 border border-gray-200 dark:border-gray-700 rounded-lg xs:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group gap-3"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
    >
      <div className="flex gap-2 xs:gap-3 items-start xs:items-center flex-1 min-w-0">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform flex-shrink-0">
          <Icon size={16} className="xs:w-5 xs:h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs xs:text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{description}</p>
        </div>
      </div>

      <button
        type="button"
        className={`relative inline-flex h-5 xs:h-6 w-9 xs:w-11 items-center rounded-full transition-colors flex-shrink-0 ${
          value ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={title}
      >
        <span
          className={`inline-block h-3.5 xs:h-4 w-3.5 xs:w-4 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-5 xs:translate-x-6" : "translate-x-0.5 xs:translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  const renderContent = () => {
    switch (settingId) {
      case "profile":
        return (
          <div className="space-y-4 xs:space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center">
              <label className="relative group cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <div className="w-20 xs:w-28 h-20 xs:h-28 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                  {form.avatar_url ? (
                    <Image
                      src={form.avatar_url}
                      alt={t("modal.avatarAlt", { name: form.nome }) || `Avatar de ${form.nome}`}
                      className="w-full h-full object-cover"
                      width={112}
                      height={112}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl xs:text-3xl font-bold text-gray-400 dark:text-gray-300 bg-gray-100 dark:bg-gray-700">
                      {form.nome?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 dark:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={20} />
                </div>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center px-2">
                {t("modal.changePhotoHint") || "Clique para alterar foto (max. 5MB)"}
              </p>
            </div>

            <div className="grid gap-3 xs:gap-4">
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.fullName") || "Nome completo"} *
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  className="w-full px-3 xs:px-4 py-2 xs:py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                  placeholder={t("modal.enterYourName") || "Digite seu nome completo"}
                />
              </div>

              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.email") || "Email"}
                </label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full px-3 xs:px-4 py-2 xs:py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("modal.emailHelp") || "Entre em contato com o suporte para alterar o email."}
                </p>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.phone") || "Telefone"}
                  </label>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                    placeholder="+244 900 000 000"
                    className="w-full px-3 xs:px-4 py-2 xs:py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.position") || "Cargo"}
                  </label>
                  <input
                    type="text"
                    value={form.cargo}
                    onChange={(e) => handleInputChange("cargo", e.target.value)}
                    placeholder={t("modal.yourPosition") || "Seu cargo atual"}
                    className="w-full px-3 xs:px-4 py-2 xs:py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.company") || "Empresa"}
                  </label>
                  <input
                    type="text"
                    value={form.empresa}
                    onChange={(e) => handleInputChange("empresa", e.target.value)}
                    placeholder={t("modal.companyName") || "Nome da empresa"}
                    className="w-full px-3 xs:px-4 py-2 xs:py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("modal.roles") || "Funções"}
                  </label>
                  <select
                    multiple
                    value={form.roles}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                      handleInputChange("roles", selected);
                    }}
                    className="w-full px-3 xs:px-4 py-2 xs:py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[100px] xs:min-h-[108px] overflow-y-auto"
                    size={3}
                  >
                    {availableRoles.map((role) => (
                      <option key={role} value={role} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700">
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
          <div className="space-y-4 xs:space-y-5">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-lg p-3 xs:p-4 flex gap-3 flex-col xs:flex-row">
              <Shield className="text-orange-500 dark:text-orange-400 shrink-0 mt-0.5 xs:mt-0 w-5 xs:w-5 h-5" size={20} />
              <div className="text-xs xs:text-sm text-orange-800 dark:text-orange-300">
                <span className="font-bold block mb-1">
                  {t("modal.securityRecommendation") || "Recomendação de Segurança"}
                </span>
                {t("modal.securityAdvice") || "Ative a autenticação de dois fatores para evitar acessos não autorizados."}
              </div>
            </div>

            <div className="space-y-3 xs:space-y-4 pt-2">
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.currentPassword") || "Senha atual"}
                </label>
                <input
                  type="password"
                  value={form.senhaAtual}
                  onChange={(e) => handleInputChange("senhaAtual", e.target.value)}
                  className="w-full px-3 xs:px-4 py-2 xs:py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.newPassword") || "Nova senha"}
                </label>
                <input
                  type="password"
                  value={form.novaSenha}
                  onChange={(e) => handleInputChange("novaSenha", e.target.value)}
                  className="w-full px-3 xs:px-4 py-2 xs:py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("modal.passwordRequirements") || "Mínimo 8 caracteres com letras, números e símbolos."}
                </p>
              </div>

              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("modal.confirmPassword") || "Confirmar nova senha"}
                </label>
                <input
                  type="password"
                  value={form.confirmarSenha}
                  onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                  className="w-full px-3 xs:px-4 py-2 xs:py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <ToggleRow
              icon={Key}
              title={t("modal.twoFactorAuth") || "Autenticação em 2 Fatores (2FA)"}
              description={t("modal.twoFactorDescription") || "Adiciona uma camada extra de segurança"}
              value={form.doisFatoresAtivo}
              onToggle={() => handleInputChange("doisFatoresAtivo", !form.doisFatoresAtivo)}
            />
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-3 xs:space-y-4">
            <ToggleRow
              icon={Bell}
              title={t("notif.email") || "Email"}
              description={t("notif.emailDesc") || "Receber alertas por email"}
              value={form.notifEmail}
              onToggle={() => handleInputChange("notifEmail", !form.notifEmail)}
            />
            <ToggleRow
              icon={Globe}
              title={t("notif.push") || "Push"}
              description={t("notif.pushDesc") || "Notificações no dispositivo"}
              value={form.notifPush}
              onToggle={() => handleInputChange("notifPush", !form.notifPush)}
            />
            <ToggleRow
              icon={Clock}
              title={t("notif.sms") || "SMS"}
              description={t("notif.smsDesc") || "Mensagens por SMS (pode ter custos)"}
              value={form.notifSms}
              onToggle={() => handleInputChange("notifSms", !form.notifSms)}
            />
            <ToggleRow
              icon={Clock}
              title={t("notif.weekly") || "Resumo semanal"}
              description={t("notif.weeklyDesc") || "Resumo de atividades toda semana"}
              value={form.notifWeekly}
              onToggle={() => handleInputChange("notifWeekly", !form.notifWeekly)}
            />
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-4 xs:space-y-6">
            {/* Idioma */}
            <div className="p-3 xs:p-4 border border-gray-200 dark:border-gray-700 rounded-lg xs:rounded-xl bg-white dark:bg-gray-800">
              <div className="flex items-start gap-2 xs:gap-3 mb-4 flex-col xs:flex-row">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 flex-shrink-0">
                  <Globe size={18} className="xs:w-5 xs:h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs xs:text-sm font-bold text-gray-900 dark:text-white">
                    {t("profile.appearance.titleIdioma") || "Idioma do Sistema"}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t("profile.appearance.descriptionIdioma") || "Selecione a língua padrão para a interface."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <LanguageSelector onChange={(value) => handleInputChange("language", value)} />
                
              </div>
            </div>

            {/* Tema */}
            <div className="p-3 xs:p-4 border border-gray-200 dark:border-gray-700 rounded-lg xs:rounded-xl bg-white dark:bg-gray-800">
              <div className="flex items-start gap-2 xs:gap-3 mb-4 flex-col xs:flex-row">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 flex-shrink-0">
                  <Palette size={18} className="xs:w-5 xs:h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs xs:text-sm font-bold text-gray-900 dark:text-white">
                    {t("profile.appearance.titleTheme") || "Tema"}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t("profile.appearance.descriptionTheme") || "Escolha claro, escuro ou automático."}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {(["light", "dark", "system"] as ThemeMode[]).map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => handleInputChange("theme", th)}
                    className={`px-3 xs:px-4 py-2 rounded-lg text-xs xs:text-sm font-medium border transition-all ${
                      form.theme === th
                        ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                        : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    {t(`profile.appearance.${th}`) || th}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 xs:py-10 text-gray-500 dark:text-gray-400">
            <div className="w-14 xs:w-16 h-14 xs:h-16 mx-auto mb-3 xs:mb-4 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
              <Construction size={28} className="xs:w-8 xs:h-8" />
            </div>
            <p className="text-base xs:text-lg font-medium mb-1 xs:mb-2 dark:text-gray-300">
              {t("modal.inDevelopment") || "Configuração em desenvolvimento"}
            </p>
            <p className="text-xs xs:text-sm text-gray-400 dark:text-gray-500 px-2">
              {t("modal.comingSoon") || "Esta funcionalidade estará disponível em breve."}
            </p>
          </div>
        );
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? "animate-in fade-in" : "animate-out fade-out"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-sm xs:max-w-lg -translate-x-1/2 -translate-y-1/2 transform transition-all duration-200 ${
          isOpen ? "animate-in zoom-in-95" : "animate-out zoom-out-95"
        }`}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-xl xs:rounded-2xl shadow-2xl dark:shadow-black/50 flex flex-col max-h-[95vh] xs:max-h-[90vh] mx-3 xs:mx-4 border border-gray-100 dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start xs:items-center gap-3 p-4 xs:p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg xs:text-xl font-bold text-gray-900 dark:text-white truncate">
                {title}
              </h3>
              {settingId === "profile" && user?.email && (
                <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {user.email}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 xs:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors disabled:opacity-50 flex-shrink-0"
              disabled={loading}
              aria-label={t("modal.close") || "Fechar"}
            >
              <X size={18} className="xs:w-5 xs:h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 xs:p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {success ? (
              <div className="flex flex-col items-center justify-center py-10 xs:py-12 animate-in zoom-in">
                <div className="w-14 xs:w-16 h-14 xs:h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3 xs:mb-4 flex-shrink-0">
                  <CheckCircle2 className="text-green-600 dark:text-green-400 xs:w-8 xs:h-8" size={28}/>
                </div>
                <p className="text-base xs:text-lg font-semibold text-gray-900 dark:text-white mb-1 xs:mb-2">
                  {t("modal.changesSaved") || "Alterações salvas!"}
                </p>
                <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400 text-center px-2">
                  {t("modal.changesSavedDescription") || "Suas alterações foram salvas com sucesso."}
                </p>
              </div>
            ) : (
              renderContent()
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="p-4 xs:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-xl xs:rounded-b-2xl flex flex-col xs:flex-row gap-2 xs:gap-3 flex-shrink-0">
              <button
                onClick={onClose}
                disabled={loading}
                className="w-full xs:w-auto order-2 xs:order-1 px-4 xs:px-5 py-2.5 xs:py-3 text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                {t("modal.cancel") || "Cancelar"}
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full xs:w-auto order-1 xs:order-2 px-4 xs:px-5 py-2.5 xs:py-3 text-xs xs:text-sm font-medium text-white bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg shadow-sm flex justify-center items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <div className="w-3 xs:w-4 h-3 xs:h-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin flex-shrink-0" />
                    <span>{t("modal.saving") || "Salvando..."}</span>
                  </>
                ) : (
                  <>
                    <Save size={14} className="xs:w-4 xs:h-4" />
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