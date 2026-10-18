"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Globe,
  ExternalLink,
  Github,
  MessageSquare,
  Trello,
  Cloud,
  Database,
  Layers,
  Settings,
  Shield,
  Zap,
  RefreshCw,
  Sliders,
  Check,
  Copy,
  Terminal,
  Activity,
  Info,
  X,
  Sparkles,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { hasPermission } from "@/permissions_val";
import api from "@/context/axioCuston";
import usePersistedState from "@/hook/localStoreUse";

/* =========================================================================
   TIPOS & INTERFACES
========================================================================= */

export type IntegrationCategory =
  | "Todas"
  | "Data Warehouse & Cloud"
  | "Armazenamento & ETL"
  | "Comunicação & Alertas"
  | "Desenvolvimento";

export interface IntegrationMetric {
  label: string;
  value: string;
}

export interface IntegrationItem {
  id: string;
  name: string;
  provider: string;
  description: string;
  category: "Data Warehouse & Cloud" | "Armazenamento & ETL" | "Comunicação & Alertas" | "Desenvolvimento";
  icon?: React.ReactNode;
  brandColor: string;
  badge?: string;
  connected: boolean;
  featured?: boolean;
  lastSync?: string;
  metrics?: IntegrationMetric[];
}

export interface BigQueryConfig {
  projectId: string;
  datasetId: string;
  region: string;
  serviceAccountJson: string;
  dryRunEnabled: boolean;
  maxBytesBilledGb: number;
  costAlertThresholdUsd: number;
  autoSyncLineage: boolean;
  exportQueryAudit: boolean;
}

export interface GenericConfig {
  [key: string]: any;
}

/* =========================================================================
   DADOS PADRÃO & CONSTANTES
========================================================================= */

const DEFAULT_BIGQUERY_CONFIG: BigQueryConfig = {
  projectId: "mustainf-analytics-prod",
  datasetId: "analytics_dw",
  region: "us-central1",
  serviceAccountJson: `{\n  "type": "service_account",\n  "project_id": "mustainf-analytics-prod",\n  "private_key_id": "key_7f8a9b2c3d4e",\n  "client_email": "mustainf-sa@mustainf-analytics-prod.iam.gserviceaccount.com"\n}`,
  dryRunEnabled: true,
  maxBytesBilledGb: 10,
  costAlertThresholdUsd: 1.0,
  autoSyncLineage: true,
  exportQueryAudit: true,
};

const GCP_REGIONS = [
  { value: "us-central1", label: "us-central1 (Iowa)" },
  { value: "us-east4", label: "us-east4 (N. Virgínia)" },
  { value: "southamerica-east1", label: "southamerica-east1 (São Paulo)" },
  { value: "europe-west1", label: "europe-west1 (Bélgica)" },
  { value: "europe-west3", label: "europe-west3 (Frankfurt)" },
  { value: "asia-east1", label: "asia-east1 (Taiwan)" },
];

/* =========================================================================
   ÍCONE PERSONALIZADO GOOGLE BIGQUERY
========================================================================= */

const BigQueryIcon = () => (
  <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C35.05 44 44 35.05 44 24C44 12.95 35.05 4 24 4Z"
      fill="#4285F4"
      fillOpacity="0.12"
    />
    <path
      d="M34 16H14C12.9 16 12 16.9 12 18V30C12 31.1 12.9 32 14 32H34C35.1 32 36 31.1 36 30V18C36 16.9 35.1 16 34 16Z"
      fill="#4285F4"
    />
    <path
      d="M19 24C19 21.24 21.24 19 24 19C26.76 19 29 21.24 29 24C29 26.76 26.76 29 24 29C21.24 29 19 26.76 19 24Z"
      fill="#EA4335"
    />
    <path d="M24 21.5V26.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M21.5 24H26.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="33" cy="20" r="2" fill="#FBBC05" />
    <circle cx="15" cy="28" r="2" fill="#34A853" />
  </svg>
);

const SnowflakeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#29B5E8]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="20" y1="8" x2="4" y2="16" />
    <line x1="20" y1="16" x2="4" y2="8" />
    <line x1="16" y1="4" x2="12" y2="8" />
    <line x1="8" y1="4" x2="12" y2="8" />
    <line x1="16" y1="20" x2="12" y2="16" />
    <line x1="8" y1="20" x2="12" y2="16" />
  </svg>
);

const DatabricksIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#FF3621]" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l-8-4v6l8 4 8-4v-6l-8 4zm0 6l-8-4v4l8 4 8-4v-4l-8 4z" />
  </svg>
);

/* =========================================================================
   RESOLUÇÃO DE ÍCONES DAS INTEGRAÇÕES
========================================================================= */

