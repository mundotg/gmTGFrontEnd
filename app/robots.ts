import { MetadataRoute } from "next";
import {
  getNexusBaseUrl,
  getMainPlatformUrl,
  isStandaloneNexusDomain,
} from "./nexus-cognitiva/services/nexusUrl";

export default function robots(): MetadataRoute.Robots {
  const isStandalone = isStandaloneNexusDomain();
  const baseUrl = isStandalone ? getNexusBaseUrl() : getMainPlatformUrl();

  const allowRoutes = isStandalone
    ? ["/", "/artigo/", "/plano"]
    : ["/", "/nexus-cognitiva", "/nexus-cognitiva/artigo/", "/nexus-cognitiva/plano"];

  const disallowRoutes = isStandalone
    ? ["/api/"]
    : ["/api/", "/auth/", "/home/", "/task/", "/referencia/"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: allowRoutes,
        disallow: disallowRoutes,
      },
      {
        userAgent: "Googlebot",
        allow: allowRoutes,
        disallow: isStandalone ? ["/api/"] : ["/api/", "/auth/", "/home/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
