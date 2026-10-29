import type { Metadata } from "next";
import { INITIAL_ARTICLES } from "../../components/mockArticles";
import { getArticleUrl, getNexusBaseUrl, getMainPlatformUrl } from "../../services/nexusUrl";

interface ArticleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }> | { id: string };
}

/**
 * Busca dados do artigo para gerar meta tags no servidor (SEO veloz)
 */
async function fetchArticleForSEO(id: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000/";
    const res = await fetch(`${backendUrl}nexus/posts/${id}`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Silencioso em caso de indisponibilidade momentânea
  }

  // Fallback nos artigos mock iniciais
  return INITIAL_ARTICLES.find((a) => String(a.id) === String(id) || a.id === `art-${id}`) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}): Promise<Metadata> {
  const resolvedParams = await params;
  const articleId = resolvedParams?.id || "1";
  const article = await fetchArticleForSEO(articleId);

  if (!article) {
    return {
      title: "Artigo não encontrado | Nexus Cognitiva",
      description: "O artigo que procura não existe ou foi removido.",
      robots: { index: false, follow: false },
    };
  }

  const title = article.title;
  const description =
    article.summary ||
    (article.body_markdown ? article.body_markdown.replace(/[#*`_~\[\]]/g, "").slice(0, 160) : "") ||
    "Leia este artigo científico e técnico completo no Nexus Cognitiva.";
  const url = getArticleUrl(articleId, true);
  const images = article.cover_image
    ? [article.cover_image]
    : [
      "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&auto=format&fit=crop&q=80",
    ];
  const tags = Array.isArray(article.tags) ? article.tags : [];
  const authorName = article.author?.name || "Autor Nexus Cognitiva";

  return {
    title,
    description,
    keywords: [
      title,
      article.category || "Ciência",
      article.subcategory || "Pesquisa",
      ...tags,
      "Nexus Cognitiva",
      "MustInfo",
    ],
    authors: [{ name: authorName }],
    creator: authorName,
    publisher: "MustInfo — Nexus Cognitiva",
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      locale: "pt_PT",
      url,
      siteName: "Nexus Cognitiva — MustInfo",
      title,
      description,
      publishedTime: article.published_at || undefined,
      modifiedTime: article.updated_at || article.published_at || undefined,
      authors: [authorName],
      section: article.category || "Ciência e Tecnologia",
      tags,
      images: images.map((img) => ({
        url: img,
        width: 1200,
        height: 630,
        alt: title,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
      creator: "@MustaInfoo",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function ArticleLayout({
  children,
  params,
}: ArticleLayoutProps) {
  const resolvedParams = await params;
  const articleId = resolvedParams?.id || "1";
  const article = await fetchArticleForSEO(articleId);
  const articleUrl = getArticleUrl(articleId, true);
  const nexusUrl = getNexusBaseUrl();
  const mainSiteUrl = getMainPlatformUrl();

  // Schema.org Article e BreadcrumbList
  const jsonLdArticle = article
    ? {
      "@context": "https://schema.org",
      "@type": "ScholarlyArticle",
      headline: article.title,
      description: article.summary || article.title,
      image: article.cover_image || "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&auto=format&fit=crop&q=80",
      datePublished: article.published_at || new Date().toISOString(),
      dateModified: article.updated_at || article.published_at || new Date().toISOString(),
      author: {
        "@type": "Person",
        name: article.author?.name || "Autor Nexus Cognitiva",
        jobTitle: article.author?.title || "Pesquisador",
        worksFor: article.author?.institution
          ? {
            "@type": "Organization",
            name: article.author.institution,
          }
          : undefined,
      },
      publisher: {
        "@type": "Organization",
        name: "MustInfo",
        url: mainSiteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${mainSiteUrl}/favicon.ico`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": articleUrl,
      },
      articleSection: article.category || "Ciência",
      keywords: Array.isArray(article.tags) ? article.tags.join(", ") : undefined,
      inLanguage: "pt",
    }
    : null;

  const jsonLdBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: mainSiteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Nexus Cognitiva",
        item: nexusUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article?.title || "Artigo",
        item: articleUrl,
      },
    ],
  };

  return (
    <>
      {jsonLdArticle && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }}
      />
      {children}
    </>
  );
}
