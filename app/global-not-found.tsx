import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

/**
 * 404 de toda a aplicação.
 *
 * É `global-not-found` e não `not-found` porque esta app não tem
 * `app/layout.tsx`: cada secção — (landing), auth, home, task, clouds — traz o
 * seu próprio root layout com <html>/<body>. Sem um layout único não há onde
 * compor um `app/not-found.tsx`, e é este o caso que a documentação do Next
 * indica para o `global-not-found` ("Your app has multiple root layouts").
 *
 * Requer `experimental.globalNotFound: true` no `next.config.ts`.
 *
 * Como o Next salta a renderização normal, este ficheiro tem de trazer tudo o
 * que precisa: o documento HTML completo e os estilos globais.
 */

export const metadata: Metadata = {
  title: "Página não encontrada · MustaInf",
  description: "O endereço que abriu não corresponde a nenhuma página.",
};

/**
 * O tema vive na classe `dark` da raiz, posta pelo `AuthProvider` — que aqui
 * não corre. Sem isto a página abriria sempre em claro, mesmo para quem tem o
 * tema escuro escolhido. Corre antes da primeira pintura, para não haver
 * um piscar de branco.
 */
const APLICAR_TEMA = `
(function () {
  try {
    var m = localStorage.getItem('theme');
    var escuro = m === 'dark' ||
      (m !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (escuro) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function GlobalNotFound() {
  return (
    <html lang="pt">
      <head>
        <script dangerouslySetInnerHTML={{ __html: APLICAR_TEMA }} />
      </head>
      <body className="antialiased">
        <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6">
          <div className="w-full max-w-md text-center">
            {/* O número é o assunto da página: grande, e por trás do texto. */}
            <p
              aria-hidden="true"
              className="text-[7rem] leading-none font-bold tracking-tight text-gray-200 dark:text-gray-800 select-none"
            >
              404
            </p>

            <h1 className="-mt-6 text-xl font-semibold text-gray-900 dark:text-white">
              Esta página não existe
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              O endereço pode ter mudado, ou foi escrito com um engano. Nada foi
              perdido — o resto da aplicação continua a funcionar.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href="/home"
                className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Ir para o início
              </Link>
              <Link
                href="/home/conexao"
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-white dark:hover:bg-gray-900 transition-colors"
              >
                Ver conexões
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
