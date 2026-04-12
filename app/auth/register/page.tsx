"use client";
import React, { useState } from 'react';
import { Eye, EyeOff, Database, User, Building, Shield, Loader2, Check } from 'lucide-react';
import { Alert, Button, Input } from '@/app/component';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';
import usePersistedState from '@/hook/localStoreUse';
import { checkPasswordStrength, getPasswordStrengthText } from './utils';
import { useI18n } from '@/context/I18nContext';
import Script from 'next/script';

const RegisterPage = () => {
  const { t } = useI18n();
  const router = useRouter();
  const { api } = useSession();

  const [formData, setFormData] = usePersistedState("registerForm", {
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
    password: '',
    confirmPassword: '',
    terms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'password' && typeof value === 'string') {
        setPasswordStrength(checkPasswordStrength(value));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email ||
      !formData.companyData.company || !formData.companyData.companySize ||
      !formData.password || !formData.confirmPassword) {
      setError(t('auth.errorFields'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.errorPasswordMatch'));
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        positionData: formData.positionData.position ? formData.positionData : undefined
      };

      const response = await api.post('/auth/register', submitData);

      if (response.status === 201 || response.status === 200) {
        setSuccess(t('auth.successRegister'));
        localStorage.removeItem("registerForm");
        setTimeout(() => router.replace('/auth/login'), 2000);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('auth.errorConnection'));
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

        {/* Header */}
        <div className="text-center mb-10">
          <div className="bg-blue-50 border border-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Database className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">DataSmart</h1>
          <p className="text-gray-500 text-sm font-medium">{t('auth.createAccountSubtitle')}</p>
        </div>
        <Script
          id="adsense-script"
          strategy="lazyOnload"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6543986660141855"
          crossOrigin="anonymous"
        />
        {error && <div className="mb-6"><Alert type='error' message={error} /></div>}
        {success && <div className="mb-6"><Alert type='success' message={success} /></div>}

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
              <div className="md:col-span-2 space-y-1">
                <label className={labelClass}>{t('common.email')}</label>
                <Input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="seu@email.com" required />
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
                  <Input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} className={`${inputClass} pr-12`} placeholder="••••••••" required />
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
                  <Input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className={`${inputClass} pr-12`} placeholder="••••••••" required />
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
                <button type="button" className="text-blue-600 font-bold hover:underline">{t('auth.termsLink')}</button>
                {' '}{t('common.and')}{' '}
                <button type="button" className="text-blue-600 font-bold hover:underline">{t('auth.privacyLink')}</button>
              </span>
            </label>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-bold hover:bg-blue-700 shadow-md focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('actions.creatingAccount')}</> : t('actions.createAccount')}
            </Button>
            <p className="text-center mt-6 text-sm font-medium text-gray-500">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link href="/auth/login" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">{t('actions.enter')}</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;