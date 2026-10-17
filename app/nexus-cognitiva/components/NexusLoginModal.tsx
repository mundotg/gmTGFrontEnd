"use client";

import React, { useState, useCallback } from "react";
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle, Brain, CheckCircle2, X } from "lucide-react";
import { Github } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { aes_encrypt } from "@/service";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NexusLoginModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
  redirectTo?: string;
}

export const NexusLoginModal: React.FC<NexusLoginModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  redirectTo = "/nexus-cognitiva",
}) => {
  const router = useRouter();
  const { login } = useSession();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg(null);
      setSuccessMsg(null);

      if (!email || !password) {
        setErrorMsg(t("auth.errorFields") || "Por favor, preencha todos os campos.");
        return;
      }
      if (!email.includes("@")) {
        setErrorMsg(t("auth.errorEmail") || "Por favor, insira um endereço de e-mail válido.");
        return;
      }

      setIsLoading(true);

      try {
        const ok = await login("credenciais", {
          credenciais: { email, senha: aes_encrypt(password) },
          redirect: redirectTo,
        });

        if (ok) {
          if (remember) {
            localStorage.setItem("rememberedEmail", email);
          } else {
            localStorage.removeItem("rememberedEmail");
          }
          setSuccessMsg(t("auth.successLogin") || "Autenticação realizada com sucesso!");
          setTimeout(() => {
            onSuccess?.();
            onClose?.();
            router.push(redirectTo);
          }, 600);
        } else {
          setErrorMsg(t("auth.errorCredentials") || "E-mail ou palavra-passe incorretos.");
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Erro no login Nexus:", err);
        const detail = err?.response?.data?.detail;
        const msg = typeof detail === "string" ? detail : t("auth.errorConnection") || "Erro ao conectar ao servidor.";
        setErrorMsg(msg);
        setIsLoading(false);
      }
    },
    [email, password, remember, login, t, onSuccess, onClose, router, redirectTo]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] rounded-2xl p-6 sm:p-8 shadow-xl text-[#14283F] dark:text-white relative overflow-hidden font-interface animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nexus-login-title"
      >
        {/* BOTÃO DE FECHAR */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-[#475569] dark:text-slate-400 hover:text-[#14283F] dark:hover:text-white p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-20 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* CABEÇALHO DO MODAL */}
        <div className="text-center space-y-2.5 relative z-10 mb-5">
          <div className="inline-flex items-center justify-center gap-2 p-1.5 px-3 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A]">
            <div className="w-6 h-6 rounded-lg bg-[#087E8B]/10 dark:bg-teal-500/20 text-[#087E8B] dark:text-teal-400 flex items-center justify-center shadow-xs">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold tracking-tight text-[#14283F] dark:text-white uppercase">
              NEXUS COGNITIVA
            </span>
          </div>

          <h2 id="nexus-login-title" className="font-editorial text-xl sm:text-2xl font-bold text-[#14283F] dark:text-white tracking-tight">
            {t("nexus.loginModalTitle") || "Aceder ao Conhecimento"}
          </h2>
          <p className="text-xs text-[#475569] dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
            {t("nexus.loginModalDesc") || "Inicie sessão com a sua conta do ecossistema MustInfo para explorar, publicar e guardar conteúdos."}
          </p>
        </div>

        {/* MENSAGEM DE ERRO OU SUCESSO */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 text-xs text-red-800 dark:text-red-200 flex items-start gap-2.5 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{successMsg}</span>
          </div>
        )}

        {/* FORMULÁRIO DE LOGIN PADRÃO */}
        <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
          {/* E-MAIL */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#14283F] dark:text-slate-200 block">
              {t("auth.email") || "Endereço de E-mail"}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#475569] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] focus:border-[#087E8B] focus:ring-1 focus:ring-[#087E8B] text-sm text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* PALAVRA-PASSE */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#14283F] dark:text-slate-200">
                {t("auth.password") || "Palavra-passe"}
              </label>
              <Link
                href={`/auth/forgot-password?next=${encodeURIComponent(redirectTo)}`}
                className="text-[11px] font-semibold text-[#087E8B] dark:text-teal-400 hover:text-[#066570] transition-colors"
                tabIndex={-1}
              >
                {t("auth.forgotPassword") || "Esqueceu a senha?"}
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#475569] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] focus:border-[#087E8B] focus:ring-1 focus:ring-[#087E8B] text-sm text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] dark:text-slate-400 hover:text-[#14283F] dark:hover:text-white p-1 cursor-pointer"
                aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* LEMBRAR DE MIM */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="nexus-remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#087E8B] focus:ring-[#087E8B]"
            />
            <label htmlFor="nexus-remember" className="text-xs text-[#475569] dark:text-slate-300 cursor-pointer select-none">
              {t("auth.rememberMe") || "Manter sessão iniciada"}
            </label>
          </div>

          {/* BOTÃO DE LOGIN */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-[#087E8B] hover:bg-[#066570] text-white shadow-xs transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none mt-1 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("auth.loggingIn") || "A verificar credenciais..."}</span>
              </>
            ) : (
              <span>{t("auth.login") || "Iniciar Sessão no Nexus"}</span>
            )}
          </button>
        </form>

        {/* DIVIDER OU CONTINUAR COM */}
        <div className="relative py-3 my-1">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[#DCE3EA] dark:border-[#1E2D5A]"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
            <span className="bg-white dark:bg-[#111D3D] px-2.5 text-[#475569] dark:text-slate-400 font-bold">
              {t("auth.orContinueWith") || "Ou continuar com"}
            </span>
          </div>
        </div>

        {/* AUTENTICAÇÃO COM LINKEDIN & SOCIAL */}
        <div className="space-y-2 relative z-10">
          {/* BOTÃO PROMINENTE LINKEDIN */}
          <button
            type="button"
            onClick={() => void login("linkedin", { redirect: redirectTo })}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-[#0A66C2] hover:text-[#0A66C2] text-[#14283F] dark:text-white shadow-xs transition-all flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer group"
            title="LinkedIn"
          >
            <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24" aria-hidden="true" fill="#0A66C2">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
            </svg>
            <span>{t("auth.loginWithLinkedin") || "Continuar com LinkedIn"}</span>
          </button>

          {/* COMPANION SOCIAL LOGINS */}
          <div className="flex gap-2 justify-center">
            {/* GOOGLE */}
            <button
              type="button"
              onClick={() => void login("google", { redirect: redirectTo })}
              className="flex-1 py-2 px-2.5 rounded-xl bg-white dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-[#4285F4] text-xs font-semibold text-[#14283F] dark:text-white flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:bg-blue-50/20 dark:hover:bg-blue-950/20"
              title="Google"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google</span>
            </button>

            {/* GITHUB */}
            <button
              type="button"
              onClick={() => void login("github", { redirect: redirectTo })}
              className="flex-1 py-2 px-2.5 rounded-xl bg-white dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-gray-500 text-xs font-semibold text-[#14283F] dark:text-white flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/30"
              title="GitHub"
            >
              <Github className="w-3.5 h-3.5 shrink-0" />
              <span>GitHub</span>
            </button>

            {/* MICROSOFT */}
            <button
              type="button"
              onClick={() => void login("microsoft", { redirect: redirectTo })}
              className="flex-1 py-2 px-2.5 rounded-xl bg-white dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-amber-400 text-xs font-semibold text-[#14283F] dark:text-white flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:bg-amber-50/20 dark:hover:bg-amber-950/20"
              title="Microsoft"
            >
              <svg width="12" height="12" viewBox="0 0 21 21" aria-hidden="true" focusable="false" className="shrink-0">
                <rect x="0" y="0" width="9" height="9" fill="#f25022" />
                <rect x="12" y="0" width="9" height="9" fill="#7fba00" />
                <rect x="0" y="12" width="9" height="9" fill="#00a4ef" />
                <rect x="12" y="12" width="9" height="9" fill="#ffb900" />
              </svg>
              <span>Microsoft</span>
            </button>
          </div>
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="mt-5 pt-4 border-t border-[#DCE3EA] dark:border-[#1E2D5A] text-center text-xs text-[#475569] dark:text-slate-400">
          <span>{t("nexus.loginModalFooter") || "Ainda não tem conta no MustInfo?"} </span>
          <Link
            href={`/auth/register?next=${encodeURIComponent(redirectTo)}`}
            className="font-semibold text-[#087E8B] dark:text-teal-400 hover:text-[#066570] underline underline-offset-2 ml-1"
          >
            {t("nexus.loginModalRegister") || "Criar conta gratuita"}
          </Link>
        </div>
      </div>
    </div>
  );
};

