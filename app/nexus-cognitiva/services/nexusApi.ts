// app/nexus-cognitiva/services/nexusApi.ts
import api from "@/context/axioCuston";
import { Article, CommentItem, ContentType, MinAge } from "../components/types";
import { INITIAL_ARTICLES } from "../components/mockArticles";

/* ============================================================
   📋 1. INTERFACES DE PARÂMETROS DAS APIS DO NEXUS COGNITIVA
============================================================ */

/** Parâmetros para consulta de listagem de publicações */
export interface FetchPostsParams {
  page?: number;
  size?: number;
  search?: string;
  category?: string;
  content_type?: string;
  min_age?: string;
  only_verified?: boolean;
  sort_by?: "recent" | "views" | "bookmarks" | "likes";
  forceRefresh?: boolean;
}

/** Resposta paginada de artigos */
export interface PostsResponse {
  items: Article[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/** Parâmetro para obter detalhes de um artigo */
export interface GetPostParams {
  id: string | number;
}

/** Estrutura do payload para criação de artigo */
export interface CreatePostPayload {
  title: string;
  summary?: string;
  body_markdown: string;
  category: string;
  subcategory?: string;
  content_type: ContentType;
  min_age: MinAge;
  cover_image?: string;
  video_url?: string;
  external_url?: string;
  read_time_minutes?: number;
  tags?: string[];
  sources?: Array<{
    title: string;
    authors: string;
    year: number;
    doi?: string;
    url?: string;
    verified?: boolean;
  }>;
  mentions?: Array<{
    name: string;
    role?: string;
  }>;
}

/** Parâmetro para criar publicação */
export interface CreatePostParams {
  payload: CreatePostPayload;
}

/** Parâmetro para atualizar publicação existente */
export interface UpdatePostParams {
  postId: string | number;
  payload: Partial<CreatePostPayload>;
}

/** Parâmetro para remover publicação */
export interface DeletePostParams {
  postId: string | number;
}

/** Parâmetros para listar comentários de uma publicação */
export interface GetCommentsParams {
  postId: string | number;
}

/** Parâmetros para adicionar um novo comentário */
export interface AddCommentParams {
  postId: string | number;
  content: string;
  parentId?: number;
}

/** Parâmetros para alternar Like (Gosto) */
export interface ToggleLikeParams {
  postId: string | number;
}

/** Parâmetros para alternar Guardado (Save / Bookmark) */
export interface ToggleSaveParams {
  postId: string | number;
  collectionName?: string;
}

/** Parâmetros para reagir qualitativamente a uma publicação */
export interface ReactPostParams {
  postId: string | number;
  reactionType: "curious" | "insight" | "applaud" | "question";
}

/** Parâmetros para registo de partilha */
export interface RegisterShareParams {
  postId: string | number;
  platform?: string;
}

/** Parâmetros para registo de tempo de leitura / visualização */
export interface RegisterViewParams {
  postId: string | number;
  readTimeSeconds?: number;
}

/** Parâmetros para conexão WebSocket em tempo real */
export interface WebSocketParams {
  postId: string | number;
  callbacks?: {
    onMessage?: (event: any) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (err: any) => void;
  };
}

/** Parâmetros para subscrição de Server-Sent Events (SSE) */
export interface FeedSSEParams {
  onNewPost: (data: any) => void;
  onConnected?: () => void;
}

/* ============================================================
   🔄 MAPEAMENTO DE DADOS (BACKEND -> FRONTEND)
============================================================ */

/**
 * Converte modelo backend para o formato Article consumido pelo frontend.
 */
export function mapBackendToArticle(item: any): Article {
  return {
    id: String(item.id),
    title: item.title,
    summary: item.summary || "",
    body_markdown: item.body_markdown,
    author: {
      id: String(item.author?.id || item.author_id),
      name: item.author?.nome || item.author?.name || "Autor Nexus",
      email: item.author?.email,
      avatar: item.author?.avatar_url || item.author?.avatar,
      title: item.author?.cargo || "Membro",
      institution: "MustInfo Ecosystem",
    },
    category: item.category,
    subcategory: item.subcategory,
    content_type: item.content_type,
    min_age: item.min_age,
    status: item.status,
    published_at: item.published_at || item.created_at,
    read_time_minutes: item.read_time_minutes || 5,
    tags: Array.isArray(item.tags) ? item.tags : [],
    cover_image: item.cover_image,
    video_url: item.video_url,
    external_url: item.external_url,
    sources: Array.isArray(item.sources) ? item.sources : [],
    mentions: Array.isArray(item.mentions) ? item.mentions : [],
    metrics: {
      views: item.views_count ?? item.metrics?.views ?? 0,
      bookmarks: item.bookmarks_count ?? item.metrics?.bookmarks ?? 0,
      comments_count: item.comments_count ?? item.metrics?.comments_count ?? 0,
    },
    likes_count: item.likes_count ?? 0,
    shares_count: item.shares_count ?? 0,
    is_liked: !!item.is_liked,
    is_saved: !!item.is_saved,
  };
}

/* ============================================================
   🚀 2. MÉTODOS DE API COM SUPORTE FLEXÍVEL A PARÂMETROS
============================================================ */

/**
 * 1. Obter lista de publicações paginadas e filtradas
 * Aceita objeto com parâmetros de consulta:
 * @param params { page, size, search, category, content_type, min_age, only_verified, sort_by }
 */
export async function getPosts(params: FetchPostsParams = {}): Promise<PostsResponse> {
  try {
    const { data } = await api.get("/nexus/posts", {
      params: {
        page: params.page || 1,
        size: params.size || 10,
        search: params.search?.trim() || undefined,
        category: params.category && params.category !== "all" ? params.category : undefined,
        content_type: params.content_type && params.content_type !== "all" ? params.content_type : undefined,
        min_age: params.min_age && params.min_age !== "all" ? params.min_age : undefined,
        only_verified: params.only_verified || undefined,
        sort_by: params.sort_by || "recent",
      },
    });

    if (data && Array.isArray(data.items)) {
      return {
        items: data.items.map(mapBackendToArticle),
        total: data.total,
        page: data.page,
        size: data.size,
        pages: data.pages,
      };
    }
  } catch (error) {
    console.warn("Nexus API offline ou inacessível, utilizando fallback local:", error);
  }

  // Fallback seguro caso o backend esteja inacessível
  return {
    items: INITIAL_ARTICLES,
    total: INITIAL_ARTICLES.length,
    page: 1,
    size: 10,
    pages: 1,
  };
}

/**
 * 2. Obter detalhe de uma publicação
 * Aceita parâmetro de objeto `{ id }` ou valor direto `id`
 */
export async function getPostById(params: GetPostParams | string | number): Promise<Article> {
  const id = typeof params === "object" && params !== null ? params.id : params;

  try {
    const { data } = await api.get(`/nexus/posts/${id}`);
    if (data && data.id) {
      return mapBackendToArticle(data);
    }
  } catch (error) {
    console.warn(`Não foi possível carregar post #${id} do backend, usando fallback:`, error);
  }

  // Fallback para artigos mock
  const found = INITIAL_ARTICLES.find((a) => a.id === String(id));
  return found || INITIAL_ARTICLES[0];
}

/**
 * 3. Criar publicação
 * Aceita parâmetro de objeto `{ payload }` ou objeto `CreatePostPayload` direto
 */
export async function createPost(params: CreatePostParams | CreatePostPayload): Promise<Article> {
  const body = "payload" in params && params.payload ? params.payload : (params as CreatePostPayload);
  const { data } = await api.post("/nexus/posts", body);
  return mapBackendToArticle(data);
}

/**
 * 4. Atualizar publicação
 * Aceita parâmetro de objeto `{ postId, payload }`
 */
export async function updatePost(params: UpdatePostParams): Promise<Article> {
  const { postId, payload } = params;
  const { data } = await api.put(`/nexus/posts/${postId}`, payload);
  return mapBackendToArticle(data);
}

/**
 * 5. Eliminar publicação
 * Aceita parâmetro de objeto `{ postId }` ou `postId` direto
 */
export async function deletePost(params: DeletePostParams | string | number): Promise<{ message: string }> {
  const postId = typeof params === "object" && params !== null ? params.postId : params;
  const { data } = await api.delete(`/nexus/posts/${postId}`);
  return data;
}

/**
 * 6. Listar comentários de um artigo
 * Aceita parâmetro de objeto `{ postId }` ou `postId` direto
 */
export async function getComments(params: GetCommentsParams | string | number): Promise<CommentItem[]> {
  const postId = typeof params === "object" && params !== null ? params.postId : params;

  try {
    const { data } = await api.get(`/nexus/posts/${postId}/comments`);
    if (Array.isArray(data)) {
      return data.map((c: any) => ({
        id: String(c.id),
        author: {
          id: String(c.user_id),
          name: c.author?.nome || "Utilizador Nexus",
          email: c.author?.email,
          avatar: c.author?.avatar_url,
          title: c.author?.cargo || "Membro",
        },
        content: c.content,
        created_at: c.created_at,
        likes: c.likes_count || 0,
        is_liked: !!c.is_liked,
      }));
    }
  } catch (error) {
    console.warn("Erro ao buscar comentários do backend:", error);
  }
  return [];
}

/**
 * 7. Adicionar comentário
 * Aceita parâmetro de objeto `{ postId, content, parentId }` ou argumentos posicionais `(postId, content, parentId)`
 */
export async function addComment(
  params: AddCommentParams | string | number,
  contentArg?: string,
  parentIdArg?: number
) {
  let postId: string | number;
  let content: string;
  let parentId: number | undefined;

  if (typeof params === "object" && params !== null) {
    postId = params.postId;
    content = params.content;
    parentId = params.parentId;
  } else {
    postId = params;
    content = contentArg || "";
    parentId = parentIdArg;
  }

  const { data } = await api.post(`/nexus/posts/${postId}/comments`, {
    content,
    parent_id: parentId,
  });
  return data;
}

/**
 * 8. Alternar Gosto (Like)
 * Aceita parâmetro de objeto `{ postId }` ou `postId` direto
 */
export async function toggleLike(
  params: ToggleLikeParams | string | number
): Promise<{ liked: boolean; likes_count: number }> {
  const postId = typeof params === "object" && params !== null ? params.postId : params;
  const { data } = await api.post(`/nexus/posts/${postId}/like`);
  return data;
}

/**
 * 8.1. Alternar Gosto em Comentário
 * Aceita commentId
 */
export async function toggleCommentLike(
  commentId: string | number
): Promise<{ liked: boolean; likes_count: number }> {
  const { data } = await api.post(`/nexus/comments/${commentId}/like`);
  return data;
}

/**
 * 9. Alternar Guardado (Save / Bookmark)
 * Aceita parâmetro de objeto `{ postId, collectionName }` ou argumentos posicionais `(postId, collectionName)`
 */
export async function toggleSave(
  params: ToggleSaveParams | string | number,
  collectionNameArg: string = "default"
): Promise<{ saved: boolean; bookmarks_count: number }> {
  let postId: string | number;
  let collectionName: string;

  if (typeof params === "object" && params !== null) {
    postId = params.postId;
    collectionName = params.collectionName || "default";
  } else {
    postId = params;
    collectionName = collectionNameArg;
  }

  const { data } = await api.post(`/nexus/posts/${postId}/save`, null, {
    params: { collection_name: collectionName },
  });
  return data;
}

/**
 * 10. Reagir qualitativamente a uma publicação
 * Aceita parâmetro de objeto `{ postId, reactionType }` ou `(postId, reactionType)`
 */
export async function reactToPost(
  params: ReactPostParams | string | number,
  reactionTypeArg: "curious" | "insight" | "applaud" | "question" = "curious"
) {
  let postId: string | number;
  let reactionType: string;

  if (typeof params === "object" && params !== null) {
    postId = params.postId;
    reactionType = params.reactionType;
  } else {
    postId = params;
    reactionType = reactionTypeArg;
  }

  const { data } = await api.post(`/nexus/posts/${postId}/react`, {
    reaction_type: reactionType,
  });
  return data;
}

/**
 * 11. Registar Partilha
 * Aceita parâmetro de objeto `{ postId, platform }` ou argumentos posicionais `(postId, platform)`
 */
export async function registerShare(
  params: RegisterShareParams | string | number,
  platformArg: string = "copy_link"
) {
  let postId: string | number;
  let platform: string;

  if (typeof params === "object" && params !== null) {
    postId = params.postId;
    platform = params.platform || "copy_link";
  } else {
    postId = params;
    platform = platformArg;
  }

  const { data } = await api.post(`/nexus/posts/${postId}/share`, { platform });
  return data;
}

/**
 * 12. Registar Leitura / Visualização
 * Aceita parâmetro de objeto `{ postId, readTimeSeconds }` ou argumentos posicionais `(postId, readTimeSeconds)`
 */
export async function registerView(
  params: RegisterViewParams | string | number,
  readTimeSecondsArg: number = 0
) {
  let postId: string | number;
  let readTimeSeconds: number;

  if (typeof params === "object" && params !== null) {
    postId = params.postId;
    readTimeSeconds = params.readTimeSeconds || 0;
  } else {
    postId = params;
    readTimeSeconds = readTimeSecondsArg;
  }

  const { data } = await api.post(`/nexus/posts/${postId}/view`, {
    read_time_seconds: readTimeSeconds,
  });
  return data;
}

/**
 * 13. WebSocket para Reações e Comentários em tempo real
 * Aceita parâmetro de objeto `{ postId, callbacks }` ou argumentos posicionais `(postId, callbacks)`
 */
export function createPostWebSocket(
  params: WebSocketParams | string | number,
  callbacksArg?: {
    onMessage?: (event: any) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (err: any) => void;
  }
): WebSocket | null {
  if (typeof window === "undefined") return null;

  let postId: string | number;
  let callbacks: {
    onMessage?: (event: any) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (err: any) => void;
  } = {};

  if (typeof params === "object" && params !== null) {
    postId = params.postId;
    callbacks = params.callbacks || {};
  } else {
    postId = params;
    callbacks = callbacksArg || {};
  }

  try {
    const baseBackend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/";
    const wsBase = baseBackend.replace(/^http/, "ws").replace(/\/$/, "");
    const socket = new WebSocket(`${wsBase}/nexus/ws/posts/${postId}`);

    socket.onopen = () => {
      callbacks.onOpen?.();
    };

    socket.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data);
        callbacks.onMessage?.(parsed);
      } catch (e) {
        console.error("Falha ao parsear mensagem do WebSocket Nexus:", e);
      }
    };

