"use client";
import React, { useState } from 'react';
import { Eye, EyeOff, Database, User, Building, Shield } from 'lucide-react';
import { Alert, Button, Input } from '@/app/component';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';
import usePersistedState from '@/hook/localStoreUse';
import { checkPasswordStrength, getPasswordStrengthText } from './utils';

const RegisterPage = () => {
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
  
  const { api } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;

    // Verifica se o campo pertence a um objeto aninhado
    if (name.startsWith('companyData.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        companyData: {
          ...prev.companyData,
          [field]: value
        }
      }));
    } else if (name.startsWith('positionData.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        positionData: {
          ...prev.positionData,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      if (name === 'password' && typeof value === 'string') {
        setPasswordStrength(checkPasswordStrength(value));
      }
    }
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const resetForm = () => {
    setFormData({
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
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordStrength(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.companyData.company || !formData.companyData.companySize ||
        !formData.password || !formData.confirmPassword) {
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!formData.email.includes('@')) {
      showError('Por favor, insira um email válido.');
      return;
    }

    if (formData.password.length < 8) {
      showError('A palavra-passe deve ter pelo menos 8 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('As palavras-passe não coincidem.');
      return;
    }

    if (passwordStrength < 3) {
      showError('Por favor, escolha uma palavra-passe mais forte.');
      return;
    }

    if (!formData.terms) {
      showError('Por favor, aceite os termos de serviço.');
      return;
    }

    setIsLoading(true);

    try {
      // Prepara os dados no formato esperado pelo schema
      const submitData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        companyData: {
          company: formData.companyData.company,
          companySize: formData.companyData.companySize
        },
        positionData: formData.positionData.position ? {
          position: formData.positionData.position,
          descricao: formData.positionData.descricao || ''
        } : undefined,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        terms: formData.terms
      };

      console.log('Enviando dados do formulário:', submitData);

      const response = await api.post('/auth/register', submitData);

      if (response.status === 201 || response.status === 200) {
        showSuccess('Conta criada com sucesso!');
        resetForm();
        setTimeout(() => router.replace('/auth/login'), 2000);
      } else {
        showError(response.data?.detail || 'Erro ao criar conta.');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Erro de conexão com o servidor.';
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsClick = () => {
    alert('Termos de Serviço: Documento completo será exibido aqui.');
  };

  const handlePrivacyClick = () => {
    alert('Política de Privacidade: Documento completo será exibido aqui.');
  };

  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl my-8">

        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">DataSmart</h1>
          <p className="text-gray-600 text-sm">Criar nova conta</p>
        </div>

        {/* Mensagens de Erro e Sucesso */}
        {error && (
          <Alert type='error' message={error} />
        )}

        {success &&
          <Alert type='success' message={success} />
        }

        <div className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Pessoais */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Informações Pessoais</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
                  <Input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-300"
                    placeholder="João"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Apelido</label>
                  <Input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-300"
                    placeholder="Silva"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-300"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone</label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-300"
                  placeholder="+244 900 000 000"
                />
              </div>
            </div>

            {/* Informações da Empresa */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center mb-4">
                <Building className="w-5 h-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Informações da Empresa</h3>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome da Empresa</label>
                <Input
                  type="text"
                  name="companyData.company"
                  value={formData.companyData.company}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-300"
                  placeholder="Sua Empresa Lda"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tamanho da Empresa</label>
                <select
                  name="companyData.companySize"
                  value={formData.companyData.companySize}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-300"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="1-10">1-10 funcionários</option>
                  <option value="11-50">11-50 funcionários</option>
                  <option value="51-200">51-200 funcionários</option>
                  <option value="200+">200+ funcionários</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cargo</label>
                  <select
                    name="positionData.position"
                    value={formData.positionData.position}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-300"
                  >
                    <option value="">Selecione o cargo</option>
                    <option value="CEO">CEO/Diretor</option>
                    <option value="manager">Gestor</option>
                    <option value="analyst">Analista</option>
                    <option value="developer">Programador</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição do Cargo</label>
                  <Input
                    type="text"
                    name="positionData.descricao"
                    value={formData.positionData.descricao}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-300"
                    placeholder="Diretor Executivo"
                  />
                </div>
              </div>
            </div>

            {/* Segurança */}
            <div className="pb-6">
              <div className="flex items-center mb-4">
                <Shield className="w-5 h-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Segurança</h3>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Palavra-passe</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-300 pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>

                {/* Indicador de força da senha */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${strengthInfo.color}`}>{strengthInfo.text}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div className={`h-1 rounded-full transition-all duration-300 ${strengthInfo.bg} ${strengthInfo.width}`}></div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmar Palavra-passe</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-300 pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Termos e Condições */}
            <div className="flex items-start gap-3 mb-6">
              <label htmlFor="terms" className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                  required
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  Concordo com os{' '}
                  <button
                    type="button"
                    onClick={handleTermsClick}
                    className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                  >
                    Termos de Serviço
                  </button>{' '}
                  e{' '}
                  <button
                    type="button"
                    onClick={handlePrivacyClick}
                    className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                  >
                    Política de Privacidade
                  </button>.
                </span>
              </label>
            </div>

            {/* Botão de Registro */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-70"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </Button>

            <div className="text-center">
              <span className="text-gray-600 text-sm">Já tem uma conta? </span>
              <Link 
                href="/auth/login"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors duration-300 hover:underline"
              >
                Entrar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;