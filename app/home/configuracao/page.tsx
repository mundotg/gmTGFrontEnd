"use client";
import React, { useMemo, useState } from "react";
import { Button } from "@/app/component";
import { useI18n } from "@/context/I18nContext";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Building,
  FolderKanban,
  Users,
  Plug,
  Settings,
  LogOut,
} from "lucide-react";

export default function SettingsPage() {
  const { t } = useI18n();
  const route = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useSession();

  const [activeTab, setActiveTab] = useState("usuario");

  const tabs = useMemo(
    () => [
      { id: "usuario", icon: User, label: "Usuário" },
      { id: "empresa", icon: Building, label: "Empresa" },
      { id: "projetos", icon: FolderKanban, label: "Projetos" },
      { id: "equipe", icon: Users, label: "Equipe" },
      { id: "integracoes", icon: Plug, label: "Integrações" },
      { id: "sistema", icon: Settings, label: "Sistema" },
    ],
    []
  );

  const logoutHandle = () => {
    logout().then(() => route.push("/auth/login"));
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white text-lg">
        Carregando sessão...
      </main>
    );
  }

  return (
    <main className="h-[100%] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white">
      <div className="max-w-6xl h-full mx-auto bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <h1 className="text-3xl font-bold text-white">
            ⚙️ Configurações do Sistema
          </h1>
         
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-indigo-700 shadow"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das Abas */}
        <div className=" w-full h-full bg-white/10  rounded-xl p-6 border border-white/20">
          {activeTab === "usuario" && (
            <section>
              <h2 className="text-xl font-semibold mb-3">👤 Configurações do Usuário</h2>
              <ul className="space-y-2 text-white/90">
                <li>• Atualizar nome, email e foto de perfil</li>
                <li>• Alterar senha</li>
                <li>• Preferências: idioma, tema, notificações</li>
                <li>• Segurança: autenticação 2FA</li>
              </ul>
            </section>
          )}

          {activeTab === "empresa" && (
            <section>
              <h2 className="text-xl font-semibold mb-3">🏢 Configurações da Empresa</h2>
              <ul className="space-y-2 text-white/90">
                <li>• Nome e informações da empresa</li>
                <li>• Domínio corporativo e contatos</li>
                <li>• Políticas de segurança e login</li>
                <li>• Planos e limites de armazenamento</li>
              </ul>
            </section>
          )}

          {activeTab === "projetos" && (
            <section>
              <h2 className="text-xl font-semibold mb-3">📁 Configurações de Projetos</h2>
              <ul className="space-y-2 text-white/90">
                <li>• Gerenciar projetos ativos e concluídos</li>
                <li>• Vincular conexões de banco de dados</li>
                <li>• Definir metas e períodos de execução</li>
              </ul>
            </section>
          )}

          {activeTab === "equipe" && (
            <section>
              <h2 className="text-xl font-semibold mb-3">🧑‍🤝‍🧑 Permissões e Equipe</h2>
              <ul className="space-y-2 text-white/90">
                <li>• Adicionar ou remover membros</li>
                <li>• Atribuir funções e níveis de acesso</li>
                <li>• Gerenciar gestores de projeto e colaboradores</li>
                <li>• Convites via email corporativo</li>
              </ul>
            </section>
          )}

          {activeTab === "integracoes" && (
            <section>
              <h2 className="text-xl font-semibold mb-3">🔌 Integrações</h2>
              <ul className="space-y-2 text-white/90">
                <li>• Conectar a GitHub, Trello, Jira ou Notion</li>
                <li>• Configurar Webhooks personalizados</li>
                <li>• Conexões de banco externas (PostgreSQL, MySQL...)</li>
                <li>• Backups automáticos na nuvem</li>
              </ul>
            </section>
          )}

          {activeTab === "sistema" && (
            <section>
              <h2 className="text-xl font-semibold mb-3">⚙️ Preferências do Sistema</h2>
              <ul className="space-y-2 text-white/90">
                <li>• Idioma e fuso horário padrão</li>
                <li>• Logs e histórico de auditoria</li>
                <li>• Monitoramento de performance</li>
                <li>• Políticas de backup e retenção de dados</li>
              </ul>
            </section>
          )}
        </div>

        <footer className="text-center text-sm text-white/70 mt-10 border-t border-white/20 pt-4">
          © {new Date().getFullYear()} - Gestor de Base de Dados | Todos os direitos reservados.
        </footer>
      </div>
    </main>
  );
}
