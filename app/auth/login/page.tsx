"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Database, Loader2, Github, Facebook } from "lucide-react";
import { Alert, Button, Input } from "@/app/component";
import { AuthProvider, LoginOptions, useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const route = useRouter()
  const { login} = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: savedEmail,
        remember: true,
      }));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "remember") {
      if (checked && formData.email) {
        localStorage.setItem("rememberedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
    }
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(""), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      return showError("Por favor, preencha todos os campos.");
    }

    if (!formData.email.includes("@")) {
      return showError("Por favor, insira um email válido.");
    }

    // if (formData.password.length < 6) {
    //   return showError("A palavra-passe deve ter pelo menos 6 caracteres.");
    // }

    setIsLoading(true);

    try {
      const response= await login("credenciais", {
        credenciais: {
          email: formData.email,
          senha: formData.password,
        },
        redirect: "/dashboard",
      });

      if (formData.remember) {
        localStorage.setItem("rememberedEmail", formData.email);
      }


      showSuccess("Login realizado com sucesso!");
      setTimeout(() => {
        if (response) route.replace("/")
      }, 2000)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      console.error("Erro no login:", error);
      showError("Falha no login. Verifique as credenciais.");
    } finally {
      setIsLoading(false);
      // Nenhum tipo explícito é necessário aqui, mas se você está perguntando sobre o tipo de error no catch:
      // O tipo padrão do parâmetro error em catch é 'unknown'.
      // Se quiser tipar, pode fazer: catch (error: unknown) { ... }


    }
  };

  const handleForgotPassword = () => {
    alert("Funcionalidade de recuperação de palavra-passe será implementada em breve.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">DataSmart</h1>
            <p className="text-gray-600 text-sm">Gestor de Base de Dados Inteligente</p>
          </div>

          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email
              </label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-500"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Palavra-passe
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-500 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>


            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-3">
              {/* Lembrar-me */}
              <div className="flex items-center">
                <Input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                  Lembrar-me
                </label>
              </div>

              {/* Link de registro */}
              <p className="text-sm text-gray-600 text-center md:text-right">
                Ainda não tem uma conta?{" "}
                <Link
                  href="/auth/register"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                >
                  Criar conta
                </Link>
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Entrando...
                </div>
              ) : (
                "Entrar"
              )}
            </Button>
          </div>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors duration-300 hover:underline"
            >
              Esqueceu a palavra-passe?
            </button>
          </div>
          <OtherProviders login={login} />
        </form>
      </div>
    </div>
  );
};




interface OtherProvidersProps {
  login: (provider: AuthProvider, options?: LoginOptions) => Promise<boolean>;
}

const OtherProviders: React.FC<OtherProvidersProps> = ({ login }) => (
  <div className="mt-6 space-y-2">
    <p className="text-center text-sm text-gray-500">Ou entre com</p>
    <div className="flex gap-3 justify-center">
      <Button
        type="button"
        onClick={() => login("google")}
        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
      >
        {/* Replace with a valid Google icon */}
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <g>
            <path fill="#4285F4" d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.469 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.148s2.75-6.148 6.125-6.148c1.922 0 3.211.82 3.953 1.523l2.703-2.633c-1.711-1.594-3.922-2.57-6.656-2.57-5.523 0-10 4.477-10 10s4.477 10 10 10c5.75 0 9.563-4.031 9.563-9.719 0-.656-.07-1.148-.156-1.629z" />
            <path fill="#34A853" d="M3.545 7.545l3.273 2.402c.891-1.742 2.578-2.953 4.482-2.953 1.094 0 2.094.375 2.875 1.094l2.703-2.633c-1.711-1.594-3.922-2.57-6.656-2.57-3.797 0-7.016 2.484-8.273 5.906z" />
            <path fill="#FBBC05" d="M12 22c2.672 0 4.922-.883 6.563-2.406l-3.047-2.492c-.844.57-1.922.914-3.516.914-2.797 0-5.164-1.891-6.016-4.453l-3.273 2.531c1.25 3.422 4.469 5.906 8.289 5.906z" />
            <path fill="#EA4335" d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.469 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.148s2.75-6.148 6.125-6.148c1.922 0 3.211.82 3.953 1.523l2.703-2.633c-1.711-1.594-3.922-2.57-6.656-2.57-5.523 0-10 4.477-10 10s4.477 10 10 10c5.75 0 9.563-4.031 9.563-9.719 0-.656-.07-1.148-.156-1.629z" />
          </g>
        </svg>
        Google
      </Button>
      <Button
        type="button"
        onClick={() => login("github")}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm"
      >
        <Github className="w-4 h-4" />
        GitHub
      </Button>
      <Button
        type="button"
        onClick={() => login("facebook")}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
      >
        <Facebook className="w-4 h-4" />
        Facebook
      </Button>
    </div>
  </div>)

export default LoginPage;
