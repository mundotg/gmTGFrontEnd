"use client";
import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Database, User, Building, Shield, Loader2, Check, ExternalLink, Mail, Info, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { Alert, Button, Input, Modal } from '@/app/component';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';
import usePersistedState from '@/hook/localStoreUse';
import { checkPasswordStrength, getPasswordStrengthText } from './utils';
import { useI18n } from '@/context/I18nContext';
import Script from 'next/script';
import { LegalDocument } from '../_legal/LegalDocument';
import { termos } from '../_legal/termos';
import { privacidade } from '../_legal/privacidade';
import { OtherProviders } from '../login/component/otherProviders';

const LEGAL_DOCS = {
  termos: { doc: termos, href: '/auth/termos' },
  privacidade: { doc: privacidade, href: '/auth/privacidade' },
} as const;

const RegisterPage = () => {
  const { t } = useI18n();
  const router = useRouter();
  const { api, login } = useSession();

  // O rascunho do formulário é guardado no browser (IndexedDB) para não se
  // perder num reload — mas SEM as passwords, que ficam só em memória. Antes
  // iam para lá em texto simples e nunca eram apagadas.
  const [formData, setFormData, clearSavedForm] = usePersistedState("registerForm", {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyData: {
      company: '',
      companySize: ''
    },
    positionData: {
      position: '',
      descricao: ''
    },
    terms: false
  });
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });

  // Rascunhos gravados por versões anteriores ainda trazem as passwords:
  // regrava-se o rascunho sem elas.
  useEffect(() => {
    if ('password' in formData || 'confirmPassword' in formData) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, confirmPassword, ...rest } = formData as typeof formData & { password?: string; confirmPassword?: string };
      setFormData(rest as typeof formData);
    }
  }, [formData, setFormData]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [legalOpen, setLegalOpen] = useState<keyof typeof LEGAL_DOCS | null>(null);

  // Estados específicos para cada resposta do backend
  const [responseStatusType, setResponseStatusType] = useState<
    'idle' | 'new_user' | 'token_renewed' | 'pending_verification' | 'already_verified'
  >('idle');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const [oauthToken, setOauthToken] = useState('');
  const [oauthInfo, setOauthInfo] = useState<{
    isOAuth: boolean;
    provider: string;
    email: string;
    avatarUrl?: string;
  } | null>(null);

  // Captura se veio redirecionado de um provedor OAuth para terminar de preencher o formulário
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === '1') {
      const provider = params.get('provider') || '';
      const email = params.get('email') || '';
      const firstName = params.get('firstName') || '';
      const lastName = params.get('lastName') || '';
      const avatarUrl = params.get('avatar_url') || '';
      const token = params.get('oauth_token') || '';

      if (token) setOauthToken(token);

      setOauthInfo({
        isOAuth: true,
        provider,
        email,
        avatarUrl,
      });

      setFormData(prev => ({
        ...prev,
        firstName: firstName || prev.firstName,
        lastName: lastName || prev.lastName,
        email: email || prev.email,
      }));
    }
  }, [setFormData]);

  // Redirecionamento automático com contagem regressiva após o envio do e-mail
  useEffect(() => {
    if (!registeredEmail) return;
    if (countdown <= 0) {
      router.replace(`/auth/login?registered=1&email=${encodeURIComponent(registeredEmail)}`);
      return;
    }
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [registeredEmail, countdown, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const value = type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.value;

    if (name.startsWith('companyData.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        companyData: { ...prev.companyData, [field]: value }
      }));
    } else if (name.startsWith('positionData.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        positionData: { ...prev.positionData, [field]: value }
      }));
    } else if (name === 'password' || name === 'confirmPassword') {
      setPasswords(prev => ({ ...prev, [name]: String(value) }));
      if (name === 'password') setPasswordStrength(checkPasswordStrength(String(value)));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Reenvio direto a partir da tela de registo quando a conta aguarda confirmação
  const handleQuickResend = async () => {
    const targetEmail = formData.email.trim();
    if (!targetEmail) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(null);

    try {
      const resp = await api.post('/auth/resend-verification', { email: targetEmail });
      setResendSuccess(
        resp.data?.message ||
        t('auth.resendVerificationSuccess') ||
        'Novo e-mail de confirmação enviado com sucesso! Por favor consulte a sua caixa de entrada.'
      );
    } catch (err: any) {
      setResendError(
        err?.response?.data?.detail ||
        t('auth.errorConnection') ||
        'Não foi possível reenviar o e-mail de confirmação.'
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendSuccess(null);
    setResendError(null);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone.trim() ||
      !formData.companyData.company || !formData.companyData.companySize ||
      !passwords.password || !passwords.confirmPassword) {
      setError(t('auth.errorFields'));
      return;
    }

    if (passwords.password !== passwords.confirmPassword) {
      setError(t('auth.errorPasswordMatch'));
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        ...passwords,
        positionData: formData.positionData.position ? formData.positionData : undefined,
        oauthToken: oauthToken || undefined,
      };

      const requestHeaders: Record<string, string> = {};
      if (oauthToken) {
        requestHeaders['x-oauth-token'] = oauthToken;
      }

      const response = await api.post('/auth/register', submitData, {
        headers: requestHeaders,
      });

      if (response.status === 201 || response.status === 200) {
        const action = response.headers?.['x-verification-action'];
        // Registo OAuth / Auth0 é verificado automaticamente — não precisa de tela de verificação
        if (action === 'oauth_registered' || oauthInfo?.isOAuth) {
          setSuccess(t('auth.oauthSuccess') || 'Registo concluído e conta associada com sucesso! A entrar na plataforma...');
          clearSavedForm();
          setTimeout(() => {
            window.location.href = '/home';
          }, 800);
          return;
        } else if (action === 'token_renewed') {
          setResponseStatusType('token_renewed');
          setSuccess(t('auth.tokenRenewedTitle') || 'Nova Ligação de Confirmação Enviada!');
          setRegisteredEmail(formData.email);
          clearSavedForm();
        } else {
          setResponseStatusType('new_user');
          setSuccess(t('auth.successRegister'));
          setRegisteredEmail(formData.email);
          clearSavedForm();
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Num 422 o `detail` é genérico ("Dados inválidos no pedido."); o motivo
      // concreto (ex.: telefone inválido) vem em `errors[].msg`.
      const data = err?.response?.data;
      const errorCode = err?.response?.headers?.['x-error-code'];
      const detail = typeof data?.detail === 'string' ? data.detail : '';

      const firstError = Array.isArray(data?.errors) && data.errors[0]?.msg
        ? String(data.errors[0].msg).replace(/^Value error,\s*/, '')
        : null;

      if (
        errorCode === 'ALREADY_REGISTERED_UNVERIFIED' ||
        detail.toLowerCase().includes('aguarda confirmação') ||
        detail.toLowerCase().includes('ainda se encontra válida')
      ) {
        setResponseStatusType('pending_verification');
        setError(detail || t('auth.pendingVerificationDesc'));
      } else if (
        errorCode === 'ALREADY_REGISTERED_VERIFIED' ||
        detail.toLowerCase().includes('já se encontra registado e confirmado')
      ) {
        setResponseStatusType('already_verified');
        setError(detail || t('auth.alreadyRegisteredDesc'));
      } else {
        setResponseStatusType('idle');
        setError(firstError || detail || t('auth.errorConnection'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const strengthInfo = getPasswordStrengthText(passwordStrength);

  // Estilo padrão para os inputs deste formulário
  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-200 text-sm text-gray-900 placeholder:text-gray-400";
  const labelClass = "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">

        {/* Header - visível apenas antes do registo */}
        {!registeredEmail && (
          <div className="text-center mb-10">
            <div className="bg-blue-50 border border-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">MustaInfo</h1>
            <p className="text-gray-500 text-sm font-medium">{t('auth.createAccountSubtitle')}</p>
          </div>
        )}
        <Script
          id="adsense-script"
          strategy="lazyOnload"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6543986660141855"
          crossOrigin="anonymous"
        />

        {registeredEmail ? (
          /* Tela de Sucesso: Confirmação de E-mail enviado por SMTP */
          <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
            <div className={`border w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ${
              responseStatusType === 'token_renewed'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-100'
            }`}>
              <Mail className={`w-10 h-10 animate-pulse ${
                responseStatusType === 'token_renewed' ? 'text-amber-600' : 'text-blue-600'
              }`} />
            </div>

            {responseStatusType === 'token_renewed' && (
              <div className="inline-block mb-3">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-full shadow-xs">
                  {t('auth.tokenRenewedBadge') || "Prazo Renovado"}
                </span>
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {responseStatusType === 'token_renewed'
                ? (t('auth.tokenRenewedTitle') || "Nova Ligação de Confirmação Enviada!")
                : t('auth.successRegisterTitle')}
            </h2>

            <p className="text-gray-600 text-sm max-w-md mx-auto mb-4 leading-relaxed">
              {responseStatusType === 'token_renewed'
                ? (t('auth.tokenRenewedNotice', { email: registeredEmail }) || `A ligação anterior havia expirado. Enviámos um novo e-mail com novo prazo de validade para ${registeredEmail}.`)
                : t('auth.successRegisterEmail', { email: registeredEmail })}
            </p>

            <div className={`border rounded-xl p-4 max-w-md mx-auto mb-8 text-left flex items-start gap-3 ${
              responseStatusType === 'token_renewed'
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-blue-50/70 border-blue-100 text-blue-900'
            }`}>
              <Info className={`w-5 h-5 shrink-0 mt-0.5 ${
                responseStatusType === 'token_renewed' ? 'text-amber-600' : 'text-blue-600'
              }`} />
              <p className="text-xs leading-relaxed">
                {t('auth.checkInboxNotice')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
              <Button
                type="button"
                onClick={() => router.replace(`/auth/login?registered=1&email=${encodeURIComponent(registeredEmail)}`)}
                className="w-full bg-blue-600 text-white py-3.5 px-6 rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> {t('auth.goToLogin')}
              </Button>
            </div>

            <p className="text-xs text-gray-400 mt-6">
              {t('auth.autoRedirectNotice', { seconds: countdown })}
            </p>
          </div>
        ) : (
          <>
            {/* Tratamento específico por resposta do backend */}
            {responseStatusType === 'pending_verification' ? (
              <div className="mb-8 bg-amber-50/90 border border-amber-200 rounded-2xl p-6 text-left shadow-sm animate-in fade-in duration-300">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-100 border border-amber-200 p-2.5 rounded-xl text-amber-700 shrink-0 mt-0.5">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                        {t('auth.pendingVerificationBadge') || "Confirmação Pendente"}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 mb-1">
                      {t('auth.pendingVerificationTitle') || "Esta conta já foi registada e aguarda confirmação"}
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed mb-4">
                      {error}
                    </p>

                    {resendSuccess && (
                      <div className="mb-4">
                        <Alert type="success" message={resendSuccess} />
                      </div>
                    )}
                    {resendError && (
                      <div className="mb-4">
                        <Alert type="error" message={resendError} />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        onClick={handleQuickResend}
                        disabled={isResending}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center gap-2"
                      >
                        {isResending ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                        {isResending ? (t('auth.resendingVerification') || "A reenviar...") : (t('auth.resendVerificationBtn') || "Reenviar e-mail de confirmação")}
                      </Button>

                      <Link
                        href={`/auth/login?email=${encodeURIComponent(formData.email)}`}
                        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                        {t('auth.goToLogin') || "Ir para o Início de Sessão"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : responseStatusType === 'already_verified' ? (
              <div className="mb-8 bg-blue-50/90 border border-blue-200 rounded-2xl p-6 text-left shadow-sm animate-in fade-in duration-300">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 border border-blue-200 p-2.5 rounded-xl text-blue-700 shrink-0 mt-0.5">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-md">
                        {t('auth.alreadyVerifiedBadge') || "Conta Ativa"}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 mb-1">
                      {t('auth.alreadyRegisteredTitle') || "Este e-mail já está confirmado"}
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed mb-4">
                      {error}
                    </p>

                    <Link
                      href={`/auth/login?email=${encodeURIComponent(formData.email)}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all inline-flex items-center gap-2"
                    >
                      {t('auth.goToLogin') || "Iniciar Sessão"} &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {error && <div className="mb-6"><Alert type='error' message={error} /></div>}
                {success && <div className="mb-6"><Alert type='success' message={success} /></div>}
              </>
            )}

            {/* Aviso OAuth quando o utilizador vem de provedor externo */}
            {oauthInfo?.isOAuth && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 border border-blue-200 rounded-2xl p-5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-4">
                  {oauthInfo.avatarUrl ? (
                    <img
                      src={oauthInfo.avatarUrl}
                      alt={oauthInfo.provider}
                      className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm object-cover shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0 mt-0.5">
                      {oauthInfo.provider.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md">
                        {oauthInfo.provider.toUpperCase()}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        {t('auth.oauthEmailVerified') || "E-mail validado"}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900">
                      {t('auth.oauthCompleteTitle') || "Conclua o seu registo"}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                      {t('auth.oauthCompleteDesc') || "A sua conta externa foi identificada com sucesso. Preencha os dados da sua empresa, telefone e defina a sua palavra-passe para concluir o registo."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Provedores OAuth / Social Login (reutilização de OtherProviders) */}
            {!oauthInfo?.isOAuth && (
              <div className="mb-8">
                <OtherProviders login={login} t={t} />
                <div className="relative py-4 my-2">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest">
                    <span className="bg-white px-3 text-gray-400 font-bold">{t("auth.orContinueWith")}</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

          {/* Seção: Informações Pessoais */}
          <section className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-200/50">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t('auth.personalInfo')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className={labelClass}>{t('common.firstName')}</label>
                <Input name="firstName" value={formData.firstName} onChange={handleInputChange} className={inputClass} placeholder="Ex: João" required />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>{t('common.lastName')}</label>
                <Input name="lastName" value={formData.lastName} onChange={handleInputChange} className={inputClass} placeholder="Ex: Silva" required />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="register-email" className={labelClass}>{t('common.email')}</label>
                  {oauthInfo?.isOAuth && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3 text-blue-600" /> {oauthInfo.provider.toUpperCase()}
                    </span>
                  )}
                </div>
                <Input
                  id="register-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  readOnly={!!oauthInfo?.isOAuth}
                  className={`${inputClass} ${oauthInfo?.isOAuth ? "bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300" : ""}`}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="register-phone" className={labelClass}>{t('common.phone')}</label>
                {/* O backend normaliza para +<indicativo><número>; 9 dígitos a começar por 9 = Angola (+244). */}
                <Input
                  id="register-phone"
                  type="tel"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="+244 923 456 789"
                  pattern="\+?[0-9\s\-\(\)]{9,20}"
                  title={t('auth.phoneHint')}
                  required
                />
              </div>
            </div>
          </section>

          {/* Seção: Empresa */}
          <section className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-200/50">
              <Building className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t('auth.companyInfo')}</h3>
            </div>

            <div className="space-y-5">
              <div className="space-y-1">
                <label className={labelClass}>{t('auth.companyName')}</label>
                <Input name="companyData.company" value={formData.companyData.company} onChange={handleInputChange} className={inputClass} placeholder="Sua Empresa Lda" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className={labelClass}>{t('auth.companySize')}</label>
                  <select name="companyData.companySize" value={formData.companyData.companySize} onChange={handleInputChange} className={`${inputClass} appearance-none cursor-pointer`} required>
                    <option value="">{t('common.select')}</option>
                    <option value="1-10">1-10 {t('auth.employees')}</option>
                    <option value="11-50">11-50 {t('auth.employees')}</option>
                    <option value="51-200">51-200 {t('auth.employees')}</option>
                    <option value="200+">200+ {t('auth.employees')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>{t('auth.position')}</label>
                  <select name="positionData.position" value={formData.positionData.position} onChange={handleInputChange} className={`${inputClass} appearance-none cursor-pointer`}>
                    <option value="">{t('auth.selectPosition')}</option>
                    <option value="CEO">CEO / CTO</option>
                    <option value="manager">{t('auth.posManager')}</option>
                    <option value="developer">{t('auth.posDev')}</option>
                    <option value="other">{t('auth.posOther')}</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Seção: Segurança */}
          <section className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-200/50">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t('auth.security')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className={labelClass}>{t('common.password')}</label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} name="password" value={passwords.password} onChange={handleInputChange} className={`${inputClass} pr-12`} placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 p-1.5 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-2 px-1">
                  <div className="flex justify-between mb-1"><span className={`text-[10px] font-bold uppercase ${strengthInfo.color}`}>{t(strengthInfo.text)}</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-1"><div className={`h-1 rounded-full transition-all duration-500 ${strengthInfo.bg} ${strengthInfo.width}`}></div></div>
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <Input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={passwords.confirmPassword} onChange={handleInputChange} className={`${inputClass} pr-12`} placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 p-1.5 transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Termos */}
          <div className="px-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input type="checkbox" name="terms" checked={formData.terms} onChange={handleInputChange} className="peer appearance-none w-5 h-5 border border-gray-300 rounded-md bg-white checked:bg-blue-600 checked:border-blue-600 transition-all focus:ring-2 focus:ring-blue-500/50" required />
                <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
              </div>
              <span className="text-sm text-gray-600 font-medium leading-tight">
                {t('auth.agreeTerms')}{' '}
                <button type="button" onClick={(e) => { e.preventDefault(); setLegalOpen('termos'); }} className="text-blue-600 font-bold hover:underline">{t('auth.termsLink')}</button>
                {' '}{t('common.and')}{' '}
                <button type="button" onClick={(e) => { e.preventDefault(); setLegalOpen('privacidade'); }} className="text-blue-600 font-bold hover:underline">{t('auth.privacyLink')}</button>
              </span>
            </label>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-bold hover:bg-blue-700 shadow-md focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {oauthInfo?.isOAuth ? "A concluir registo..." : t('actions.creatingAccount')}</>
              ) : (
                oauthInfo?.isOAuth ? (
                  <><Check className="w-4 h-4" /> {t('auth.oauthSubmitBtn') || "Concluir Registo e Entrar"}</>
                ) : (
                  t('actions.createAccount')
                )
              )}
            </Button>
            <p className="text-center mt-6 text-sm font-medium text-gray-500">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link href="/auth/login" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">{t('actions.enter')}</Link>
            </p>
          </div>
        </form>
          </>
        )}
      </div>

      {/* Termos / Privacidade num modal: o formulário não se perde ao lê-los */}
      <Modal
        isOpen={legalOpen !== null}
        onClose={() => setLegalOpen(null)}
        title={legalOpen ? LEGAL_DOCS[legalOpen].doc.title : undefined}
        size="lg"
      >
        {legalOpen && (
          <>
            <LegalDocument doc={LEGAL_DOCS[legalOpen].doc} embedded />
            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <a
                href={LEGAL_DOCS[legalOpen].href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
              >
                <ExternalLink className="h-4 w-4" /> Abrir numa página
              </a>
              <button
                type="button"
                onClick={() => setLegalOpen(null)}
                className="min-h-[44px] rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default RegisterPage;