    socket.onclose = () => {
      callbacks.onClose?.();
    };

    socket.onerror = (err) => {
      callbacks.onError?.(err);
    };

    return socket;
  } catch (error) {
    console.warn("Não foi possível iniciar WebSocket do Nexus:", error);
    return null;
  }
}

/**
 * 14. SSE para Feed em Tempo Real
 * Aceita parâmetro de objeto `{ onNewPost, onConnected }` ou funções diretas
 */
export function subscribeToFeedSSE(
  params: FeedSSEParams | ((data: any) => void),
  onConnectedArg?: () => void
): EventSource | null {
  if (typeof window === "undefined" || typeof EventSource === "undefined") return null;

  let onNewPost: (data: any) => void;
  let onConnected: (() => void) | undefined;

  if (typeof params === "object" && params !== null) {
    onNewPost = params.onNewPost;
    onConnected = params.onConnected;
  } else {
    onNewPost = params;
    onConnected = onConnectedArg;
  }

  try {
    const baseBackend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/";
    const sseUrl = `${baseBackend.replace(/\/$/, "")}/nexus/sse/feed`;
    const eventSource = new EventSource(sseUrl, { withCredentials: true });

    eventSource.addEventListener("connected", () => {
      onConnected?.();
    });

    eventSource.addEventListener("new_post", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        onNewPost(parsed);
      } catch (err) {
        console.error("Erro no SSE new_post:", err);
      }
    });

    return eventSource;
  } catch (err) {
    console.warn("Não foi possível ligar ao SSE do Feed:", err);
    return null;
  }
}

