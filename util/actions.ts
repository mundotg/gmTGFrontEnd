"use server";

// Importa a função base que configurámos na Opção 2 anterior
import { gerarTexto } from "@/lib/gemini"; 

export async function processarPrompt(prompt: string) {
  try {
    if (!prompt) return { resposta: "", erro: null };

    // Chama o Gemini
    const respostaIA = await gerarTexto(prompt);
    
    return {
      resposta: respostaIA,
      erro: null,
    };
  } catch (error: any) {
    console.error("Erro ao comunicar com o Gemini:", error);
    return {
      resposta: "",
      erro: "Ocorreu um erro ao processar o teu pedido na IA.",
    };
  }
}