"use client";
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Database, Loader2 } from 'lucide-react';
import { Alert, Button, Input } from '@/app/component';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail,
        remember: true,
      }));
    }
  }, []);

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'remember') {
      if (checked && formData.email) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      showError('Por favor, preencha todos os campos.');
      return;
    }

    if (!formData.email.includes('@')) {
      showError('Por favor, insira um email válido.');
      return;
    }

    if (formData.password.length < 6) {
      showError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (formData.email === 'admin@datasmart.com' && formData.password === '123456') {
        showSuccess('Login realizado com sucesso! Redirecionando...');
        if (formData.remember) {
          localStorage.setItem('rememberedEmail', formData.email);
        }

        setTimeout(() => {
          console.log('Redirecionando para o dashboard...');
        }, 2000);
      } else {
        showError('Email ou palavra-passe incorretos.');
      }
    } catch (err) {
      showError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Funcionalidade de recuperação de palavra-passe será implementada em breve.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 hover:scale-105 hover:shadow-3xl"
      >
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-primary to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-muted-text mb-2">DataSmart</h1>
          <p className="text-muted-text text-sm">Gestor de Base de Dados Inteligente</p>
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-muted-text">
              Email
            </label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-muted border-2 border-muted-border rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all duration-300 text-muted-text placeholder-muted-text"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-muted-text">
              Palavra-passe
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-muted border-2 border-muted-border rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all duration-300 text-muted-text placeholder-muted-text pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-primary-hover transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <Input
              type="checkbox"
              id="remember"
              name="remember"
              checked={formData.remember}
              onChange={handleInputChange}
              className="w-4 h-4 text-primary bg-muted border-muted-border rounded focus:ring-primary-ring focus:ring-2"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-muted-text">
              Lembrar-me
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-purple-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary-ring disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Entrando...
              </div>
            ) : (
              'Entrar'
            )}
          </Button>
        </div>

        <div className="text-center mt-6">
          <Button
            onClick={handleForgotPassword}
            className="text-primary hover:text-primary-hover text-sm font-medium transition-colors duration-300 hover:underline"
          >
            Esqueceu a palavra-passe?
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