/** Notificação do Nexus Cognitiva transmitida via WebSocket */
export interface NexusNotification {
  id: string;
  type: "new_post" | "new_comment";
  title: string;
  message: string;
  post_id: number | string;
  post_title: string;
  comment_id?: number | string;
  author_name?: string;
  author_avatar?: string;
  action_url: string;
  url?: string;
  created_at: string;
  call_to_action?: string;
  read?: boolean;
}

/**
 * 15. WebSocket Global de Notificações em Tempo Real do Nexus
 * Dispara sempre que é publicado um novo artigo ou comentário,
 * convidando os utilizadores a dar uma olhada, comentar ou partilhar.
 */
export function createNotificationsWebSocket(callbacks: {
  onNotification: (notification: NexusNotification) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: any) => void;
}): WebSocket | null {
  if (typeof window === "undefined") return null;

  try {
    const baseBackend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/";
    const wsBase = baseBackend.replace(/^http/, "ws").replace(/\/$/, "");
    const socket = new WebSocket(`${wsBase}/nexus/ws/notifications`);

    socket.onopen = () => {
      callbacks.onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "nexus_notification") {
          callbacks.onNotification(data as NexusNotification);
        }
      } catch (e) {
        console.error("Falha ao processar notificação do WebSocket:", e);
      }
    };

    socket.onclose = () => {
      callbacks.onClose?.();
    };

    socket.onerror = (err) => {
      callbacks.onError?.(err);
    };

    return socket;
  } catch (err) {
    console.warn("Erro ao conectar WebSocket de notificações Nexus:", err);
    return null;
  }
}
