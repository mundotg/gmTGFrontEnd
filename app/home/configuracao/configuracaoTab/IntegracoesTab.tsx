"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  FileWarning,
  Trash2,
  Filter,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { hasPermission } from "@/permissions_val";
import api from "@/context/axioCuston";

/* =========================================================================
   CONFIGURAÇÕES ESTÁTICAS VIA VARIÁVEIS DE AMBIENTE (.env)
========================================================================= */

const ENV_DEFAULT_BQ_REGION =
  process.env.NEXT_PUBLIC_INTEGRATION_DEFAULT_BQ_REGION || "us-central1";
const ENV_DEFAULT_BQ_MAX_GB = Number(
  process.env.NEXT_PUBLIC_INTEGRATION_DEFAULT_BQ_MAX_GB || 10
);
const ENV_DEFAULT_BQ_COST_USD = Number(
  process.env.NEXT_PUBLIC_INTEGRATION_DEFAULT_BQ_COST_USD || 1.0
);
const ENV_DOCS_BASE_URL =
  process.env.NEXT_PUBLIC_INTEGRATION_DOCS_BASE_URL ||
  "https://cloud.google.com/bigquery/docs";
const ENV_LOGS_LIMIT = Number(
  process.env.NEXT_PUBLIC_INTEGRATION_LOGS_LIMIT || 50
);

function parseEnvRegions(raw?: string): { value: string; label: string }[] {
  const fallback =
    "us-central1:us-central1 (Iowa),us-east4:us-east4 (N. Virgínia),southamerica-east1:southamerica-east1 (São Paulo),europe-west1:europe-west1 (Bélgica),europe-west3:europe-west3 (Frankfurt),asia-east1:asia-east1 (Taiwan)";
  return (raw || fallback)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [val, label] = entry.split(":");
      return {
        value: (val || "").trim(),
        label: (label || val || "").trim(),
      };
    });
}

const STATIC_GCP_REGIONS = parseEnvRegions(
  process.env.NEXT_PUBLIC_INTEGRATION_GCP_REGIONS
);

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
  category:
    | "Data Warehouse & Cloud"
    | "Armazenamento & ETL"
    | "Comunicação & Alertas"
    | "Desenvolvimento";
  brandColor: string;
  badge?: string;
  docsUrl?: string;
  connected: boolean;
  status?: string;
  endpointUrl?: string;
  featured?: boolean;
  lastSync?: string;
  lastError?: string | null;
  errorCount?: number;
  lastLatencyMs?: number | null;
  metrics?: IntegrationMetric[];
  config?: Record<string, any>;
}

export interface BigQueryConfig {
  projectId: string;
  datasetId: string;
  region: string;
  serviceAccountJson: string;
  hasCredentials: boolean;
  clientEmail?: string | null;
  dryRunEnabled: boolean;
  maxBytesBilledGb: number;
  costAlertThresholdUsd: number;
  autoSyncLineage: boolean;
  exportQueryAudit: boolean;
  status?: string;
  lastError?: string | null;
  lastLatencyMs?: number | null;
}

export interface IntegrationLogEntry {
  id: number;
  provider: string;
  action: string;
  level: "INFO" | "WARNING" | "ERROR" | "CRITICAL" | string;
  status_code?: number | null;
  error_code?: string | null;
  endpoint_url?: string | null;
  latency_ms?: number | null;
  message: string;
  details?: Record<string, any> | null;
  created_at: string;
}

const DEFAULT_BIGQUERY_CONFIG: BigQueryConfig = {
  projectId: "",
  datasetId: "",
  region: ENV_DEFAULT_BQ_REGION,
  serviceAccountJson: "",
  hasCredentials: false,
  clientEmail: null,
  dryRunEnabled: true,
  maxBytesBilledGb: ENV_DEFAULT_BQ_MAX_GB,
  costAlertThresholdUsd: ENV_DEFAULT_BQ_COST_USD,
  autoSyncLineage: true,
  exportQueryAudit: true,
  status: "disconnected",
  lastError: null,
  lastLatencyMs: null,
};

/* =========================================================================
   ÍCONES DAS INTEGRAÇÕES
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
   COMPONENTE PRINCIPAL
========================================================================= */

