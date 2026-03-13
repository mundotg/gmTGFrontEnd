// cryptoCompat.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/* =========================
   Mantido: cifra de César
========================= */
export function cifraCesar(text: string, shift: number): string {
  const out: string[] = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0);

    // A-Z
    if (code >= 65 && code <= 90) {
      out.push(String.fromCharCode(((code - 65 + shift + 26) % 26) + 65));
    }
    // a-z
    else if (code >= 97 && code <= 122) {
      out.push(String.fromCharCode(((code - 97 + shift + 26) % 26) + 97));
    } else {
      out.push(ch);
    }
  }
  return out.join("");
}

/* =========================
   Mantido: gerarSenha
   (melhorado: usa crypto.randomBytes)
========================= */
export function gerarSenha(
  personalizada1: string = "tg",
  personalizada2: string = "EDU",
  size: number = 23
): string {
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

  function randBelow(max: number): number {
    if (max <= 0) return 0;
    // uniforme o suficiente pra este uso
    // (se quiser perfeito, dá pra usar rejection sampling)
    return randomBytes(4).readUInt32BE(0) % max;
  }

  function gerarAleatorio(tamanho: number): string {
    const out: string[] = [];
    for (let i = 0; i < tamanho; i++) {
      out.push(caracteres[randBelow(caracteres.length)]);
    }
    return out.join("");
  }

  function removerPalavrasDuplicadas(s: string): string {
    const palavras = s.split("-");
    const seen = new Set<string>();
    const uniq: string[] = [];
    for (const p of palavras) {
      if (!seen.has(p)) {
        seen.add(p);
        uniq.push(p);
      }
    }
    return uniq.join(" ");
  }

  function removerPalavras(s: string, palavra: string): string {
    return s.split(palavra).join("");
  }

  let senhaBase = "";

  function embaralha_cada_palavra(personalizada?: string | null): string {
    let newPalavra = "";
    if (personalizada) {
      const palavras = personalizada.split("-");
      if (palavras.length) {
        for (let i = 0; i < palavras.length; i++) {
          const idx = randBelow(palavras.length);
          newPalavra += palavras[idx] + "-";
        }
      } else {
        newPalavra += personalizada + "-";
      }
    }
    return newPalavra;
  }

  function processarPersonalizada(personalizada?: string | null) {
    if (!personalizada) return;
    const palavras = personalizada.split(" ");
    if (palavras.length) {
      for (let i = 0; i < palavras.length; i++) {
        const idx = randBelow(palavras.length);
        senhaBase += palavras[idx] + "-";
      }
    } else {
      senhaBase += personalizada + "-";
    }
  }

  processarPersonalizada(personalizada1);
  processarPersonalizada(personalizada2);

  let senhaEmbaralhada = embaralha_cada_palavra(senhaBase);
  const randor = randBelow(30);

  if (randor === 2 || randor === 3 || randor === 25 || randor === 26) {
    senhaEmbaralhada = removerPalavrasDuplicadas(senhaEmbaralhada);
  }
  if (randor > 23) {
    senhaEmbaralhada = embaralha_cada_palavra(senhaEmbaralhada);
  }

  let restante = size - senhaEmbaralhada.length;
  if (restante < 0) restante = 0;

  const senhaAleatoria = senhaEmbaralhada + "-" + gerarAleatorio(restante);

  senhaBase = removerPalavras(senhaAleatoria, "-");
  senhaBase = removerPalavras(senhaBase, " ");

  if (senhaBase.length > size) senhaBase = senhaBase.slice(0, size);

  let restante2 = size - senhaBase.length;
  if (restante2 < 0) restante2 = 0;

  senhaBase += gerarAleatorio(restante2);

  if (senhaBase.length > size) senhaBase = senhaBase.slice(0, size);

  return senhaBase;
}

/* =========================
   AES-256-GCM (compatível)
   Layout: chaveCesar(32 chars) + ivHex(24) + tagHex(32) + cipherHex
========================= */

function toKey32Bytes(secretKey: string): Buffer {
  let key = Buffer.from(secretKey, "utf8");
  if (key.length < 32) {
    key = Buffer.concat([key, Buffer.alloc(32 - key.length, 0)]);
  } else if (key.length > 32) {
    key = key.subarray(0, 32);
  }
  return key;
}

export function aes_encrypt(text: string): string {
  // Mantendo tua lógica: chave gerada + "César"
  const secretKey = gerarSenha("tg", "EDU", 32);

  const keyBytes = toKey32Bytes(secretKey);

  // IV de 12 bytes (padrão GCM)
  const iv = randomBytes(12);

  const cipher = createCipheriv("aes-256-gcm", keyBytes, iv);
  const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 bytes

  const chaveCesar = cifraCesar(secretKey, 3);

  const ivHex = iv.toString("hex");       // 24 chars
  const tagHex = tag.toString("hex");     // 32 chars
  const cipherHex = ciphertext.toString("hex");

  return `${chaveCesar}${ivHex}${tagHex}${cipherHex}`;
}

export function aes_decrypt(encryptedText: string): string {
  // layout fixo: 32 + 24 + 32 + resto
  if(encryptedText === "" || !encryptedText) return encryptedText
  const chaveCesar = encryptedText.slice(0, 32);
  const ivHex = encryptedText.slice(32, 32 + 24);
  const tagHex = encryptedText.slice(32 + 24, 32 + 24 + 32);
  const cipherHex = encryptedText.slice(32 + 24 + 32);

  const secretKey = cifraCesar(chaveCesar, -3);
  const keyBytes = toKey32Bytes(secretKey);

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(cipherHex, "hex");

  const decipher = createDecipheriv("aes-256-gcm", keyBytes, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}