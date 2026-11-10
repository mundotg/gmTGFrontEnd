"use client";

/**
 * Sinal de "a conexão ativa mudou".
 *
 * O menu lateral mostra `user.info_extra.name_db`, que vem do `/auth/me` feito
 * uma única vez no arranque. Sem este sinal, ligar/desligar/apagar uma conexão
 * só aparecia no menu depois de recarregar a página.
 *
 * Usa-se um evento em vez de props porque quem muda a conexão (página de
 * conexões, importação de dataset, …) não tem relação de parentesco com quem
 * mostra o estado (Sidebar, SidebarFooter, navSliderbar).
 *
 * O `BroadcastChannel` estende o sinal aos outros separadores abertos — é
 * comum ter a app em dois sítios e o menu do outro ficava a mentir.
 */

export const CONNECTION_CHANGED = "MustaInfo:connection-changed";

const CANAL = "MustaInfo-connection";

// ID único para esta instância de janela/aba para evitar eco duplo do BroadcastChannel
const TAB_INSTANCE_ID = typeof window !== "undefined"
  ? Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
  : "";

let notifyDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function canal(): BroadcastChannel | null {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
    try {
        return new BroadcastChannel(CANAL);
    } catch {
        return null;
    }
}

/** Avisa esta aba e as restantes de que a conexão ativa mudou (com debounce de 150ms). */
export function notifyConnectionChanged(): void {
    if (typeof window === "undefined") return;

    if (notifyDebounceTimer) {
        clearTimeout(notifyDebounceTimer);
    }

    notifyDebounceTimer = setTimeout(() => {
        // Dispara evento local para a aba atual
        window.dispatchEvent(new CustomEvent(CONNECTION_CHANGED));

        // Notifica outras abas via BroadcastChannel
        const bc = canal();
        if (bc) {
            try {
                bc.postMessage({ type: CONNECTION_CHANGED, sender: TAB_INSTANCE_ID });
            } finally {
                bc.close();
            }
        }
    }, 150);
}

/** Subscreve o sinal (nesta aba e nas outras). Devolve a função de limpeza. */
export function onConnectionChanged(handler: () => void): () => void {
    if (typeof window === "undefined") return () => { };

    const wrappedHandler = () => {
        handler();
    };

    window.addEventListener(CONNECTION_CHANGED, wrappedHandler);

    const bc = canal();
    if (bc) {
        bc.onmessage = (e) => {
            // Ignora mensagens enviadas pela própria aba para evitar dupla execução
            if (e.data?.type === CONNECTION_CHANGED && e.data?.sender !== TAB_INSTANCE_ID) {
                wrappedHandler();
            }
        };
    }

    return () => {
        window.removeEventListener(CONNECTION_CHANGED, wrappedHandler);
        bc?.close();
    };
}