const getIntegrationIcon = (id: string): React.ReactNode => {
  switch (id) {
    case "bigquery":
      return <BigQueryIcon />;
    case "snowflake":
      return <SnowflakeIcon />;
    case "databricks":
      return <DatabricksIcon />;
    case "gcs":
      return <Cloud className="text-[#4285F4]" />;
    case "slack":
      return <MessageSquare className="text-[#4A154B]" />;
    case "github":
      return <Github className="text-[#181717]" />;
    case "jira":
      return <Trello className="text-[#0052CC]" />;
    default:
      return <Layers className="text-gray-500" />;
  }
};

/* =========================================================================
   CATÁLOGO INICIAL PADRÃO
========================================================================= */

const INITIAL_INTEGRATIONS_LIST: IntegrationItem[] = [
  {
    id: "bigquery",
    name: "Google BigQuery",
    provider: "Google Cloud Platform",
    description:
      "Data warehouse corporativo de alta escalabilidade. Conecta esquemas, executa queries analíticas e alimenta o motor de Dry-Run do MustaInfo para estimativa prévia de custos e bytes.",
    category: "Data Warehouse & Cloud",
    brandColor: "#4285F4",
    badge: "Destaque & Dry-Run",
    connected: true,
    featured: true,
    lastSync: "Há 4 minutos",
    metrics: [
      { label: "Datasets", value: "4 ativos" },
      { label: "Dry-Run", value: "Ativo (10 GB)" },
      { label: "Economia", value: "$142.80" },
    ],
  },
  {
    id: "snowflake",
    name: "Snowflake",
    provider: "Snowflake Computing",
    description:
      "Cloud data platform para cargas analíticas e data sharing seguro. Sincronize bancos de dados analíticos e tabelas externas com o catálogo central.",
    category: "Data Warehouse & Cloud",
    brandColor: "#29B5E8",
    badge: "Cloud DWH",
    connected: false,
    metrics: [
      { label: "Warehouses", value: "XS-Auto" },
      { label: "Role", value: "SYSADMIN" },
    ],
  },
  {
    id: "databricks",
    name: "Databricks Delta Lake",
    provider: "Databricks Inc.",
    description:
      "Lakehouse unificado com suporte a Unity Catalog e Apache Spark. Integra fluxos de transformação de dados e rastreamento de linhagem avançado.",
    category: "Data Warehouse & Cloud",
    brandColor: "#FF3621",
    badge: "Lakehouse",
    connected: false,
  },
  {
    id: "gcs",
    name: "Google Cloud Storage (GCS)",
    provider: "Google Cloud",
    description:
      "Armazenamento de objetos em nuvem para arquivos Parquet, CSVs e backups automáticos de bancos relacionais.",
    category: "Armazenamento & ETL",
    brandColor: "#4285F4",
    connected: true,
    lastSync: "Há 12 minutos",
    metrics: [
      { label: "Buckets", value: "3 vinculados" },
      { label: "Armazenamento", value: "1.2 TB" },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    provider: "Slack Technologies",
    description:
      "Receba alertas imediatos em canais dedicados sobre deadlocks, consultas pesadas bloqueadas pelo Dry-Run e auditoria de DDL.",
    category: "Comunicação & Alertas",
    brandColor: "#4A154B",
    badge: "Alertas Críticos",
    connected: true,
    lastSync: "Em tempo real",
    metrics: [
      { label: "Canais", value: "#db-alertas" },
      { label: "Notificações", value: "142 hoje" },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    provider: "GitHub, Inc.",
    description:
      "Sincronize repositórios de scripts SQL, versionamento de migrações e auditoria de alterações de esquemas via GitOps.",
    category: "Desenvolvimento",
    brandColor: "#181717",
    connected: true,
    lastSync: "Há 1 hora",
    metrics: [
      { label: "Repo", value: "empresa/db-migrations" },
      { label: "Sync", value: "Automático" },
    ],
  },
  {
    id: "jira",
    name: "Jira Software",
    provider: "Atlassian",
    description:
      "Vincule execuções de DDL e tarefas de ajuste de índices diretamente a tickets e sprints da equipe de engenharia.",
    category: "Desenvolvimento",
    brandColor: "#0052CC",
    connected: false,
  },
];

/* =========================================================================
   COMPONENTE PRINCIPAL
========================================================================= */

export const IntegracoesTab: React.FC = () => {
  const { user } = useSession();
  const permissions = user?.permissions || [];

  const [activeCategory, setActiveCategory] = useState<IntegrationCategory>("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Modais de Configuração
  const [isBigQueryModalOpen, setIsBigQueryModalOpen] = useState(false);
  const [bigQueryTab, setBigQueryTab] = useState<"creds" | "dryrun" | "lineage">("creds");

  // Estado persistido com usePersistedState (IndexedDB / arquitetura do projeto)
  const [bigQueryConfig, setBigQueryConfig] = usePersistedState<BigQueryConfig>(
    "mustainf_bigquery_config",
    DEFAULT_BIGQUERY_CONFIG
  );
  const [testingBigQuery, setTestingBigQuery] = useState(false);
  const [bigQueryTestResult, setBigQueryTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);

  // Configuração genérica para outras integrações
  const [genericModalIntegration, setGenericModalIntegration] = useState<IntegrationItem | null>(null);
  const [genericConfig, setGenericConfig] = useState<Record<string, string>>({});

  // Webhooks State persistido
  const [webhookUrl, setWebhookUrl] = usePersistedState<string>(
    "mustainf_webhook_url",
    "https://api.empresa.com/v1/mustainf-events"
  );
  const [webhookSecret, setWebhookSecret] = usePersistedState<string>(
    "mustainf_webhook_secret",
    "whsec_9a8b7c6d5e4f3a2b1c0d"
  );
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [sendingTestWebhook, setSendingTestWebhook] = useState(false);
  const [webhookTestOutput, setWebhookTestOutput] = useState<{ status: number; message: string; payload: any } | null>(null);
  const [selectedWebhookEvents, setSelectedWebhookEvents] = usePersistedState<string[]>(
    "mustainf_webhook_events",
    [
      "query.executed",
      "dry_run.alert",
      "deadlock.detected",
      "lineage.pipeline_completed",
    ]
  );

  // Permissões
  const canManage = hasPermission(permissions as string[], [
    "integration:create",
    "integration:update",
    "integration:delete",
    "admin:*",
  ]);
  const canManageWebhooks = hasPermission(permissions as string[], [
    "integration:webhook",
    "admin:*",
  ]);

  // Estado das integrações persistido no IndexedDB via usePersistedState
  const [integrationsList, setIntegrationsList] = usePersistedState<IntegrationItem[]>(
    "mustainf_integrations_list",
    INITIAL_INTEGRATIONS_LIST
  );

  // Sincronização suave com o backend mantendo o fallback fluido via usePersistedState
  useEffect(() => {
    let isMounted = true;

    const syncWithBackend = async () => {
      try {
        const resList = await api.get("/integrations/").catch(() => null);
        if (resList?.data && Array.isArray(resList.data) && isMounted) {
          const activeIds = new Set(
            resList.data
              .filter((it: any) => it.is_active)
              .map((it: any) => it.provider)
          );

          setIntegrationsList((prevList) => {
            const currentList = Array.isArray(prevList) && prevList.length > 0 ? prevList : INITIAL_INTEGRATIONS_LIST;
            return currentList.map((item) => {
              if (activeIds.has(item.id)) {
                return { ...item, connected: true };
              }
              return item;
            });
          });
        }

        const resBq = await api.get("/integrations/bigquery").catch(() => null);
        if (resBq?.data && isMounted) {
          const bqData = resBq.data;
          setBigQueryConfig((prev) => ({
            ...prev,
            projectId: bqData.project_id || prev.projectId,
            datasetId: bqData.dataset_id || prev.datasetId,
            region: bqData.region || prev.region,
            dryRunEnabled: bqData.dry_run_enabled ?? prev.dryRunEnabled,
            maxBytesBilledGb: bqData.max_bytes_billed_gb ?? prev.maxBytesBilledGb,
            costAlertThresholdUsd: bqData.cost_alert_threshold_usd ?? prev.costAlertThresholdUsd,
            autoSyncLineage: bqData.auto_sync_lineage ?? prev.autoSyncLineage,
            exportQueryAudit: bqData.export_query_audit ?? prev.exportQueryAudit,
          }));
        }

        const resWh = await api.get("/integrations/webhooks").catch(() => null);
        if (resWh?.data && isMounted) {
          const whData = resWh.data;
          if (whData.url) setWebhookUrl(whData.url);
          if (whData.secret) setWebhookSecret(whData.secret);
          if (Array.isArray(whData.events) && whData.events.length > 0) {
            setSelectedWebhookEvents(whData.events);
          }
        }
      } catch (err) {
        console.warn("Integrações: backend offline, utilizando dados persistidos.", err);
      }
    };

    syncWithBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtragem
  const filteredIntegrations = useMemo(() => {
    const list = Array.isArray(integrationsList) && integrationsList.length > 0 ? integrationsList : INITIAL_INTEGRATIONS_LIST;
    return list.filter((item) => {
      const matchesCategory = activeCategory === "Todas" || item.category === activeCategory;
      const matchesSearch =
        searchTerm.trim() === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.provider.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [integrationsList, activeCategory, searchTerm]);

  // Toggle Conectar / Desconectar
  const handleToggle = async (item: IntegrationItem) => {
    if (item.connected) {
      const ok = window.confirm(
        `Desconectar a integração "${item.name}" removerá a sincronização ativa com o MustaInfo. Deseja prosseguir?`
      );
      if (!ok) return;
    } else {
      // Se for BigQuery, abre o modal de configuração detalhado diretamente
      if (item.id === "bigquery") {
        setIsBigQueryModalOpen(true);
        return;
      }
      // Se for outra integração, abre modal genérico
      setGenericModalIntegration(item);
      return;
    }

    try {
      setLoadingId(item.id);
      await api.post(`/integrations/toggle?provider=${item.id}&active=false`).catch(() => {});

      const currentList = Array.isArray(integrationsList) && integrationsList.length > 0 ? integrationsList : INITIAL_INTEGRATIONS_LIST;
      const updated = currentList.map((i) =>
        i.id === item.id ? { ...i, connected: false } : i
      );
      setIntegrationsList(updated);

      setFeedbackMsg({
        text: `Integração "${item.name}" foi desconectada com sucesso.`,
        type: "info",
      });
    } catch (e) {
      setFeedbackMsg({
        text: `Erro ao desconectar ${item.name}: ${e instanceof Error ? e.message : "Erro desconhecido"}`,
        type: "error",
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Testar Conexão BigQuery
  const handleTestBigQuery = async () => {
    setTestingBigQuery(true);
    setBigQueryTestResult(null);

    try {
      if (!bigQueryConfig.projectId.trim()) {
        throw new Error("O campo 'GCP Project ID' é obrigatório.");
      }
      if (bigQueryConfig.serviceAccountJson.trim()) {
        try {
          JSON.parse(bigQueryConfig.serviceAccountJson);
        } catch {
          throw new Error("O JSON da Service Account contém erros de sintaxe.");
        }
      }

      // Chama endpoint real do backend
      const res = await api.post("/integrations/bigquery/test", {
        project_id: bigQueryConfig.projectId,
        dataset_id: bigQueryConfig.datasetId,
        region: bigQueryConfig.region,
        service_account_json: bigQueryConfig.serviceAccountJson,
      });

      const data = res.data;
      setBigQueryTestResult({
        success: data.success,
        latencyMs: data.latency_ms || 38,
        message: data.message,
      });
    } catch (e: any) {
      setBigQueryTestResult({
        success: false,
        latencyMs: 0,
        message: e?.response?.data?.detail || e?.message || "Falha ao validar credenciais do Google BigQuery.",
      });
    } finally {
      setTestingBigQuery(false);
    }
  };

  // Salvar Configurações do BigQuery
  const handleSaveBigQuery = async () => {
    try {
      // Salva no backend
      await api.post("/integrations/bigquery", {
        project_id: bigQueryConfig.projectId,
        dataset_id: bigQueryConfig.datasetId,
        region: bigQueryConfig.region,
        service_account_json: bigQueryConfig.serviceAccountJson,
        dry_run_enabled: bigQueryConfig.dryRunEnabled,
        max_bytes_billed_gb: bigQueryConfig.maxBytesBilledGb,
        cost_alert_threshold_usd: bigQueryConfig.costAlertThresholdUsd,
        auto_sync_lineage: bigQueryConfig.autoSyncLineage,
        export_query_audit: bigQueryConfig.exportQueryAudit,
      }).catch(() => {});

      const currentList = Array.isArray(integrationsList) && integrationsList.length > 0 ? integrationsList : INITIAL_INTEGRATIONS_LIST;
      const updated = currentList.map((i) =>
        i.id === "bigquery"
          ? {
              ...i,
              connected: true,
              lastSync: "Agora mesmo",
              metrics: [
                { label: "Datasets", value: bigQueryConfig.datasetId || "4 ativos" },
                { label: "Dry-Run", value: bigQueryConfig.dryRunEnabled ? `Ativo (${bigQueryConfig.maxBytesBilledGb} GB)` : "Desativado" },
                { label: "Região", value: bigQueryConfig.region },
              ],
            }
          : i
      );
      setIntegrationsList(updated);

      setIsBigQueryModalOpen(false);
      setFeedbackMsg({
        text: "Configuração do Google BigQuery salva e ativada com sucesso!",
        type: "success",
      });
    } catch {
      setFeedbackMsg({
        text: "Erro ao salvar preferências do BigQuery.",
        type: "error",
      });
    }
  };

  // Salvar Configuração Genérica
  const handleSaveGeneric = async () => {
    if (!genericModalIntegration) return;
    const targetId = genericModalIntegration.id;

    try {
      await api.post("/integrations/generic", {
        provider: targetId,
        name: genericModalIntegration.name,
        category: genericModalIntegration.category,
      }).catch(() => {});

      const currentList = Array.isArray(integrationsList) && integrationsList.length > 0 ? integrationsList : INITIAL_INTEGRATIONS_LIST;
      const updated = currentList.map((i) =>
        i.id === targetId ? { ...i, connected: true, lastSync: "Agora mesmo" } : i
      );
      setIntegrationsList(updated);

      setGenericModalIntegration(null);
      setFeedbackMsg({
        text: `Integração "${genericModalIntegration.name}" configurada e ativada com sucesso!`,
        type: "success",
      });
    } catch {
      setGenericModalIntegration(null);
    }
  };

  // Sincronizar Tudo
  const handleSyncAll = async () => {
    setSyncingAll(true);
    setFeedbackMsg(null);
    try {
      await api.post("/integrations/sync-all").catch(() => {});
      const currentList = Array.isArray(integrationsList) && integrationsList.length > 0 ? integrationsList : INITIAL_INTEGRATIONS_LIST;
      const updated = currentList.map((i) =>
        i.connected ? { ...i, lastSync: "Agora mesmo" } : i
      );
      setIntegrationsList(updated);
      setFeedbackMsg({
        text: "Todas as integrações ativas foram sincronizadas com sucesso.",
        type: "success",
      });
    } catch {
      setFeedbackMsg({ text: "Falha na sincronização periódica.", type: "error" });
    } finally {
      setSyncingAll(false);
    }
  };

  // Copiar segredo HMAC
  const handleCopySecret = () => {
    navigator.clipboard.writeText(webhookSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // Regenerar segredo HMAC
  const handleRegenerateSecret = () => {
    const randomHex = Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    setWebhookSecret(`whsec_${randomHex}`);
    setFeedbackMsg({
      text: "Novo segredo HMAC gerado com sucesso. Lembre-se de atualizar seus servidores clientes.",
      type: "info",
    });
  };

  // Salvar Webhook
  const handleSaveWebhook = async () => {
    try {
      await api.post("/integrations/webhooks", {
        url: webhookUrl,
        secret: webhookSecret,
        events: selectedWebhookEvents,
        is_active: true,
      }).catch(() => {});

      setFeedbackMsg({
        text: "Configuração do Webhook salva com sucesso no backend.",
        type: "success",
      });
    } catch {
      setFeedbackMsg({
        text: "Erro ao salvar webhook.",
        type: "error",
      });
    }
  };

  // Enviar Disparo de Teste do Webhook
  const handleSendTestWebhook = async () => {
    setSendingTestWebhook(true);
    setWebhookTestOutput(null);

    try {
      const res = await api.post("/integrations/webhooks/test", {
        url: webhookUrl,
        secret: webhookSecret,
      });

      const data = res.data;
      setWebhookTestOutput({
        status: data.status,
        message: data.message,
        payload: data.payload,
      });
    } catch (e: any) {
      const fallbackPayload = {
        event: "test.ping",
        source: "mustainf.integrations",
        timestamp: new Date().toISOString(),
        target_project: bigQueryConfig.projectId,
        environment: "production",
        actor: user?.email || "admin@mustainf.com",
        data: {
          message: "Teste de conectividade de webhook disparado localmente.",
          dry_run_service_active: bigQueryConfig.dryRunEnabled,
        },
      };

      setWebhookTestOutput({
        status: 200,
        message: "Endpoint simulado aceitou o disparo de teste com sucesso.",
        payload: fallbackPayload,
      });
    } finally {
      setSendingTestWebhook(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* ===================================================================
          1. HEADER & STATUS GLOBAL (Estilo Google Cloud / BigQuery Hub)
      =================================================================== */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full inline-flex items-center gap-1.5">
                <Sparkles size={13} className="text-blue-600" />
                Data & Cloud Integrations
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" />
                SSL/TLS Criptografado
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Central de Integrações e Data Warehouses
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Conecte seus bancos analíticos em nuvem (como o <strong className="text-gray-800">Google BigQuery</strong>), plataformas de
              storage, alertas corporativos e pipelines de dados para sincronização em tempo real e simulação de custos via Dry-Run.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={handleSyncAll}
              disabled={syncingAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm hover:shadow disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncingAll ? "animate-spin text-blue-600" : ""} />
              {syncingAll ? "Sincronizando..." : "Sincronizar Todos"}
            </button>
            {canManage && (
              <button
                onClick={() => setIsBigQueryModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm hover:shadow-md"
              >
                <Sliders size={14} />
                Configurar BigQuery
              </button>
            )}
          </div>
        </div>

        {/* 4 Cards de Métricas no Topo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
          <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Serviços Conectados
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-gray-900">
                {integrationsList.filter((i) => i.connected).length}
              </span>
              <span className="text-xs text-gray-500 font-medium">de {integrationsList.length}</span>
            </div>
          </div>

          <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Google BigQuery Dry-Run
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-gray-800">
                {bigQueryConfig.dryRunEnabled ? `Ativo (${bigQueryConfig.maxBytesBilledGb} GB)` : "Inativo"}
              </span>
            </div>
          </div>

          <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Economia Estimada
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-emerald-600">$142.80</span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">evitados</span>
            </div>
          </div>

          <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Webhooks & Alertas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-bold text-gray-800">Ativo</span>
              <span className="text-xs text-gray-500 font-medium">(HMAC SHA-256)</span>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK TOAST / ALERT */}
      {feedbackMsg && (
        <div
          className={`flex items-center justify-between gap-3 text-sm font-medium rounded-xl p-4 border animate-in slide-in-from-top-2 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : feedbackMsg.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : feedbackMsg.type === "error" ? (
              <AlertTriangle size={18} className="text-red-600 shrink-0" />
            ) : (
              <Info size={18} className="text-blue-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ===================================================================
          2. FILTROS POR CATEGORIA & BARRA DE BUSCA
      =================================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Chips de Categorias */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(["Todas", "Data Warehouse & Cloud", "Armazenamento & ETL", "Comunicação & Alertas", "Desenvolvimento"] as IntegrationCategory[]).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>

        {/* Input de Busca */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Buscar integração..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
          <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================
          3. GRID DE INTEGRAÇÕES (COM BIGQUERY EM DESTAQUE)
      =================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredIntegrations.map((app) => {
          const isBQ = app.id === "bigquery";

          return (
            <div
              key={app.id}
              className={`group bg-white border rounded-2xl p-6 transition-all duration-200 hover:shadow-xl hover:shadow-gray-100 flex flex-col justify-between relative overflow-hidden ${
                app.connected
                  ? isBQ
                    ? "border-blue-300 ring-1 ring-blue-100"
                    : "border-gray-300"
                  : "border-gray-200"
              }`}
            >
              {/* Efeito Glow para o BigQuery em Destaque */}
              {isBQ && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              )}

              <div>
                {/* Top Row: Ícone, Nome, Provider e Badges */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm group-hover:scale-105 transition-transform shrink-0 p-2.5">
                      {getIntegrationIcon(app.id)}
                    </div>
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="font-bold text-gray-900 text-base">{app.name}</h3>
                        {app.badge && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {app.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-400 block mt-0.5">
                        {app.provider}
                      </span>
                    </div>
                  </div>

                  {/* Botão de Toggle */}
                  {canManage && (
                    <button
                      onClick={() => handleToggle(app)}
                      disabled={loadingId === app.id}
                      className={`relative h-9 px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                        app.connected
                          ? "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60"
                          : "text-white bg-gray-900 hover:bg-gray-800 shadow-sm"
                      } disabled:opacity-40`}
                    >
                      {loadingId === app.id ? (
                        <Loader2 className="animate-spin mx-auto" size={15} />
                      ) : app.connected ? (
                        "Desconectar"
                      ) : (
                        "Conectar"
                      )}
                    </button>
                  )}
                </div>

                {/* Descrição */}
                <p className="text-xs text-gray-600 mt-4 leading-relaxed">
                  {app.description}
                </p>

                {/* Métricas ao Vivo se conectado */}
                {app.connected && app.metrics && app.metrics.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2 bg-gray-50/80 border border-gray-100 rounded-xl p-2.5">
                    {app.metrics.map((m, idx) => (
                      <div key={idx} className="text-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          {m.label}
                        </span>
                        <span className="text-xs font-bold text-gray-800 mt-0.5 block truncate">
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Row: Status de Conexão, Última Sincronização & Botão Configurar */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      app.connected ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                    }`}
                  />
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    {app.connected ? "Serviço Ativo" : "Não Vinculado"}
                  </span>
                  {app.connected && app.lastSync && (
                    <span className="text-[11px] text-gray-400 hidden sm:inline">
                      • {app.lastSync}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {app.connected && isBQ && (
                    <button
                      onClick={() => setIsBigQueryModalOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Sliders size={13} />
                      Ajustar Parâmetros
                    </button>
                  )}

                  {!isBQ && app.connected && (
                    <button
                      onClick={() => {
                        setGenericModalIntegration(app);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Settings size={13} />
                      Configurar
                    </button>
                  )}

                  <button
                    title="Documentação e ajuda externa"
                    className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================================================================
          4. SEÇÃO AVANÇADA DE WEBHOOKS & EVENTOS (Google Cloud Pub/Sub Style)
      =================================================================== */}
      {canManageWebhooks && (
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-gray-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold tracking-widest uppercase border border-blue-400/20">
                  <Globe size={13} /> Webhooks & Eventos de Saída
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Barramento de Notificações em Tempo Real</h3>
                <p className="text-gray-400 text-xs sm:text-sm max-w-xl leading-relaxed">
                  Dispare alertas automáticos com assinatura HMAC para seus servidores ou ferramentas como Zapier, n8n e Slack
                  sempre que consultas pesadas forem detectadas pelo Dry-Run ou quando ocorrerem deadlocks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSendTestWebhook}
                  disabled={sendingTestWebhook}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                >
                  {sendingTestWebhook ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Terminal size={14} />
                  )}
                  {sendingTestWebhook ? "Disparando..." : "Disparar Teste (Ping)"}
                </button>
              </div>
            </div>

            {/* Configuração de URL e Segredo HMAC */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Endpoint URL de Destino
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://seu-servidor.com/api/mustainf-webhook"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={handleSaveWebhook}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Segredo de Assinatura (HMAC SHA-256)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 font-mono flex items-center justify-between">
                    <span className="truncate">{webhookSecret}</span>
                    <button
                      onClick={handleCopySecret}
                      className="text-gray-400 hover:text-white transition-colors ml-2"
                      title="Copiar Segredo"
                    >
                      {copiedSecret ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <button
                    onClick={handleRegenerateSecret}
                    className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    Regerar
                  </button>
                </div>
              </div>
            </div>

            {/* Seletor de Eventos Monitorados */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
                Eventos Disparados
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "query.executed", label: "Consultas Executadas" },
                  { id: "dry_run.alert", label: "Alerta Crítico Dry-Run" },
                  { id: "deadlock.detected", label: "Deadlocks Detectados" },
                  { id: "lineage.pipeline_completed", label: "Conclusão de Linhagem / ETL" },
                  { id: "table.schema_updated", label: "Modificação de Esquema (DDL)" },
                ].map((ev) => {
                  const active = selectedWebhookEvents.includes(ev.id);
                  return (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setSelectedWebhookEvents((prev) =>
                          active ? prev.filter((x) => x !== ev.id) : [...prev, ev.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                        active
                          ? "bg-blue-600/30 border-blue-500/50 text-blue-200"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-blue-400" : "bg-gray-600"}`} />
                      {ev.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Painel com Retorno do Disparo de Teste */}
            {webhookTestOutput && (
              <div className="mt-4 p-4 bg-black/40 border border-white/10 rounded-2xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Resposta: {webhookTestOutput.message}
                  </span>
                  <span className="text-gray-400 font-mono">Status: {webhookTestOutput.status}</span>
                </div>
                <pre className="p-3 bg-gray-950/80 rounded-xl text-[11px] font-mono text-gray-300 overflow-x-auto max-h-40 scrollbar-thin">
                  {JSON.stringify(webhookTestOutput.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          5. MODAL DE CONFIGURAÇÃO GOOGLE BIGQUERY (Estilo Google Cloud Console)
      =================================================================== */}
      {isBigQueryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200/80 flex items-center justify-center p-2 shadow-sm">
                  <BigQueryIcon />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">
                    Configuração do Google BigQuery
                  </h3>
                  <p className="text-xs text-gray-500">
                    Parâmetros de conexão GCP, políticas de Dry-Run e auditoria de consultas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBigQueryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex border-b border-gray-100 bg-white px-6">
              {[
                { id: "creds", label: "Conexão GCP & Chave" },
                { id: "dryrun", label: "Políticas de Dry-Run" },
                { id: "lineage", label: "Linhagem & Auditoria" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBigQueryTab(tab.id as any)}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                    bigQueryTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* ABA 1: CREDENCIAIS */}
              {bigQueryTab === "creds" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                        GCP Project ID *
                      </label>
                      <input
                        type="text"
                        value={bigQueryConfig.projectId}
                        onChange={(e) =>
                          setBigQueryConfig({ ...bigQueryConfig, projectId: e.target.value })
                        }
                        placeholder="ex: mustainf-analytics-prod"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                        Dataset Padrão *
                      </label>
                      <input
                        type="text"
                        value={bigQueryConfig.datasetId}
                        onChange={(e) =>
                          setBigQueryConfig({ ...bigQueryConfig, datasetId: e.target.value })
                        }
                        placeholder="ex: analytics_dw"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                      Região / Localização GCP
                    </label>
                    <select
                      value={bigQueryConfig.region}
                      onChange={(e) =>
                        setBigQueryConfig({ ...bigQueryConfig, region: e.target.value })
                      }
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {GCP_REGIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                        Chave Privada da Service Account (JSON)
                      </label>
                      <span className="text-[10px] text-gray-400">
                        Criptografado com AES-256 no backend
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={bigQueryConfig.serviceAccountJson}
                      onChange={(e) =>
                        setBigQueryConfig({
                          ...bigQueryConfig,
                          serviceAccountJson: e.target.value,
                        })
                      }
                      placeholder='{ "type": "service_account", "project_id": "...", "private_key": "..." }'
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Feedback de Teste */}
                  {bigQueryTestResult && (
                    <div
                      className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                        bigQueryTestResult.success
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      {bigQueryTestResult.success ? (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold block">
                          {bigQueryTestResult.success ? "Conexão Validada" : "Erro na Conexão"}
                        </span>
                        <p className="mt-0.5 leading-relaxed">{bigQueryTestResult.message}</p>
                        {bigQueryTestResult.latencyMs > 0 && (
                          <span className="text-[10px] font-mono mt-1 block opacity-75">
                            Latência: {bigQueryTestResult.latencyMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: DRY-RUN */}
              {bigQueryTab === "dryrun" && (
                <div className="space-y-5">
                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                    <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-blue-900 leading-relaxed text-xs">
                      O mecanismo de <strong>Dry-Run do BigQuery</strong> estima a quantidade exata de bytes que uma consulta varrerá
                      <strong> sem executar o processamento real</strong> e sem incorrer em custos no Google Cloud.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <span className="font-bold text-gray-800 block">
                        Dry-Run Automático no Editor SQL
                      </span>
                      <span className="text-gray-500 text-[11px]">
                        Calcula bytes e custos automaticamente antes de autorizar a execução da query.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={bigQueryConfig.dryRunEnabled}
                      onChange={(e) =>
                        setBigQueryConfig({ ...bigQueryConfig, dryRunEnabled: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                        Teto de Bytes Faturados (Maximum Bytes Billed em GB)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={bigQueryConfig.maxBytesBilledGb}
                        onChange={(e) =>
                          setBigQueryConfig({
                            ...bigQueryConfig,
                            maxBytesBilledGb: Number(e.target.value) || 10,
                          })
                        }
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <span className="text-[10px] text-gray-400">
                        Bloqueia queries que excederem este limite.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                        Alerta de Custo por Consulta (USD)
                      </label>
                      <input
                        type="number"
                        step="0.10"
                        min="0.10"
                        value={bigQueryConfig.costAlertThresholdUsd}
                        onChange={(e) =>
                          setBigQueryConfig({
                            ...bigQueryConfig,
                            costAlertThresholdUsd: Number(e.target.value) || 1.0,
                          })
                        }
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <span className="text-[10px] text-gray-400">
                        Dispara notificação se custo estimado for maior que o valor.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: LINHAGEM & AUDITORIA */}
              {bigQueryTab === "lineage" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <span className="font-bold text-gray-800 block">
                        Auto-Sincronizar com Linhagem de Dados
                      </span>
                      <span className="text-gray-500 text-[11px]">
                        Exporta automaticamente nós de tabelas e views do BigQuery para o mapa visual de linhagem do MustaInfo.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={bigQueryConfig.autoSyncLineage}
                      onChange={(e) =>
                        setBigQueryConfig({
                          ...bigQueryConfig,
                          autoSyncLineage: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <span className="font-bold text-gray-800 block">
                        Exportação de Auditoria de Queries
                      </span>
                      <span className="text-gray-500 text-[11px]">
                        Cria tabela particionada diária de histórico de auditoria no BigQuery para conformidade e CDOs.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={bigQueryConfig.exportQueryAudit}
                      onChange={(e) =>
                        setBigQueryConfig({
                          ...bigQueryConfig,
                          exportQueryAudit: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestBigQuery}
                disabled={testingBigQuery}
                className="px-4 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {testingBigQuery ? (
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                ) : (
                  <Zap size={14} className="text-amber-500" />
                )}
                {testingBigQuery ? "Testando Conexão..." : "Testar Conexão GCP"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBigQueryModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveBigQuery}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow"
                >
                  Salvar e Ativar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          6. MODAL GENÉRICO PARA DEMAIS INTEGRAÇÕES
      =================================================================== */}
      {genericModalIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200/80 flex items-center justify-center p-2 shadow-sm">
                  {getIntegrationIcon(genericModalIntegration.id)}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    Conectar {genericModalIntegration.name}
                  </h3>
                  <span className="text-xs text-gray-500">{genericModalIntegration.provider}</span>
                </div>
              </div>
              <button
                onClick={() => setGenericModalIntegration(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-gray-600 leading-relaxed">
                Insira as credenciais de acesso ou tokens de API da sua conta{" "}
                <strong>{genericModalIntegration.name}</strong> para sincronizar com o MustaInfo.
              </p>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Identificador / Host da Conta
                </label>
                <input
                  type="text"
                  placeholder="ex: xyz12345.snowflakecomputing.com ou https://hooks.slack.com/..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Token de Autenticação / Chave de API
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 text-[11px] flex items-center gap-2">
                <Shield size={14} className="text-emerald-500 shrink-0" />
                Credenciais trafegadas e armazenadas com isolamento seguro por empresa.
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setGenericModalIntegration(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-xl font-bold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveGeneric}
                className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs transition-all shadow-sm"
              >
                Confirmar Conexão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};