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

export const CONNECTION_CHANGED = "mustainf:connection-changed";

const CANAL = "mustainf-connection";

function canal(): BroadcastChannel | null {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
    try {
        return new BroadcastChannel(CANAL);
    } catch {
        return null;
    }
}

/** Avisa esta aba e as restantes de que a conexão ativa mudou. */
export function notifyConnectionChanged(): void {
    if (typeof window === "undefined") return;

    window.dispatchEvent(new CustomEvent(CONNECTION_CHANGED));

    const bc = canal();
    if (bc) {
        try {
            bc.postMessage({ type: CONNECTION_CHANGED });
        } finally {
            bc.close();
        }
    }
}

/** Subscreve o sinal (nesta aba e nas outras). Devolve a função de limpeza. */
export function onConnectionChanged(handler: () => void): () => void {
    if (typeof window === "undefined") return () => { };

    window.addEventListener(CONNECTION_CHANGED, handler);

    const bc = canal();
    if (bc) bc.onmessage = (e) => e.data?.type === CONNECTION_CHANGED && handler();

    return () => {
        window.removeEventListener(CONNECTION_CHANGED, handler);
        bc?.close();
    };
}
