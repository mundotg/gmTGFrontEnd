import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LegalDocument } from "../_legal/LegalDocument";
import { privacidade } from "../_legal/privacidade";

export const metadata: Metadata = {
  title: "Política de Privacidade · MustaInfo",
  description: "Que dados o MustaInfo recolhe, como os usa e durante quanto tempo os guarda.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/auth/register"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao registo
        </Link>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <LegalDocument doc={privacidade} />
        </div>
      </div>
    </main>
  );
}
