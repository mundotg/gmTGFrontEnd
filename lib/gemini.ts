import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
console.log(apiKey)
if (!apiKey) {
  throw new Error("A variável de ambiente GEMINI_API_KEY não está configurada.");
}

// Inicializa o SDK
const genAI = new GoogleGenerativeAI(apiKey);

// Seleciona o modelo a utilizar
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Função utilitária para gerar texto a partir de um prompt
 */
export async function gerarTexto(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erro na API do Gemini:", error);
    console.error("Erro detalhado da API:", error?.message || error);
    throw new Error("Falha ao gerar o conteúdo.");
  }
}