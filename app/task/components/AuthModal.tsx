"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "./modalComponent";
import { UserRoleEnum, UsuarioTaskCreate } from "../types";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (userData: UsuarioTaskCreate) => Promise<void>;
}

// 1. MELHORIA: Dados estáticos movidos para fora do componente para evitar recriação a cada render
const ROLE_DESCRIPTIONS: Record<string, string> = {
    admin: "Administrador do sistema",
    user: "Usuário padrão",
    manager: "Gestor de equipe",
    membro: "Membro da equipe",
    gerente: "Gerente de projeto"
};

const ROLES_OPTIONS = [
    { value: "membro", label: "Membro" },
    { value: "user", label: "Usuário" },
    { value: "gerente", label: "Gerente" },
    { value: "manager", label: "Manager" },
    { value: "admin", label: "Administrador" }
];

export const AuthModal: React.FC<AuthModalProps> = ({
    isOpen,
    onClose,
    onLogin,
    onRegister,
}) => {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [role, setRole] = useState<UserRoleEnum>("membro");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Limpa os campos e erros quando muda de modo
    useEffect(() => {
        setNome("");
        setEmail("");
        setSenha("");
        setConfirmarSenha("");
        setAvatarUrl("");
        setRole("membro");
        setError(null);
        setShowPassword(false); // Reseta a visualização da senha
    }, [mode, isOpen]); // Também limpa quando o modal abre/fecha

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidSenha = (senha: string) => senha.length >= 6;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isValidEmail(email)) {
            setError("Por favor, insira um e-mail válido.");
            return;
        }

        if (!isValidSenha(senha)) {
            setError("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        if (mode === "register") {
            if (nome.trim().length < 2) {
                setError("O nome deve ter pelo menos 2 caracteres.");
                return;
            }
            if (senha !== confirmarSenha) {
                setError("As senhas não coincidem.");
                return;
            }
        }

        setLoading(true);

        try {
            if (mode === "login") {
                await onLogin(email, senha);
            } else {
                const userData: UsuarioTaskCreate = {
                    nome: nome.trim(),
                    email: email.trim(),
                    senha,
                    avatarUrl: avatarUrl.trim() || undefined,
                    role_id: undefined,
                    role: {
                        name: role,
                    }
                };

                await onRegister(userData);
                setMode("login");
            }
            // Sucesso - Limpa o formulário apenas se não fechou automaticamente
            if (mode === "register") {
                setNome("");
                setSenha("");
                setConfirmarSenha("");
                setError(null);
            }

        } catch (err: unknown) {
            console.error("Erro de autenticação:", err);

            // 2. MELHORIA: Tipagem segura do erro (Evita o 'any')
            const errorObj = err as { response?: { status?: number, data?: { message?: string } }, message?: string };

            if (errorObj.response?.status === 401) {
                setError("E-mail ou senha incorretos.");
            } else if (errorObj.response?.status === 409 || errorObj.response?.status === 422) {
                setError("Este e-mail já está cadastrado ou os dados são inválidos.");
            } else if (errorObj.response?.status === 400) {
                setError(errorObj.response?.data?.message || "Dados inválidos.");
            } else if (errorObj.message) {
                setError(errorObj.message);
            } else {
                setError("Falha na autenticação. Verifique a sua conexão e tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(prev => prev === "login" ? "register" : "login");
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "login" ? "Entrar na sua conta" : "Criar nova conta"}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                    <>
                        <div>
                            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                                Nome completo
                            </label>
                            <input
                                id="nome"
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="João Silva"
                                required
                                minLength={2}
                                disabled={loading}
                                autoFocus // 3. MELHORIA: Foco automático aqui ao ir para "Cadastro"
                            />
                        </div>

                        <div>
                            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">
                                URL do Avatar (opcional)
                            </label>
                            <input
                                id="avatarUrl"
                                type="url"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="https://exemplo.com/avatar.jpg"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                Função
                            </label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRoleEnum)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                disabled={loading}
                            >
                                {ROLES_OPTIONS.map((roleOption) => (
                                    <option key={roleOption.value} value={roleOption.value}>
                                        {roleOption.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {ROLE_DESCRIPTIONS[role] || "Usuário do sistema"}
                            </p>
                        </div>
                    </>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="seu@email.com"
                        required
                        disabled={loading}
                        autoFocus={mode === "login"} // 3. MELHORIA: Foco automático aqui ao ir para "Login"
                    />
                </div>

                <div>
                    <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                        Senha
                    </label>
                    <div className="relative">
                        <input
                            id="senha"
                            type={showPassword ? "text" : "password"}
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
                            placeholder="••••••••"
                            required
                            minLength={6}
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            disabled={loading}
                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {mode === "register" && (
                        <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                    )}
                </div>

                {mode === "register" && (
                    <div>
                        <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar senha
                        </label>
                        <input
                            id="confirmarSenha"
                            type={showPassword ? "text" : "password"}
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="••••••••"
                            required
                            minLength={6}
                            disabled={loading}
                        />
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm text-center flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Aguarde...
                        </>
                    ) : mode === "login" ? "Entrar" : "Criar conta"}
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">ou</span>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-600">
                    {mode === "login" ? "Ainda não tem conta? " : "Já possui conta? "}
                    <button
                        type="button"
                        onClick={toggleMode}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                    >
                        {mode === "login" ? "Cadastre-se gratuitamente" : "Fazer login"}
                    </button>
                </p>
            </form>
        </Modal>
    );
};