"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Mail,
  Loader2,
  ArrowRight,
  Database,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Button, Input, Alert, Badge } from "@/app/component";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";

type VerificationStatus = "loading" | "success" | "error";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { api } = useSession();
  const { t } = useI18n();

  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [confirmedEmail, setConfirmedEmail] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(5);

  // Estados para reenvio de confirmação em caso de erro
  const [resendEmail, setResendEmail] = useState<string>("");
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Evita chamada duplicada em React StrictMode
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    if (!token) {
      setStatus("error");
      setErrorMessage(
        t("auth.verifyErrorMissingToken") || "Nenhum código de confirmação foi fornecido nesta ligação."
      );
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await api.get("/auth/verify-email", {
          params: { token },
        });

        if (response.data?.success || response.status === 200) {
          setStatus("success");
          const email = response.data?.email || "";
          setConfirmedEmail(email);
        } else {
          setStatus("error");
          setErrorMessage(
            response.data?.detail ||
              response.data?.message ||
              t("auth.verifyErrorDesc") ||
              "A ligação de confirmação é inválida ou já expirou."
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setStatus("error");
        const detail =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          t("auth.verifyErrorDesc") ||
          "A ligação de confirmação é inválida ou já expirou.";
        setErrorMessage(detail);
      }
    };

    verifyToken();
  }, [token, api, t]);

  // Contagem regressiva automática para o login após sucesso
  useEffect(() => {
    if (status !== "success") return;

    if (countdown <= 0) {
      router.push(
        `/auth/login?verified=1&email=${encodeURIComponent(confirmedEmail)}`
      );
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown, router, confirmedEmail]);

  // Reenviar e-mail de confirmação
  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = resendEmail.trim();
    if (!targetEmail) {
      setResendError(t("auth.errorEmail") || "Por favor insira um e-mail válido.");
      return;
    }

    setIsResending(true);
    setResendError(null);
    setResendSuccess(null);

    try {
      const response = await api.post("/auth/resend-verification", {
        email: targetEmail,
      });

      if (response.data?.success) {
        setResendSuccess(
          response.data?.message ||
            t("auth.resendVerificationSuccess") ||
            "Novo e-mail de confirmação enviado! Por favor consulte a sua caixa de entrada."
        );
      } else {
        setResendError(
          response.data?.detail || "Não foi possível reenviar o e-mail de confirmação."
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setResendError(
        err?.response?.data?.detail || "Erro ao reenviar o e-mail de confirmação. Tente mais tarde."
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-10 w-full max-w-lg text-center animate-in fade-in zoom-in-95 duration-300">
        
        {/* Cabeçalho com Logótipo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-blue-50 border border-blue-100 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">MustaInf</span>
        </div>

        {/* ⏳ Estado: A Carregar / A Validar */}
        {status === "loading" && (
          <div className="py-8">
            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-30" />
              <div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shadow-sm">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("auth.verifyingEmail") || "A verificar o seu e-mail..."}
            </h1>
            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
              {t("auth.verifyingSubtitle") || "Aguarde um momento enquanto validamos e ativamos a sua conta."}
            </p>
          </div>
        )}

        {/* ✅ Estado: Sucesso na Validação */}
        {status === "success" && (
          <div className="py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("auth.verifySuccessTitle") || "E-mail confirmado com sucesso!"}
            </h1>

            <p className="text-gray-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              {t("auth.verifySuccessDesc") ||
                "A sua conta foi ativada. O seu endereço de e-mail foi validado e já pode explorar todas as funcionalidades do MustaInf."}
            </p>

            {confirmedEmail && (
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 mb-6 text-left flex items-center gap-3 max-w-sm mx-auto">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">Conta Validada</p>
                  <p className="text-sm font-semibold text-emerald-950 truncate">{confirmedEmail}</p>
                </div>
              </div>
            )}

            <div className="space-y-3 max-w-sm mx-auto">
              <Button
                type="button"
                variant="primary"
                onClick={() =>
                  router.push(
                    `/auth/login?verified=1&email=${encodeURIComponent(confirmedEmail)}`
                  )
                }
                className="w-full flex items-center justify-center gap-2 py-3"
              >
                <span>{t("auth.goToLogin") || "Iniciar Sessão"}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <p className="text-xs text-gray-400">
                {t("auth.verifySuccessRedirect", { seconds: countdown }) ||
                  `A redirecionar automaticamente em ${countdown} segundos...`}
              </p>
            </div>
          </div>
        )}

        {/* ❌ Estado: Erro ou Token Expirado */}
        {status === "error" && (
          <div className="py-4 animate-in fade-in zoom-in-95 duration-300">
            {errorMessage.toLowerCase().includes("expirou") ||
            errorMessage.toLowerCase().includes("validade") ||
            errorMessage.toLowerCase().includes("expired") ? (
              <>
                <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Clock className="w-10 h-10 text-amber-600" />
                </div>
                <div className="flex justify-center mb-3">
                  <Badge text={t("auth.expiredBadge") || "Validade Expirada"} color="yellow" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {t("auth.verifyExpiredTitle") || "Ligação de Confirmação Expirada"}
                </h1>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {t("auth.verifyErrorTitle") || "Não foi possível confirmar o e-mail"}
                </h1>
              </>
            )}

            <p className="text-gray-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              {errorMessage}
            </p>

            {/* Caixa para reenvio de confirmação */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 text-left max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />
                <h2 className="text-xs font-bold uppercase text-gray-700 tracking-wider">
                  {t("auth.resendVerificationTitle") || "Reenviar e-mail de confirmação"}
                </h2>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                {t("auth.resendVerificationDesc") ||
                  "Insira o seu endereço de e-mail abaixo para receber uma nova ligação de ativação:"}
              </p>

              {resendSuccess && (
                <div className="mb-3">
                  <Alert type="success" message={resendSuccess} />
                </div>
              )}

              {resendError && (
                <div className="mb-3">
                  <Alert type="error" message={resendError} />
                </div>
              )}

              <form onSubmit={handleResend} className="space-y-3">
                <Input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder") || "exemplo@empresa.com"}
                  className="w-full text-sm"
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isResending}
                  className="w-full py-2.5 text-xs flex items-center justify-center gap-2"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>A reenviar...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>{t("auth.resendVerificationBtn") || "Reenviar E-mail"}</span>
                    </>
                  )}
                </Button>
              </form>
            </div>

            <div className="flex justify-center">
              <Link
                href="/auth/login"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {t("auth.backToLogin") || "Voltar ao Início de Sessão"}
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 text-center max-w-sm w-full">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm font-medium">A carregar verificação...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
