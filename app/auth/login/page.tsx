"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Eye, EyeOff, Database, Loader2 } from "lucide-react";
import { Alert, Button, Input } from "@/app/component";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script"; // <-- Adicionado para lidar com o script do Adsense
import { useI18n } from "@/context/I18nContext";
import { aes_encrypt } from "@/service";
import { OtherProviders } from "./component/otherProviders";
import usePersistedState from "@/hook/localStoreUse";

type Toast = { type: "error" | "success"; message: string } | null;

const REMEMBER_KEY = "rememberedEmail";

const LoginPage = () => {
  const router = useRouter();
  const { login } = useSession();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = usePersistedState("password", "");
  const [remember, setRemember] = usePersistedState("remember", false);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const toastTimerRef = useRef<number | null>(null);
  const redirectTimerRef = useRef<number | null>(null);

  // 1. Inicialização do "Lembrar de mim"
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  // 2. Limpeza segura das referências de tempo quando o componente for desmontado
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

  const canSubmit = useMemo(() => {
    return email.includes("@") && password.length > 0 && !isLoading;
  }, [email, password, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) return showToast("error", t("auth.errorFields"), 5000);
    if (!email.includes("@")) return showToast("error", t("auth.errorEmail"), 5000);

    setIsLoading(true);

    try {
      const ok = await login("credenciais", {
        credenciais: { email, senha: aes_encrypt(password) },
        redirect: "/dashboard",
      });

      if (ok) {
        // Se o usuário pediu para lembrar, salvamos agora. Se não, limpamos.
        if (remember) localStorage.setItem(REMEMBER_KEY, email);
        else localStorage.removeItem(REMEMBER_KEY);

        showToast("success", t("auth.successLogin"), 3000);

        // 3. O Timer agora só é criado SE o login for sucesso
        if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = window.setTimeout(() => {
          router.replace("/");
        }, 800);
      } else {
        showToast("error", t("auth.errorCredentials"), 5000);
        setIsLoading(false); // Remove o loading se falhar
      }
    } catch (err) {
      console.error("Erro no login:", err);
      showToast("error", t("auth.errorCredentials"), 5000);
      setIsLoading(false); // Remove o loading se der erro na requisição
    }
    // Nota: Não colocamos setIsLoading(false) no finally porque, se houver sucesso,
    // queremos que o botão continue em "Loading" até o redirecionamento acontecer.
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">

        {/* 4. Uso do next/script para evitar erros de hidratação */}
        <Script
          id="adsense-script"
          strategy="lazyOnload"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6543986660141855"
          crossOrigin="anonymous"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <div className="bg-blue-50 border border-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">MustaInf</h1>
            <p className="text-gray-500 text-sm font-medium">{t("header.platformType")}</p>
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
                onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-200 text-gray-900 text-sm placeholder:text-gray-400 pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                  onChange={(e) => setRemember(e.target.checked)}
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
              onClick={() => alert(t("auth.forgotPasswordAlert"))}
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

export default LoginPage;