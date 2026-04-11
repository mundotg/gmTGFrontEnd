"use client";

import { useState, useMemo } from "react";
import { 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  Globe, 
  ExternalLink,
  Github,
  MessageSquare,
  Trello,
  Cloud
} from "lucide-react";
import { useSession } from "@/context/SessionContext";

/* ======================
   TYPES & MOCK DATA
====================== */
interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  category: "Dev" | "Comunicação" | "Gestão" | "Storage";
}

/* ======================
   COMPONENT
===================== */
export const IntegracoesTab = () => {
  const { user } = useSession();
  const permissions = user?.permissions || [];

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const integrations: Integration[] = useMemo(() => [
    { 
      id: "github", 
      name: "GitHub", 
      description: "Sincronize repositórios e pull requests.",
      icon: <Github className="text-[#181717]" />, 
      connected: true,
      category: "Dev"
    },
    { 
      id: "slack", 
      name: "Slack", 
      description: "Notificações de eventos em canais dedicados.",
      icon: <MessageSquare className="text-[#4A154B]" />, 
      connected: true,
      category: "Comunicação"
    },
    { 
      id: "jira", 
      name: "Jira", 
      description: "Vincule tarefas a tickets do projeto.",
      icon: <Trello className="text-[#0052CC]" />, 
      connected: false,
      category: "Gestão"
    },
    { 
      id: "gdrive", 
      name: "Google Drive", 
      description: "Anexe documentos diretamente aos registros.",
      icon: <Cloud className="text-[#4285F4]" />, 
      connected: false,
      category: "Storage"
    },
  ], []);

  const canManage = permissions.includes("integration:manage") || permissions.includes("admin:*");

  const handleToggleIntegration = async (integration: Integration) => {
    if (integration.connected && !window.confirm(`Desconectar ${integration.name} removerá o acesso aos dados sincronizados. Continuar?`)) {
      return;
    }

    try {
      setError(null);
      setLoadingId(integration.id);
      await new Promise((r) => setTimeout(r, 1200)); // Simulando API
      
      // Aqui você chamaria seu serviço de API real
      console.log(`${integration.connected ? 'Desconectando' : 'Conectando'} ${integration.id}`);
      
    } catch (e) {
      setError(`Falha ao processar ${integration.name}. Tente novamente. ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Integrações Disponíveis</h2>
          <p className="text-gray-500 text-sm mt-1">
            Conecte as ferramentas que sua equipe já utiliza para centralizar fluxos de trabalho.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border">
          <CheckCircle2 size={14} className="text-green-500" />
          Conexão Segura SSL/TLS
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex items-center gap-3 text-sm font-medium text-red-800 bg-red-50 border border-red-100 rounded-xl p-4 animate-in slide-in-from-top-2">
          <AlertTriangle size={18} className="text-red-500" />
          {error}
        </div>
      )}

      {/* MARKETPLACE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((app) => (
          <div
            key={app.id}
            className={`group bg-white border rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:shadow-gray-100 ${
              app.connected ? "border-blue-100" : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl border border-gray-100 shadow-sm group-hover:scale-105 transition-transform">
                  {app.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{app.name}</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-1.5 py-0.5 rounded">
                      {app.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-[200px]">
                    {app.description}
                  </p>
                </div>
              </div>

              {canManage && (
                <button
                  onClick={() => handleToggleIntegration(app)}
                  disabled={loadingId === app.id}
                  className={`relative h-9 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                    ${app.connected 
                      ? "text-red-600 bg-red-50 hover:bg-red-100 border border-red-100" 
                      : "text-white bg-gray-900 hover:bg-gray-800 shadow-sm"
                    } disabled:opacity-40`}
                >
                  {loadingId === app.id ? (
                    <Loader2 className="animate-spin mx-auto" size={16} />
                  ) : (
                    app.connected ? "Desconectar" : "Conectar"
                  )}
                </button>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${app.connected ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                <span className="text-[11px] font-bold text-gray-400 uppercase">
                  {app.connected ? "Serviço Ativo" : "Não Vinculado"}
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* WEBHOOKS ADVANCED SECTION */}
      {permissions.includes("integration:webhook_manage") && (
        <div className="bg-gray-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold tracking-widest uppercase">
                <Globe size={14} /> Desenvolvedor
              </div>
              <h3 className="text-2xl font-bold">Webhooks de Saída</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Envie eventos em tempo real para seus próprios servidores ou serviços de automação como Zapier e Make.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-md space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Endpoint URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://sua-api.com/v1/webhook"
                    className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                    Salvar
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <CheckCircle2 size={12} /> Segredo de assinatura (HMAC) será gerado após salvar.
              </div>
            </div>
          </div>
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        </div>
      )}
    </div>
  );
};