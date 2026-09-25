"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/context/I18nContext";

/**
 * Erro dentro da aplicação (`/home/*`).
 *
 * Ao contrário do `global-error`, este renderiza DENTRO do
 * `app/home/layout.tsx`: a barra lateral fica de pé e o utilizador pode saltar
 * para outra secção sem recarregar. Só a página que rebentou é substituída.
 *
 * Como corre dentro dos providers do layout, tem acesso ao `useI18n` — o
 * `global-error` não tem, e é por isso que lá o texto está fixo em português.
 */
export default function HomeError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  // Next 16: `retry` volta a ir buscar os dados; `reset` só limparia o estado.
  retry: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error("[home-error]", error.digest ?? "(sem digest)", error);
  }, [error]);

  return (
    <div className="flex-1 min-h-[70vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" aria-hidden="true" />
        </div>

        <h1 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">
          {t("error.title") || "Esta página não carregou"}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {t("error.description") ||
            "O resto da aplicação continua a funcionar — pode mudar de secção pelo menu ao lado."}
        </p>

        {/* Em desenvolvimento mostra-se a mensagem real: em produção ela é
            substituída por um texto genérico e só o digest identifica o erro. */}
        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-gray-900 p-3 text-left font-mono text-[11px] leading-relaxed text-red-300">
            {error.message}
          </pre>
        )}

        {error.digest && (
          <p className="mt-4 inline-block px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono text-xs text-gray-600 dark:text-gray-400">
            {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => retry()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={16} />
            {t("error.retry") || "Tentar novamente"}
          </button>
          <Link
            href="/home"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            <Home size={16} />
            {t("error.home") || "Ir para o início"}
          </Link>
        </div>
      </div>
    </div>
  );
}
