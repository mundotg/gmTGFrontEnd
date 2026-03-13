"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Database, Loader2, Github, Facebook } from "lucide-react";
import { Alert, Button, Input } from "@/app/component";
import { AuthProvider, LoginOptions, useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/context/I18nContext";
import { aes_encrypt } from "@/service";

type Toast = { type: "error" | "success"; message: string } | null;

const REMEMBER_KEY = "rememberedEmail";

const LoginPage = () => {
  const router = useRouter();
  const { login } = useSession();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const toastTimerRef = useRef<number | null>(null);
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    if (!remember) {
      localStorage.removeItem(REMEMBER_KEY);
      return;
    }
    if (email) localStorage.setItem(REMEMBER_KEY, email);
  }, [remember, email]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const showToast = useCallback((type: "error" | "success", message: string, ms: number) => {
    setToast({ type, message });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), ms);
  }, []);

  const onEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const onPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const onRememberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRemember(e.target.checked);
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((v) => !v);
  }, []);

  const handleForgotPassword = useCallback(() => {
    alert(t("auth.forgotPasswordAlert"));
  }, [t]);

  const canSubmit = useMemo(() => {
    return email.includes("@") && password.length > 0 && !isLoading;
  }, [email, password, isLoading]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!email || !password) return showToast("error", t("auth.errorFields"), 5000);
      if (!email.includes("@")) return showToast("error", t("auth.errorEmail"), 5000);

      setIsLoading(true);
      try {
        const ok = await login("credenciais", {
          credenciais: { email, senha: aes_encrypt(password) },
          redirect: "/dashboard",
        });

        showToast("success", t("auth.successLogin"), 3000);

        if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = window.setTimeout(() => {
          if (ok) router.replace("/");
        }, 800);
      } catch (err) {
        console.error("Erro no login:", err);
        showToast("error", t("auth.errorCredentials"), 5000);
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, login, router, showToast, t]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <div className="bg-blue-50 border border-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">DataSmart</h1>
            <p className="text-gray-500 text-sm font-medium">{t("auth.subtitle")}</p>
          </div>

          {toast && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <Alert type={toast.type} message={toast.message} />
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                {t("common.email")}
              </label>
              <Input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onEmailChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-200 text-gray-900 text-sm placeholder:text-gray-400"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                {t("common.password")}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={onPasswordChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-200 text-gray-900 text-sm placeholder:text-gray-400 pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  checked={remember}
                  onChange={onRememberChange}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500/50 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2 text-sm font-medium text-gray-600 cursor-pointer select-none">
                  {t("auth.rememberMe")}
                </label>
              </div>

              <Link
                href="/auth/register"
                className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {t("auth.createAccount")}
              </Link>
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-bold transition-all duration-200 hover:bg-blue-700 shadow-sm focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("actions.entering")}
                </>
              ) : (
                t("actions.enter")
              )}
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-gray-500 hover:text-blue-600 text-xs font-bold uppercase tracking-wide transition-colors"
            >
              {t("auth.forgotPassword")}
            </button>
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-white px-3 text-gray-400 font-bold">{t("auth.orContinueWith")}</span>
            </div>
          </div>

          <OtherProviders login={login} t={t} />
        </form>
      </div>
    </div>
  );
};

interface OtherProvidersProps {
  login: (provider: AuthProvider, options?: LoginOptions) => Promise<boolean>;
  t: (key: string) => string;
}

const OtherProviders = React.memo<OtherProvidersProps>(({ login}) => {
  const onGoogle = useCallback(() => void login("google"), [login]);
  const onGithub = useCallback(() => void login("github"), [login]);
  const onFacebook = useCallback(() => void login("facebook"), [login]);

  const socialBtnClass = "flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm";

  return (
    <div className="flex gap-3 justify-center">
      <button type="button" onClick={onGoogle} className={socialBtnClass} title="Google">
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      </button>

      <button type="button" onClick={onGithub} className={socialBtnClass} title="GitHub">
        <Github className="w-4 h-4" />
      </button>

      <button type="button" onClick={onFacebook} className={socialBtnClass} title="Facebook">
        <Facebook className="w-4 h-4 text-[#1877F2]" />
      </button>
    </div>
  );
});

OtherProviders.displayName = "OtherProviders";

export default LoginPage;