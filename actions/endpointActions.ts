"use server";

import fs from "fs/promises";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "endpoints_salvos.json");

export interface EndpointData {
  id?: string;
  name: string;
  url: string;
  method: string;
  headers: string;
  body: string;
}

// Salva um novo endpoint no arquivo JSON
export async function saveEndpoint(data: EndpointData) {
  try {
    let endpoints: EndpointData[] = [];
    
    // Tenta ler o arquivo existente
    try {
      const fileContent = await fs.readFile(FILE_PATH, "utf-8");
      endpoints = JSON.parse(fileContent);
    } catch (error) {
      // Se não existir, começamos com array vazio
    }

    const newEndpoint = {
      ...data,
      id: crypto.randomUUID(), // Gera um ID único
    };

    endpoints.push(newEndpoint);

    // Salva o arquivo formatado com 2 espaços
    await fs.writeFile(FILE_PATH, JSON.stringify(endpoints, null, 2), "utf-8");
    
    return { success: true, message: "Endpoint salvo com sucesso!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Recupera todos os endpoints salvos
export async function getEndpoints(): Promise<EndpointData[]> {
  try {
    const fileContent = await fs.readFile(FILE_PATH, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    return [];
  }
}