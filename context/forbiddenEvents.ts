"use client";

export interface ForbiddenEventPayload {
  message: string;
  status: number;
  url?: string;
  method?: string;
  id?: string;
  timestamp?: number;
}

export const FORBIDDEN_EVENT = "mustainf:api-forbidden";

let lastForbiddenMsg = "";
let lastForbiddenTime = 0;

/**
 * Notifica a aplicação de que uma resposta 403 (Permissão Negada) ocorreu.
 * Inclui limitação (debounce de 3s para a mesma mensagem) para evitar alertas repetitivos em rajada.
 */
export function notifyForbidden(payload: {
  message: string;
  status?: number;
  url?: string;
  method?: string;
}): void {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (lastForbiddenMsg === payload.message && now - lastForbiddenTime < 3000) {
    return;
  }
  lastForbiddenMsg = payload.message;
  lastForbiddenTime = now;

  const data: ForbiddenEventPayload = {
    message: payload.message,
    status: payload.status ?? 403,
    url: payload.url,
    method: payload.method,
    id: `forbidden-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now,
  };

  window.dispatchEvent(new CustomEvent(FORBIDDEN_EVENT, { detail: data }));
}

/**
 * Subscreve eventos 403 de acesso proibido. Retorna função para cancelar subscrição.
 */
export function onForbidden(handler: (payload: ForbiddenEventPayload) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const listener = (event: Event) => {
    const custom = event as CustomEvent<ForbiddenEventPayload>;
    if (custom.detail) {
      handler(custom.detail);
    }
  };

  window.addEventListener(FORBIDDEN_EVENT, listener);
  return () => {
    window.removeEventListener(FORBIDDEN_EVENT, listener);
  };
}
