"use server";

import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não configurada");
    }

    ai = new GoogleGenAI({ apiKey });
  }

  return ai;
}

export async function gerarTexto(prompt: string): Promise<string> {
  try {
    const ai = getClient();
     const modelName = process.env.MODEL_NAME;
    const response = await ai.models.generateContent({
      model: modelName || "gemini-2.5-flash-lite",
      contents: prompt,
    });

    return response.text || "";
  } catch (error: any) {
    console.error("❌ Gemini error:", error?.message || error);
    throw new Error("Falha ao gerar o conteúdo.");
  }
}