export const IntegracoesTab: React.FC = () => {
  const { user } = useSession();
  const permissions = user?.permissions || [];

  const [activeCategory, setActiveCategory] = useState<IntegrationCategory>("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Regiões e configurações estáticas (carregadas do .env e sincronizadas com o backend)
  const [gcpRegions, setGcpRegions] = useState<{ value: string; label: string }[]>(
    STATIC_GCP_REGIONS
  );
  const [enforceHttps, setEnforceHttps] = useState<boolean>(true);

  // Lista de integrações (100% proveniente da base de dados)
  const [integrationsList, setIntegrationsList] = useState<IntegrationItem[]>([]);

  // Modal e Estado do BigQuery (persistido na base de dados)
  const [isBigQueryModalOpen, setIsBigQueryModalOpen] = useState(false);
  const [bigQueryTab, setBigQueryTab] = useState<"creds" | "dryrun" | "lineage">("creds");
  const [bigQueryConfig, setBigQueryConfig] = useState<BigQueryConfig>(
    DEFAULT_BIGQUERY_CONFIG
  );
  const [testingBigQuery, setTestingBigQuery] = useState(false);
  const [bigQueryTestResult, setBigQueryTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    errorCode?: string;
    message: string;
  } | null>(null);

  // Modal e Estado para demais integrações (Snowflake, Databricks, GCS, Slack, GitHub, Jira)
  const [genericModalIntegration, setGenericModalIntegration] =
    useState<IntegrationItem | null>(null);
  const [genericHost, setGenericHost] = useState("");
  const [genericToken, setGenericToken] = useState("");
  const [testingGeneric, setTestingGeneric] = useState(false);
  const [savingGeneric, setSavingGeneric] = useState(false);
  const [genericTestResult, setGenericTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    statusCode?: number;
    errorCode?: string;
    resolvedEndpoint?: string;
    message: string;
  } | null>(null);

  // Estado de Webhooks (persistido na base de dados)
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [webhookSecret, setWebhookSecret] = useState<string>("");
  const [webhookLastError, setWebhookLastError] = useState<string | null>(null);
  const [webhookLastTriggered, setWebhookLastTriggered] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [sendingTestWebhook, setSendingTestWebhook] = useState(false);
  const [webhookTestOutput, setWebhookTestOutput] = useState<{
    status: number;
    success: boolean;
    errorCode?: string;
    message: string;
    payload: any;
  } | null>(null);
  const [selectedWebhookEvents, setSelectedWebhookEvents] = useState<string[]>([
    "query.executed",
    "dry_run.alert",
    "deadlock.detected",
    "lineage.pipeline_completed",
  ]);

  // Estado dos Logs de Integrações na Base de Dados
  const [integrationLogs, setIntegrationLogs] = useState<IntegrationLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logLevelFilter, setLogLevelFilter] = useState<string>("ALL");
  const [logProviderFilter, setLogProviderFilter] = useState<string>("all");

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

  const fetchIntegrationLogs = useCallback(
    async (level = logLevelFilter, provider = logProviderFilter) => {
      setLoadingLogs(true);
      try {
        const params = new URLSearchParams();
        if (level && level !== "ALL") params.set("level", level);
        if (provider && provider !== "all") params.set("provider", provider);
        params.set("limit", String(ENV_LOGS_LIMIT));

        const res = await api.get(`/integrations/logs?${params.toString()}`);
        if (Array.isArray(res.data)) {
          setIntegrationLogs(res.data);
        }
      } catch (err) {
        console.warn("Falha ao carregar logs de integrações da BD:", err);
      } finally {
        setLoadingLogs(false);
      }
    },
    [logLevelFilter, logProviderFilter]
  );

  const loadAllFromDatabase = useCallback(async () => {
    setLoadingInitial(true);
    try {
      const [resStatic, resList, resBq, resWh] = await Promise.all([
        api.get("/integrations/static-config").catch(() => null),
        api.get("/integrations/").catch(() => null),
        api.get("/integrations/bigquery").catch(() => null),
        api.get("/integrations/webhooks").catch(() => null),
      ]);

      if (resStatic?.data) {
        if (
          Array.isArray(resStatic.data.gcp_regions) &&
          resStatic.data.gcp_regions.length > 0
        ) {
          setGcpRegions(resStatic.data.gcp_regions);
        }
        if (typeof resStatic.data.enforce_https === "boolean") {
          setEnforceHttps(resStatic.data.enforce_https);
        }
      }

      if (Array.isArray(resList?.data)) {
        const mapped: IntegrationItem[] = resList.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          provider: r.provider,
          description: r.description || "",
          category: (r.category as any) || "Data Warehouse & Cloud",
          brandColor: r.brand_color || "#4285F4",
          badge: r.badge || undefined,
          docsUrl: r.docs_url || ENV_DOCS_BASE_URL,
          connected: Boolean(r.connected),
          status: r.status || (r.connected ? "connected" : "disconnected"),
          endpointUrl: r.endpoint_url || undefined,
          featured: Boolean(r.featured),
          lastSync: r.last_sync || undefined,
          lastError: r.last_error || null,
          errorCount: r.error_count || 0,
          lastLatencyMs: r.last_latency_ms ?? null,
          metrics: Array.isArray(r.metrics) ? r.metrics : [],
          config: r.config || {},
        }));
        setIntegrationsList(mapped);
      }

      if (resBq?.data) {
        const bq = resBq.data;
        setBigQueryConfig((prev) => ({
          ...prev,
          projectId: bq.project_id || "",
          datasetId: bq.dataset_id || "",
          region: bq.region || ENV_DEFAULT_BQ_REGION,
          hasCredentials: Boolean(bq.has_credentials),
          clientEmail: bq.client_email || null,
          dryRunEnabled: bq.dry_run_enabled ?? true,
          maxBytesBilledGb: bq.max_bytes_billed_gb ?? ENV_DEFAULT_BQ_MAX_GB,
          costAlertThresholdUsd:
            bq.cost_alert_threshold_usd ?? ENV_DEFAULT_BQ_COST_USD,
          autoSyncLineage: bq.auto_sync_lineage ?? true,
          exportQueryAudit: bq.export_query_audit ?? true,
          status: bq.status || "disconnected",
          lastError: bq.last_error || null,
          lastLatencyMs: bq.last_latency_ms ?? null,
        }));
      }

      if (resWh?.data) {
        const wh = resWh.data;
        setWebhookUrl(wh.url || "");
        setWebhookSecret(wh.secret || "");
        setWebhookLastError(wh.last_error || null);
        setWebhookLastTriggered(wh.last_triggered_at || null);
        if (Array.isArray(wh.events) && wh.events.length > 0) {
          setSelectedWebhookEvents(wh.events);
        }
      }

      await fetchIntegrationLogs();
    } finally {
      setLoadingInitial(false);
    }
  }, [fetchIntegrationLogs]);

  useEffect(() => {
    loadAllFromDatabase();
  }, [loadAllFromDatabase]);

  useEffect(() => {
    fetchIntegrationLogs(logLevelFilter, logProviderFilter);
  }, [logLevelFilter, logProviderFilter, fetchIntegrationLogs]);

  // Filtragem de integrações
  const filteredIntegrations = useMemo(() => {
    return integrationsList.filter((item) => {
      const matchesCategory =
        activeCategory === "Todas" || item.category === activeCategory;
      const matchesSearch =
        searchTerm.trim() === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.provider.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [integrationsList, activeCategory, searchTerm]);

  const openGenericModal = (item: IntegrationItem) => {
    setGenericModalIntegration(item);
    setGenericHost(item.config?.host || item.endpointUrl || "");
    setGenericToken("");
    setGenericTestResult(null);
  };

  // Toggle Conectar / Desconectar
  const handleToggle = async (item: IntegrationItem) => {
    if (item.connected) {
      const ok = window.confirm(
        `Desconectar a integração "${item.name}" na base de dados?`
      );
      if (!ok) return;
    } else {
      if (item.id === "bigquery") {
        setBigQueryTestResult(null);
        setIsBigQueryModalOpen(true);
        return;
      }
      openGenericModal(item);
      return;
    }

    try {
      setLoadingId(item.id);
      await api.post(`/integrations/toggle?provider=${item.id}&active=false`);
      await loadAllFromDatabase();
      setFeedbackMsg({
        text: `Integração "${item.name}" foi desconectada e registada na base de dados.`,
        type: "info",
      });
    } catch (e: any) {
      setFeedbackMsg({
        text: `Erro ao desconectar ${item.name}: ${
          e?.response?.data?.detail || e?.message || "Erro desconhecido"
        }`,
        type: "error",
      });
      await fetchIntegrationLogs();
    } finally {
      setLoadingId(null);
    }
  };

  // Testar Conexão BigQuery
  const handleTestBigQuery = async () => {
    setTestingBigQuery(true);
    setBigQueryTestResult(null);

    try {
      const res = await api.post("/integrations/bigquery/test", {
        project_id: bigQueryConfig.projectId,
        dataset_id: bigQueryConfig.datasetId,
        region: bigQueryConfig.region,
        service_account_json: bigQueryConfig.serviceAccountJson || undefined,
      });

      const data = res.data;
      setBigQueryTestResult({
        success: Boolean(data.success),
        latencyMs: data.latency_ms || 0,
        errorCode: data.error_code,
        message: data.message,
      });
      await fetchIntegrationLogs();
    } catch (e: any) {
      setBigQueryTestResult({
        success: false,
        latencyMs: 0,
        errorCode: "REQUEST_FAILED",
        message:
          e?.response?.data?.detail ||
          e?.message ||
          "Falha ao validar credenciais do Google BigQuery.",
      });
      await fetchIntegrationLogs();
    } finally {
      setTestingBigQuery(false);
    }
  };

  // Salvar Configurações do BigQuery na Base de Dados
  const handleSaveBigQuery = async () => {
    try {
      await api.post("/integrations/bigquery", {
        project_id: bigQueryConfig.projectId,
        dataset_id: bigQueryConfig.datasetId,
        region: bigQueryConfig.region,
        service_account_json: bigQueryConfig.serviceAccountJson || undefined,
        dry_run_enabled: bigQueryConfig.dryRunEnabled,
        max_bytes_billed_gb: bigQueryConfig.maxBytesBilledGb,
        cost_alert_threshold_usd: bigQueryConfig.costAlertThresholdUsd,
        auto_sync_lineage: bigQueryConfig.autoSyncLineage,
        export_query_audit: bigQueryConfig.exportQueryAudit,
      });

      setIsBigQueryModalOpen(false);
      await loadAllFromDatabase();
      setFeedbackMsg({
        text: "Configuração do Google BigQuery validada e salva na base de dados!",
        type: "success",
      });
    } catch (e: any) {
      const errDetail =
        e?.response?.data?.detail || e?.message || "Falha ao salvar no servidor";
      setBigQueryTestResult({
        success: false,
        latencyMs: 0,
        errorCode: "VALIDATION_ERROR",
        message: errDetail,
      });
      await fetchIntegrationLogs();
    }
  };

  // Testar Conectividade de Provedor Genérico (RFC 3986 / RFC 9110 / SSRF)
  const handleTestGeneric = async () => {
    if (!genericModalIntegration) return;
    setTestingGeneric(true);
    setGenericTestResult(null);

    try {
      const res = await api.post("/integrations/generic/test", {
        provider: genericModalIntegration.id,
        host: genericHost,
        token: genericToken || undefined,
      });
      const data = res.data;
      setGenericTestResult({
        success: Boolean(data.success),
        latencyMs: data.latency_ms || 0,
        statusCode: data.status_code,
        errorCode: data.error_code,
        resolvedEndpoint: data.resolved_endpoint,
        message: data.message,
      });
      await fetchIntegrationLogs();
    } catch (e: any) {
      setGenericTestResult({
        success: false,
        latencyMs: 0,
        errorCode: "NETWORK_ERROR",
        message:
          e?.response?.data?.detail ||
          e?.message ||
          "Erro ao testar conectividade com o provedor.",
      });
      await fetchIntegrationLogs();
    } finally {
      setTestingGeneric(false);
    }
  };

  // Salvar Configuração Genérica na Base de Dados
  const handleSaveGeneric = async () => {
    if (!genericModalIntegration) return;
    setSavingGeneric(true);

    try {
      await api.post("/integrations/generic", {
        provider: genericModalIntegration.id,
        name: genericModalIntegration.name,
        category: genericModalIntegration.category,
        config: { host: genericHost },
        credentials: genericToken ? { token: genericToken } : undefined,
        verify_connection: true,
      });

      const savedName = genericModalIntegration.name;
      setGenericModalIntegration(null);
      setGenericHost("");
      setGenericToken("");
      setGenericTestResult(null);
      await loadAllFromDatabase();

      setFeedbackMsg({
        text: `Integração "${savedName}" validada e registada na base de dados com sucesso!`,
        type: "success",
      });
    } catch (e: any) {
      const errDetail =
        e?.response?.data?.detail || e?.message || "Erro na validação da integração";
      setGenericTestResult({
        success: false,
        latencyMs: 0,
        errorCode: "SAVE_REJECTED",
        message: errDetail,
      });
      await fetchIntegrationLogs();
    } finally {
      setSavingGeneric(false);
    }
  };

  // Sincronizar Tudo
  const handleSyncAll = async () => {
    setSyncingAll(true);
    setFeedbackMsg(null);
    try {
      const res = await api.post("/integrations/sync-all");
      await loadAllFromDatabase();
      const errCount = res.data?.errors_count || 0;
      if (errCount > 0) {
        setFeedbackMsg({
          text: `Sincronização concluída com ${errCount} erro(s) de conectividade. Verifique a tabela de logs abaixo.`,
          type: "error",
        });
      } else {
        setFeedbackMsg({
          text: `Todas as integrações ativas (${res.data?.synced_count || 0}) foram verificadas e sincronizadas com sucesso.`,
          type: "success",
        });
      }
    } catch (e: any) {
      setFeedbackMsg({
        text: `Falha na sincronização: ${
          e?.response?.data?.detail || e?.message || "Erro no servidor"
        }`,
        type: "error",
      });
      await fetchIntegrationLogs();
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
      text: "Novo segredo HMAC gerado. Clique em 'Salvar' para persistir na base de dados.",
      type: "info",
    });
  };

  // Salvar Webhook na Base de Dados
  const handleSaveWebhook = async () => {
    try {
      await api.post("/integrations/webhooks", {
        url: webhookUrl,
        secret: webhookSecret,
        events: selectedWebhookEvents,
        is_active: true,
      });
      await loadAllFromDatabase();
      setFeedbackMsg({
        text: "Configuração do Webhook validada (RFC 3986 / HTTPS) e salva na base de dados.",
        type: "success",
      });
    } catch (e: any) {
      setFeedbackMsg({
        text: `Erro ao salvar Webhook: ${
          e?.response?.data?.detail || e?.message || "Falha na validação"
        }`,
        type: "error",
      });
      await fetchIntegrationLogs();
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
        success: Boolean(data.success),
        errorCode: data.error_code,
        message: data.message,
        payload: data.payload,
      });
      await loadAllFromDatabase();
    } catch (e: any) {
      setWebhookTestOutput({
        status: e?.response?.status || 502,
        success: false,
        errorCode: "WEBHOOK_TEST_ERROR",
        message:
          e?.response?.data?.detail ||
          e?.message ||
          "Falha ao disparar evento de teste para o Webhook.",
        payload: {},
      });
      await fetchIntegrationLogs();
    } finally {
      setSendingTestWebhook(false);
    }
  };

  // Limpar Logs de Integrações
  const handleClearLogs = async () => {
    try {
      await api.delete(
        `/integrations/logs${
          logProviderFilter !== "all" ? `?provider=${logProviderFilter}` : ""
        }`
      );
      await fetchIntegrationLogs();
      setFeedbackMsg({
        text: "Histórico de logs de integrações limpo na base de dados.",
        type: "info",
      });
    } catch (e: any) {
      setFeedbackMsg({
        text: `Não foi possível limpar os logs: ${
          e?.response?.data?.detail || e?.message
        }`,
        type: "error",
      });
    }
  };

  const totalErrorLogs = useMemo(
    () =>
      integrationLogs.filter(
        (l) => l.level === "ERROR" || l.level === "CRITICAL"
      ).length,
    [integrationLogs]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* ===================================================================
          1. HEADER & STATUS GLOBAL (Persistência em Base de Dados & Normas RFC)
      =================================================================== */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center flex-wrap gap-2.5">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full inline-flex items-center gap-1.5">
                <Sparkles size={13} className="text-blue-600" />
                Data & Cloud Integrations
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" />
                {enforceHttps ? "RFC 9110 HTTPS/TLS & Anti-SSRF Ativo" : "RFC 3986 URI Validated"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Central de Integrações e Data Warehouses
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Todas as credenciais, endpoints, métricas e logs de erros são persistidos na base de dados PostgreSQL e validados segundo as normas da Internet (RFC 3986, RFC 9110 TLS e proteção OWASP SSRF).
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={handleSyncAll}
              disabled={syncingAll || loadingInitial}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm hover:shadow disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncingAll ? "animate-spin text-blue-600" : ""} />
              {syncingAll ? "Verificando..." : "Sincronizar Todos"}
            </button>
            {canManage && (
              <button
                onClick={() => {
                  setBigQueryTestResult(null);
                  setIsBigQueryModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm hover:shadow-md"
              >
                <Sliders size={14} />
                Configurar BigQuery
              </button>
            )}
          </div>
        </div>

        {/* 4 Cards de Métricas no Topo (Dados Reais da BD) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
          <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Serviços Conectados (BD)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-gray-900">
                {integrationsList.filter((i) => i.connected).length}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                de {integrationsList.length}
              </span>
            </div>
          </div>

          <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Google BigQuery Dry-Run
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  bigQueryConfig.dryRunEnabled ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                }`}
              />
              <span className="text-sm font-bold text-gray-800">
                {bigQueryConfig.dryRunEnabled
                  ? `Limite ${bigQueryConfig.maxBytesBilledGb} GB`
                  : "Inativo"}
              </span>
            </div>
          </div>

          <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Erros Registados (Logs)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`text-xl font-bold ${
                  totalErrorLogs > 0 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {totalErrorLogs}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                em {integrationLogs.length} eventos
              </span>
            </div>
          </div>

          <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Webhooks & Alertas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-bold text-gray-800">
                {webhookUrl ? "Configurado" : "Não Configurado"}
              </span>
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              "Todas",
              "Data Warehouse & Cloud",
              "Armazenamento & ETL",
              "Comunicação & Alertas",
              "Desenvolvimento",
            ] as IntegrationCategory[]
          ).map((cat) => (
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
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Buscar integração..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
          <Activity
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
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
          3. GRID DE INTEGRAÇÕES (PERSISTIDAS NA BASE DE DADOS)
      =================================================================== */}
      {loadingInitial ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 flex items-center justify-center gap-3 text-sm text-gray-500">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          Carregando catálogo e estado das integrações da base de dados...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredIntegrations.map((app) => {
            const isBQ = app.id === "bigquery";
            const hasError = app.status === "error" || Boolean(app.lastError);

            return (
              <div
                key={app.id}
                className={`group bg-white border rounded-2xl p-6 transition-all duration-200 hover:shadow-xl hover:shadow-gray-100 flex flex-col justify-between relative overflow-hidden ${
                  hasError
                    ? "border-red-300 ring-1 ring-red-100"
                    : app.connected
                      ? isBQ
                        ? "border-blue-300 ring-1 ring-blue-100"
                        : "border-emerald-300"
                      : "border-gray-200"
                }`}
              >
                {isBQ && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                )}

                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-13 h-13 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm group-hover:scale-105 transition-transform shrink-0 p-2.5">
                        {getIntegrationIcon(app.id)}
                      </div>
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="font-bold text-gray-900 text-base">
                            {app.name}
                          </h3>
                          {app.badge && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {app.badge}
                            </span>
                          )}
                          {hasError && (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              Erro ({app.errorCount || 1})
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-400 block mt-0.5">
                          {app.provider}
                        </span>
                      </div>
                    </div>

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

                  <p className="text-xs text-gray-600 mt-4 leading-relaxed">
                    {app.description}
                  </p>

                  {/* Alerta de Último Erro Registado na Base de Dados */}
                  {app.lastError && (
                    <div className="mt-3 p-2.5 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-2 text-[11px] text-red-800">
                      <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{app.lastError}</span>
                    </div>
                  )}

                  {/* Métricas Reais Persistidas */}
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

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        hasError
                          ? "bg-red-500 animate-pulse"
                          : app.connected
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-gray-300"
                      }`}
                    />
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {hasError
                        ? "Falha de Conexão"
                        : app.connected
                          ? "Serviço Ativo"
                          : "Não Vinculado"}
                    </span>
                    {app.lastSync && (
                      <span className="text-[11px] text-gray-400 hidden sm:inline">
                        • {app.lastSync}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isBQ ? (
                      <button
                        onClick={() => {
                          setBigQueryTestResult(null);
                          setIsBigQueryModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Sliders size={13} />
                        Ajustar Parâmetros
                      </button>
                    ) : (
                      <button
                        onClick={() => openGenericModal(app)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Settings size={13} />
                        Configurar
                      </button>
                    )}

                    {app.docsUrl && (
                      <a
                        href={app.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Documentação oficial do protocolo/API"
                        className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================
          4. SEÇÃO AVANÇADA DE WEBHOOKS & EVENTOS (HMAC SHA-256 & Anti-SSRF)
      =================================================================== */}
      {canManageWebhooks && (
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-gray-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold tracking-widest uppercase border border-blue-400/20">
                  <Globe size={13} /> Webhooks & Eventos de Saída (RFC 9110)
                </div>
                <h3 className="text-2xl font-bold tracking-tight">
                  Barramento de Notificações em Tempo Real
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm max-w-xl leading-relaxed">
                  Dispare eventos assinados com HMAC SHA-256 e proteção anti-replay (`X-MustaInfo-Timestamp`). Endpoints são validados contra SSRF e requerem HTTPS.
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

            {webhookLastError && (
              <div className="p-3.5 bg-red-500/10 border border-red-400/30 rounded-xl flex items-center justify-between text-xs text-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-400 shrink-0" />
                  <span>Último erro de entrega: {webhookLastError}</span>
                </div>
                {webhookLastTriggered && (
                  <span className="text-[11px] text-red-300/70 font-mono">
                    {webhookLastTriggered}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Endpoint URL de Destino (HTTPS)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/... ou seu endpoint HTTPS"
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
                      {copiedSecret ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
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

            <div className="pt-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
                Eventos Subscritos
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
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          active ? "bg-blue-400" : "bg-gray-600"
                        }`}
                      />
                      {ev.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {webhookTestOutput && (
              <div
                className={`mt-4 p-4 border rounded-2xl space-y-2 animate-in fade-in ${
                  webhookTestOutput.success
                    ? "bg-black/40 border-emerald-500/30"
                    : "bg-red-950/30 border-red-500/40"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span
                    className={`flex items-center gap-1.5 ${
                      webhookTestOutput.success ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {webhookTestOutput.success ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <AlertTriangle size={14} />
                    )}
                    {webhookTestOutput.message}
                  </span>
                  <span className="text-gray-400 font-mono">
                    HTTP {webhookTestOutput.status}{" "}
                    {webhookTestOutput.errorCode ? `(${webhookTestOutput.errorCode})` : ""}
                  </span>
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
          5. TABELA DE LOGS DE ERROS & AUDITORIA DE INTEGRAÇÕES (BD)
      =================================================================== */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileWarning size={18} className="text-gray-800" />
              <h3 className="text-base font-extrabold text-gray-900">
                Registo de Logs e Erros de Integrações (Base de Dados)
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Histórico persistido na tabela <code className="text-gray-700 font-mono">integration_logs</code> com diagnósticos de rede, falhas de autenticação, bloqueios SSRF e violações RFC.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro de Severidade */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              {["ALL", "ERROR", "INFO"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLogLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    logLevelFilter === lvl
                      ? lvl === "ERROR"
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {lvl === "ALL" ? "Todos" : lvl}
                </button>
              ))}
            </div>

            {/* Filtro de Provedor */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1">
              <Filter size={12} className="text-gray-400" />
              <select
                value={logProviderFilter}
                onChange={(e) => setLogProviderFilter(e.target.value)}
                className="text-xs text-gray-700 font-medium bg-transparent outline-none"
              >
                <option value="all">Todos os Provedores</option>
                <option value="bigquery">Google BigQuery</option>
                <option value="snowflake">Snowflake</option>
                <option value="databricks">Databricks</option>
                <option value="gcs">Google Cloud Storage</option>
                <option value="slack">Slack</option>
                <option value="github">GitHub</option>
                <option value="jira">Jira</option>
                <option value="webhook">Webhooks</option>
              </select>
            </div>

            <button
              onClick={() => fetchIntegrationLogs()}
              disabled={loadingLogs}
              className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-colors"
              title="Atualizar logs"
            >
              <RefreshCw size={14} className={loadingLogs ? "animate-spin" : ""} />
            </button>

            {canManage && integrationLogs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/60 rounded-xl text-xs font-bold transition-colors"
                title="Limpar histórico de logs"
              >
                <Trash2 size={13} />
                Limpar
              </button>
            )}
          </div>
        </div>

        {integrationLogs.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-400">
            Nenhum evento ou erro de integração registado para o filtro selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Nível</th>
                  <th className="py-2.5 px-3">Provedor</th>
                  <th className="py-2.5 px-3">Ação</th>
                  <th className="py-2.5 px-3">Código Norma / HTTP</th>
                  <th className="py-2.5 px-3">Latência</th>
                  <th className="py-2.5 px-3">Mensagem / Diagnóstico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {integrationLogs.map((log) => {
                  const isErr = log.level === "ERROR" || log.level === "CRITICAL";
                  return (
                    <tr
                      key={log.id}
                      className={isErr ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-gray-50/80"}
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {log.created_at}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            isErr
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {log.level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-gray-800 uppercase text-[11px]">
                        {log.provider}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <span
                          className={
                            isErr ? "text-red-700 font-semibold" : "text-gray-600"
                          }
                        >
                          {log.error_code || (log.status_code ? `HTTP_${log.status_code}` : "-")}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">
                        {log.latency_ms != null ? `${log.latency_ms}ms` : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700 max-w-md">
                        <div className="font-medium">{log.message}</div>
                        {log.endpoint_url && (
                          <div className="text-[10px] font-mono text-gray-400 truncate mt-0.5">
                            Endpoint: {log.endpoint_url}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================
          6. MODAL DE CONFIGURAÇÃO GOOGLE BIGQUERY
      =================================================================== */}
      {isBigQueryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
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
                    Parâmetros de conexão GCP, políticas de Dry-Run e auditoria persistidos na base de dados.
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

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
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
                          setBigQueryConfig({
                            ...bigQueryConfig,
                            projectId: e.target.value,
                          })
                        }
                        placeholder="ex: meu-projeto-analytics-01"
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
                          setBigQueryConfig({
                            ...bigQueryConfig,
                            datasetId: e.target.value,
                          })
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
                        setBigQueryConfig({
                          ...bigQueryConfig,
                          region: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {gcpRegions.map((r) => (
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
                        {bigQueryConfig.hasCredentials
                          ? `Credencial ativa (${bigQueryConfig.clientEmail || "configurada"})`
                          : "Obrigatório na primeira ativação"}
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
                      placeholder='{"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "...@...iam.gserviceaccount.com"}'
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {bigQueryTestResult && (
                    <div
                      className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                        bigQueryTestResult.success
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      {bigQueryTestResult.success ? (
                        <CheckCircle2
                          size={16}
                          className="text-emerald-600 shrink-0 mt-0.5"
                        />
                      ) : (
                        <AlertTriangle
                          size={16}
                          className="text-red-600 shrink-0 mt-0.5"
                        />
                      )}
                      <div>
                        <span className="font-bold block">
                          {bigQueryTestResult.success
                            ? "Conexão Validada"
                            : `Erro na Validação (${bigQueryTestResult.errorCode || "ERROR"})`}
                        </span>
                        <p className="mt-0.5 leading-relaxed">
                          {bigQueryTestResult.message}
                        </p>
                        {bigQueryTestResult.latencyMs > 0 && (
                          <span className="text-[10px] font-mono mt-1 block opacity-75">
                            Latência HTTPS: {bigQueryTestResult.latencyMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {bigQueryTab === "dryrun" && (
                <div className="space-y-5">
                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                    <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-blue-900 leading-relaxed text-xs">
                      O mecanismo de <strong>Dry-Run do BigQuery</strong> estima a quantidade exata de bytes que uma consulta varrerá
                      <strong> sem executar o processamento real</strong>.
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
                        setBigQueryConfig({
                          ...bigQueryConfig,
                          dryRunEnabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                        Teto de Bytes Faturados (GB)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={bigQueryConfig.maxBytesBilledGb}
                        onChange={(e) =>
                          setBigQueryConfig({
                            ...bigQueryConfig,
                            maxBytesBilledGb:
                              Number(e.target.value) || ENV_DEFAULT_BQ_MAX_GB,
                          })
                        }
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
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
                            costAlertThresholdUsd:
                              Number(e.target.value) || ENV_DEFAULT_BQ_COST_USD,
                          })
                        }
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {bigQueryTab === "lineage" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <span className="font-bold text-gray-800 block">
                        Auto-Sincronizar com Linhagem de Dados
                      </span>
                      <span className="text-gray-500 text-[11px]">
                        Exporta automaticamente nós de tabelas e views do BigQuery para o mapa visual de linhagem.
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
                        Mantém histórico de auditoria das consultas analíticas na base de dados.
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
                  Salvar na Base de Dados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          7. MODAL PARA DEMAIS INTEGRAÇÕES (COM TESTE RFC / HTTPS / SSRF)
      =================================================================== */}
      {genericModalIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200/80 flex items-center justify-center p-2 shadow-sm">
                  {getIntegrationIcon(genericModalIntegration.id)}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    Configurar {genericModalIntegration.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {genericModalIntegration.provider}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setGenericModalIntegration(null);
                  setGenericHost("");
                  setGenericToken("");
                  setGenericTestResult(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-gray-600 leading-relaxed">
                Informe o endpoint HTTPS real e o token de autenticação para{" "}
                <strong>{genericModalIntegration.name}</strong>. O backend validará o domínio (RFC 3986 / RFC 1123), o certificado TLS (RFC 9110) e a proteção anti-SSRF antes de gravar na base de dados.
              </p>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Endpoint HTTPS / Host da Conta *
                </label>
                <input
                  type="text"
                  value={genericHost}
                  onChange={(e) => setGenericHost(e.target.value)}
                  placeholder={
                    genericModalIntegration.endpointUrl ||
                    "https://api.github.com"
                  }
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Token de Autenticação / Bearer API Key
                </label>
                <input
                  type="password"
                  value={genericToken}
                  onChange={(e) => setGenericToken(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {genericTestResult && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                    genericTestResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  {genericTestResult.success ? (
                    <CheckCircle2
                      size={16}
                      className="text-emerald-600 shrink-0 mt-0.5"
                    />
                  ) : (
                    <AlertTriangle
                      size={16}
                      className="text-red-600 shrink-0 mt-0.5"
                    />
                  )}
                  <div className="space-y-0.5">
                    <span className="font-bold block">
                      {genericTestResult.success
                        ? "Conectividade HTTPS Validada"
                        : `Falha (${genericTestResult.errorCode || "ERROR"})`}
                    </span>
                    <p className="leading-relaxed">{genericTestResult.message}</p>
                    {genericTestResult.latencyMs > 0 && (
                      <span className="text-[10px] font-mono block opacity-75">
                        Latência: {genericTestResult.latencyMs}ms
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 text-[11px] flex items-center gap-2">
                <Shield size={14} className="text-emerald-500 shrink-0" />
                Registo persistido em PostgreSQL (`empresa_integrations` e `integration_logs`).
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleTestGeneric}
                disabled={testingGeneric || savingGeneric}
                className="px-3.5 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {testingGeneric ? (
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                ) : (
                  <Zap size={14} className="text-amber-500" />
                )}
                {testingGeneric ? "Testando..." : "Testar Endpoint"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGenericModalIntegration(null);
                    setGenericHost("");
                    setGenericToken("");
                    setGenericTestResult(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveGeneric}
                  disabled={savingGeneric}
                  className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingGeneric && <Loader2 size={13} className="animate-spin" />}
                  Confirmar e Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
