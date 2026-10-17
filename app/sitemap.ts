import { MetadataRoute } from "next";
import { INITIAL_ARTICLES } from "./nexus-cognitiva/components/mockArticles";
import {
  getNexusBaseUrl,
  getArticleUrl,
  getMainPlatformUrl,
  isStandaloneNexusDomain,
} from "./nexus-cognitiva/services/nexusUrl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const mainBaseUrl = getMainPlatformUrl();
  const nexusBaseUrl = getNexusBaseUrl();
  const isStandalone = isStandaloneNexusDomain();

  // Rotas estáticas
  const staticRoutes: MetadataRoute.Sitemap = isStandalone
    ? [
        {
          url: nexusBaseUrl,
          lastModified: new Date(),
          changeFrequency: "hourly",
          priority: 1.0,
        },
        {
          url: `${nexusBaseUrl}/plano`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        },
      ]
    : [
        {
          url: `${mainBaseUrl}/`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 1.0,
        },
        {
          url: nexusBaseUrl,
          lastModified: new Date(),
          changeFrequency: "hourly",
          priority: 0.95,
        },
        {
          url: `${nexusBaseUrl}/plano`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        },
      ];

  // Artigos dinâmicos do Nexus Cognitiva
  let articleRoutes: MetadataRoute.Sitemap = [];

  try {
    const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000/";
    const backendUrl = rawBackendUrl.replace(/\/+$/, "");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    try {
      const res = await fetch(`${backendUrl}/nexus/posts?size=100`, {
        cache: "no-store",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data?.items || [];

        if (items.length > 0) {
          articleRoutes = items.map((item: any) => ({
            url: getArticleUrl(item.id, true),
            lastModified: item.updated_at ? new Date(item.updated_at) : new Date(item.published_at || Date.now()),
            changeFrequency: "daily" as const,
            priority: 0.85,
          }));
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Se a API não responder a tempo, usa os artigos base para manter resposta instantânea
    console.warn("Sitemap: usando artigos fallback para geração rápida de rotas");
  }

  // Fallback para artigos mock se a API retornar vazio
  if (articleRoutes.length === 0) {
    articleRoutes = INITIAL_ARTICLES.map((article) => ({
      url: getArticleUrl(article.id, true),
      lastModified: new Date(article.published_at || Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  }

  return [...staticRoutes, ...articleRoutes];
}
