/**
 * Cliente de API tipado para o Recomendador de Vídeos do YouTube.
 * Utiliza fetch com `credentials: 'include'` para envio dos cookies de autenticação do MustaInfo.
 */

export interface VideoItem {
  id: string;
  youtube_id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  channel_title?: string | null;
  category_id?: string | null;
  published_at?: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface RecommendationItem {
  id: string;
  user_id: number;
  video_id: string;
  score: number;
  reason?: string | null;
  generated_at: string;
  expires_at: string;
  video: VideoItem;
}

export interface WatchHistoryItem {
  id: string;
  user_id: number;
  video_id: string;
  watched_at: string;
  watch_duration: number;
  liked: boolean;
  video?: VideoItem | null;
}

const BACKEND_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/"
).replace(/\/$/, "");

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BACKEND_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body && typeof options.body === "string") {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    credentials: "include", // Envia cookies de sessão/auth
  });

  if (!response.ok) {
    let errorDetail = `Erro HTTP ${response.status}`;
    let errorBody: any = null;
    try {
      errorBody = await response.json();
      if (errorBody && errorBody.detail) {
        errorDetail = typeof errorBody.detail === "string" ? errorBody.detail : JSON.stringify(errorBody.detail);
      }
    } catch {
      // Body não era JSON
    }

    if (response.status === 429) {
      errorDetail = "Cota diária da API do YouTube atingida. Usando catálogo em cache.";
    } else if (response.status === 401) {
      errorDetail = "Sessão expirada. Por favor, autentique-se novamente.";
    }

    throw new ApiError(errorDetail, response.status, errorBody);
  }

  return response.json();
}

export const DEFAULT_RECOMMENDATIONS_LIMIT =
  Number(process.env.NEXT_PUBLIC_RECOMMENDATIONS_LIMIT) || 24;

export const DEFAULT_SEARCH_VIDEOS_LIMIT =
  Number(process.env.NEXT_PUBLIC_SEARCH_VIDEOS_LIMIT) || 24;

/**
 * Busca recomendações personalizadas para o utilizador atual.
 */
export async function getRecommendations(
  limit: number = DEFAULT_RECOMMENDATIONS_LIMIT,
  refresh: boolean = false,
  categoryId?: string
): Promise<RecommendationItem[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (refresh) params.set("refresh", "true");
  if (categoryId) params.set("category_id", categoryId);

  return request<RecommendationItem[]>(`/api/recommendations?${params.toString()}`);
}

/**
 * Força a regeneração de recomendações (re-cálculo com base nos últimos vídeos).
 */
export async function refreshRecommendations(
  limit: number = DEFAULT_RECOMMENDATIONS_LIMIT,
  categoryId?: string
): Promise<RecommendationItem[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (categoryId) params.set("category_id", categoryId);

  return request<RecommendationItem[]>(`/api/recommendations/refresh?${params.toString()}`, {
    method: "POST",
  });
}

/**
 * Busca vídeos pelo termo de pesquisa e categoria.
 */
export async function searchVideos(
  query: string,
  limit: number = DEFAULT_SEARCH_VIDEOS_LIMIT,
  categoryId?: string
): Promise<VideoItem[]> {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("limit", String(limit));
  if (categoryId) params.set("category_id", categoryId);

  return request<VideoItem[]>(`/api/videos/search?${params.toString()}`);
}

/**
 * Busca detalhes de um vídeo específico por youtube_id ou UUID.
 */
export async function getVideo(youtubeId: string): Promise<VideoItem> {
  return request<VideoItem>(`/api/videos/${encodeURIComponent(youtubeId)}`);
}

/**
 * Registra histórico de visualização do vídeo com tempo assistido e curtida.
 */
export async function logWatch(
  id: string,
  watchDuration: number = 0,
  liked: boolean = false
): Promise<WatchHistoryItem> {
  return request<WatchHistoryItem>(`/api/videos/${encodeURIComponent(id)}/watch`, {
    method: "POST",
    body: JSON.stringify({
      watch_duration: watchDuration,
      liked: liked,
    }),
  });
}
