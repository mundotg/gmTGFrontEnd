import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LegalDocument } from "../_legal/LegalDocument";
import { termos } from "../_legal/termos";

export const metadata: Metadata = {
  title: "Termos de Serviço · MustaInfo",
  description: "Termos de utilização do MustaInfo.",
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
          <LegalDocument doc={termos} />
        </div>
      </div>
    </main>
  );
}
