// app/nexus-cognitiva/services/nexusUrl.ts

/**
 * Utilitário central de gestão de URLs e Domínio do Nexus Cognitiva.
 * Suporta funcionamento tanto sob o domínio principal (/nexus-cognitiva)
 * quanto sob um domínio dedicado / à parte (ex: https://nexuscognitiva.com ou https://nexus.mustainfo.org).
 */

const RAW_NEXUS_URL = process.env.NEXT_PUBLIC_NEXUS_URL || "";
const MAIN_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mustainfo.org").replace(/\/+$/, "");

/**
 * Retorna a URL base absoluta do Nexus Cognitiva.
 * - Se NEXT_PUBLIC_NEXUS_URL estiver definida (ex: "https://nexuscognitiva.com"), usa essa URL.
 * - Caso contrário, usa "{NEXT_PUBLIC_SITE_URL}/nexus-cognitiva".
 * - No browser, se nenhuma variável estiver definida, infere a partir de window.location.origin.
 */
export function getNexusBaseUrl(): string {
  if (RAW_NEXUS_URL) {
    return RAW_NEXUS_URL.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/+$/, "");
    // Se já estivermos num subpath /nexus-cognitiva no browser
    if (window.location.pathname.startsWith("/nexus-cognitiva")) {
      return `${origin}/nexus-cognitiva`;
    }
    return origin;
  }

  return `${MAIN_SITE_URL}/nexus-cognitiva`;
}

/**
 * Retorna o hostname do Nexus Cognitiva (para configuração de rewrites ou verificação de domínio).
 * Ex: "nexuscognitiva.com" ou "nexus.mustainfo.org"
 */
export function getNexusHost(): string {
  if (process.env.NEXT_PUBLIC_NEXUS_HOST) {
    return process.env.NEXT_PUBLIC_NEXUS_HOST.trim().toLowerCase();
  }
  if (RAW_NEXUS_URL) {
    try {
      const parsed = new URL(RAW_NEXUS_URL);
      return parsed.hostname.toLowerCase();
    } catch {}
  }
  return "";
}

/**
 * Verifica se o Nexus está configurado para correr como domínio próprio/raiz (standalone).
 * Ex: "https://nexuscognitiva.com" ou "https://nexus.mustainfo.org" (sem /nexus-cognitiva no path).
 */
export function isStandaloneNexusDomain(): boolean {
  if (RAW_NEXUS_URL) {
    try {
      const parsed = new URL(RAW_NEXUS_URL);
      return parsed.pathname === "" || parsed.pathname === "/";
    } catch {
      return !RAW_NEXUS_URL.includes("/nexus-cognitiva");
    }
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    const nexusHost = getNexusHost();
    if (nexusHost && host === nexusHost) {
      return true;
    }
  }

  return false;
}

/**
 * Retorna o caminho de navegação relativo para a página principal (Feed) do Nexus.
 * Se domínio à parte: "/"
 * Se subsite integrado: "/nexus-cognitiva"
 */
export function getNexusFeedPath(): string {
  return isStandaloneNexusDomain() ? "/" : "/nexus-cognitiva";
}

/**
 * Retorna o caminho para a página de publicação de artigos.
 * Se domínio à parte: "/publicar"
 * Se subsite integrado: "/nexus-cognitiva/publicar"
 */
export function getNexusPublishPath(): string {
  return isStandaloneNexusDomain() ? "/publicar" : "/nexus-cognitiva/publicar";
}

/**
 * Retorna o caminho para a página do plano do produto.
 * Se domínio à parte: "/plano"
 * Se subsite integrado: "/nexus-cognitiva/plano"
 */
export function getNexusPlanPath(): string {
  return isStandaloneNexusDomain() ? "/plano" : "/nexus-cognitiva/plano";
}

/**
 * Retorna a rota ou URL completa de um artigo.
 * @param id ID do artigo
 * @param absolute Se true, devolve a URL absoluta completa com protocolo e domínio
 */
export function getArticleUrl(id: string | number, absolute: boolean = false): string {
  if (absolute) {
    const baseUrl = getNexusBaseUrl();
    // Se a base já terminar com /nexus-cognitiva ou for a raiz do domínio próprio
    return `${baseUrl}/artigo/${id}`;
  }

  const feedPath = getNexusFeedPath();
  const cleanBase = feedPath === "/" ? "" : feedPath;
  return `${cleanBase}/artigo/${id}`;
}

/**
 * Retorna a URL da plataforma-mãe MustInfo.
 * Usado pelo botão de voltar ou branding na navbar quando o Nexus estiver num domínio separado.
 */
export function getMainPlatformUrl(): string {
  return MAIN_SITE_URL;
}
