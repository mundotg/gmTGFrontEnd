"use client";

import { aes_decrypt, aes_encrypt } from "@/service";
import { useState, FormEvent } from "react";


export async function processarTexto(frase: string) {
  try {
    if (!frase) return { encriptado: "", desencriptado: "" };

    // // 1. Encripta a frase recebida
    const textoEncriptado = aes_encrypt(frase);
    // console.log(textoEncriptado)
    
    // 2. Desencripta logo de seguida para testar se funcionou perfeitamente
    const textoDesencriptado = aes_decrypt(textoEncriptado);
    // console.log(textoDesencriptado)

     // 1. Encripta a frase recebida
    // const textoEncriptado = aes_decrypt(frase);
    // console.log(textoEncriptado)
    
    // // 2. Desencripta logo de seguida para testar se funcionou perfeitamente
    // const textoDesencriptado = aes_encrypt(textoEncriptado);
    // console.log(textoDesencriptado)
    return {
      encriptado: textoEncriptado,
      desencriptado: textoDesencriptado,
      erro: null,
    };
  } catch (error: any) {
    console.error("Erro na encriptação:", error);
    return {
      encriptado: "",
      desencriptado: "",
      erro: "Ocorreu um erro ao processar os dados.",
    };
  }
}

export default function EncriptacaoPage() {
  const [frase, setFrase] = useState("");
  const [encriptada, setEncriptada] = useState("");
  const [desencriptada, setDesencriptada] = useState("");
  const [aCarregar, setACarregar] = useState(false);

  const handleSubmit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setACarregar(true);

    // Chama a função que corre no servidor com o node:crypto
    const resultado = await processarTexto(frase);

    if (resultado.erro) {
      alert(resultado.erro);
    } else {
      setEncriptada(resultado.encriptado);
      setDesencriptada(resultado.desencriptado);
    }

    setACarregar(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
          Teste de Encriptação AES-256-GCM
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo para digitar a frase */}
          <div>
            <label htmlFor="frase" className="block mb-2 text-sm font-semibold text-gray-700">
              Digite a Frase
            </label>
            <input
              type="text"
              id="frase"
              value={frase}
              onChange={(e) => setFrase(e.target.value)}
              placeholder="Ex: Segredo super confidencial"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={aCarregar}
            className={`w-full px-4 py-3 font-bold text-white rounded-lg transition-all ${
              aCarregar ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {aCarregar ? "A processar..." : "Encriptar & Desencriptar"}
          </button>
        </form>

        {/* Áreas de Resultado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {/* Textarea Encriptada */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Resultado Encriptado
            </label>
            <textarea
              readOnly
              value={encriptada}
              rows={6}
              className="w-full px-4 py-3 text-sm bg-gray-100 border border-gray-200 rounded-lg resize-none focus:outline-none text-red-600 break-all"
              placeholder="O texto encriptado aparecerá aqui..."
            />
          </div>

          {/* Textarea Desencriptada */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Resultado Desencriptado
            </label>
            <textarea
              readOnly
              value={desencriptada}
              rows={6}
              className="w-full px-4 py-3 text-sm bg-gray-100 border border-gray-200 rounded-lg resize-none focus:outline-none text-green-600 break-all"
              placeholder="O texto desencriptado aparecerá aqui..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}