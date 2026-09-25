"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Último recurso: erro num root layout.
 *
 * Um `error.tsx` de segmento não envolve o layout acima dele. Se o que rebenta
 * for o próprio root layout de uma secção, só este ficheiro apanha — e por isso
 * substitui o documento inteiro, trazendo o seu <html>/<body> e os estilos.
 *
 * Não pode exportar `metadata` (é um Client Component), daí o <title> do React.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  // No Next 16 a prop chama-se `retry`. `reset` ainda existe mas só limpa o
  // estado sem voltar a ir buscar nada — aqui queremos a nova tentativa.
  retry: () => void;
}) {
  useEffect(() => {
    // Sem isto o erro morre no boundary e não aparece em lado nenhum. O
    // `digest` é o que permite ligá-lo à linha correspondente no log do
    // servidor, onde está a mensagem verdadeira.
    console.error("[global-error]", error.digest ?? "(sem digest)", error);
  }, [error]);

  return (
    <html lang="pt">
      <head>
        <title>Erro · MustaInf</title>
      </head>
      <body className="antialiased">
        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>

            <h1 className="mt-5 text-xl font-semibold text-gray-900">
              A aplicação não conseguiu carregar
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Foi um erro inesperado, não uma ação sua. Tentar de novo costuma
              resolver; se persistir, o código abaixo identifica esta ocorrência
              no registo do servidor.
            </p>

            {/* O digest é o que torna um relato de erro acionável: sem ele, o
                suporte tem de procurar por hora aproximada. */}
            {error.digest && (
              <p className="mt-4 inline-block px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 font-mono text-xs text-gray-600">
                {error.digest}
              </p>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => retry()}
                className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Tentar novamente
              </button>
              {/* `href` e não <Link>: o router pode ser precisamente o que
                  falhou, e uma navegação normal recarrega tudo de raiz. */}
              <a
                href="/home"
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-white transition-colors"
              >
                Voltar ao início
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
