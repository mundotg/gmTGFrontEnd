import type { Axios } from "axios";

export type MustaLinkOS = "windows" | "linux" | "darwin";
export type MustaLinkArch = "amd64" | "arm64";

/**
 * URL base do MinIO para os pacotes de instalação do MustaLink, lida do `.env`
 * (`NEXT_PUBLIC_MUSTA_LINK_MINIO_URL`).
 */
export const MUSTA_LINK_MINIO_BASE_URL = (
  process.env.NEXT_PUBLIC_MUSTA_LINK_MINIO_URL ||
  "https://s3.mustainfo.cloud/meu-bucket/releases/musta-link"
).replace(/\/+$/, "");

export interface MustaLinkAgent {
  agent_id: string;
  target_db: string;
  platform?: string;
  version?: string;
  connected_at: string;
  active_streams: number;
  total_connections_handled: number;
  virtual_host: string;
  local_relay_port: number;
}

export interface MustaLinkStatusResponse {
  connected: boolean;
  count: number;
  agents: MustaLinkAgent[];
  environment?: "development" | "production" | string;
  relay_url?: string;
}

export interface MustaLinkTokenResponse {
  agent_id: string;
  virtual_host: string;
  expires_days: number;
  token: string;
}

export interface MustaLinkPairingCodeResponse {
  code: string;
  agent_id: string;
  target_db: string;
  virtual_host: string;
  expires_at: string;
}

export interface MustaLinkRelease {
  os: MustaLinkOS;
  arch: MustaLinkArch;
  filename: string;
  size_bytes: number;
  sha256?: string;
  binary_sha?: string;
  installer?: string;
  version: string;
  minio_key?: string;
  download_url?: string;
}

export interface MustaLinkReleasesResponse {
  version: string;
  minio_base_url?: string;
  releases: MustaLinkRelease[];
}

export interface MustaLinkRevokeResponse {
  agent_id: string;
  revoked: boolean;
  disconnected_active_session: boolean;
}

/**
 * Constrói a URL direta do ficheiro `.zip` no MinIO a partir da variável de ambiente
 * `NEXT_PUBLIC_MUSTA_LINK_MINIO_URL` (ou do `download_url` retornado pelo backend).
 */
export function getMustaLinkMinioUrl(
  os: MustaLinkOS,
  arch: MustaLinkArch,
  release?: MustaLinkRelease | null,
  customBaseUrl?: string
): string {
  if (release?.download_url) {
    return release.download_url;
  }
  const base = (customBaseUrl || MUSTA_LINK_MINIO_BASE_URL).replace(/\/+$/, "");
  const filename = release?.filename || `musta-link-${os}-${arch}.zip`;
  return `${base}/${filename}`;
}

export async function getMustaLinkStatus(
  api: Axios
): Promise<MustaLinkStatusResponse> {
  const { data } = await api.get<MustaLinkStatusResponse>(
    "/conn/agent-tunnel/status",
    { withCredentials: true }
  );
  return data;
}

export async function getMustaLinkReleases(
  api: Axios
): Promise<MustaLinkReleasesResponse> {
  const { data } = await api.get<MustaLinkReleasesResponse>(
    "/conn/agent-tunnel/releases",
    { withCredentials: true }
  );
  return data;
}

export async function createMustaLinkPairingCode(
  api: Axios,
  agentId: string,
  targetDb: string = "127.0.0.1:5432",
  expiresDays: number = 30
): Promise<MustaLinkPairingCodeResponse> {
  const { data } = await api.post<MustaLinkPairingCodeResponse>(
    "/conn/agent-tunnel/pairing-code",
    JSON.stringify({
      agent_id: agentId.trim() || "luanda-pg-01",
      target_db: targetDb.trim() || "127.0.0.1:5432",
      expires_days: expiresDays,
    }),
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    }
  );
  return data;
}

export async function createMustaLinkToken(
  api: Axios,
  agentId: string,
  expiresDays: number = 30
): Promise<MustaLinkTokenResponse> {
  const { data } = await api.post<MustaLinkTokenResponse>(
    "/conn/agent-tunnel/token",
    JSON.stringify({
      agent_id: agentId.trim() || "default",
      expires_days: expiresDays,
    }),
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    }
  );
  return data;
}

export async function downloadMustaLinkPackage(
  api: Axios,
  os: MustaLinkOS,
  arch: MustaLinkArch,
  release?: MustaLinkRelease | null
): Promise<void> {
  const minioUrl = getMustaLinkMinioUrl(os, arch, release);

  // 1. Se NEXT_PUBLIC_MUSTA_LINK_MINIO_URL (ou download_url do MinIO) está definido,
  // tenta transferir a partir do MinIO; se o bucket estiver inacessível, faz fallback para o backend.
  if (minioUrl) {
    try {
      const res = await fetch(minioUrl, { method: "GET" });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `musta-link-${os}-${arch}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fallback automático para a rota do backend se o MinIO bloquear CORS ou estiver offline
    }
  }

  const response = await api.get<Blob>("/conn/agent-tunnel/download", {
    params: { os, arch },
    responseType: "blob",
    withCredentials: true,
  });

  const blob = new Blob([response.data], { type: "application/zip" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `musta-link-${os}-${arch}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function revokeMustaLinkAgent(
  api: Axios,
  agentId: string
): Promise<MustaLinkRevokeResponse> {
  const { data } = await api.delete<MustaLinkRevokeResponse>(
    `/conn/agent-tunnel/${encodeURIComponent(agentId.trim())}`,
    { withCredentials: true }
  );
  return data;
}
