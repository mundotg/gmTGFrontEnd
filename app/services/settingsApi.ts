// app/services/settingsApi.ts
import api from "@/context/axioCuston";

/* =======================
   PROFILE
======================= */
export type UpdateProfilePayload = {
  nome: string;
  telefone?: string;
  cargo?: string;
  empresa?: string;
  avatar_url?: string; // url (quando já existe) OU dataURL (se seu backend aceitar)
};

export async function updateProfile(payload: UpdateProfilePayload) {
  const { data } = await api.put("/user/profile", payload, { withCredentials: true });
  return data;
}

/* =======================
   SECURITY
======================= */
export type ChangePasswordPayload = {
  senhaAtual: string;
  novaSenha: string;
};

export async function changePassword(payload: ChangePasswordPayload) {
  const { data } = await api.put("/user/security/password", payload, { withCredentials: true });
  return data;
}

/* =======================
   NOTIFICATIONS (NEW ✅)
======================= */
export type NotificationSettingsPayload = {
  email: boolean;
  push: boolean;
  sms: boolean;
  weeklyDigest: boolean;
};

export async function updateNotifications(payload: NotificationSettingsPayload) {
  const { data } = await api.put("/user/settings/notifications", payload, { withCredentials: true });
  return data;
}

/* =======================
   APPEARANCE + LANGUAGE (NEW ✅)
======================= */
export type ThemeMode = "light" | "dark" | "system";

// Se você quiser salvar idioma no backend:
export type UpdateLanguagePayload = {
  language: string; // ex: "pt", "en", "fr", "pt-AO"
};

export type UpdateAppearancePayload = {
  theme: ThemeMode;
};

export async function updateAppearance(payload: UpdateAppearancePayload) {
  const { data } = await api.put("/geral/settings/appearance", payload, { withCredentials: true });
  return data;
}

export async function updateLanguage(payload: UpdateLanguagePayload) {
  const { data } = await api.put("/geral/settings/language", payload, { withCredentials: true });
  return data;
}

/* =======================
   EXPORT / DELETE
======================= */
export async function exportUserData() {
  const { data } = await api.get("/user/export", { withCredentials: true });
  return data;
}

/** Descarrega a exportação como ficheiro, que é o que o botão promete. */
export async function downloadUserData() {
  const dados = await exportUserData();

  const url = URL.createObjectURL(
    new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `mustainf-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function deleteAccount() {
  const { data } = await api.delete("/user", { withCredentials: true });
  return data;
}

/* =======================
   AVATAR UPLOAD
======================= */
export async function uploadAvatar(file: File) {
  const fd = new FormData();
  fd.append("file", file);

  const { data } = await api.post("/user/avatar", fd, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });

  // espero { url: "https://..." }
  return data;
}

// /* =======================
//    OPTIONAL: GET /me (useful para refreshUser)
// ======================= */
// export async function getMyProfile() {
//   const { data } = await api.get("/user/me", { withCredentials: true });
//   return data;
// }
/* =======================
   SESSÕES
======================= */
export interface Sessao {
  id: number;
  ip?: string | null;
  /** Identificador curto da sessão — não é o nome do navegador. */
  dispositivo?: string | null;
  criada_em?: string | null;
  expira_em?: string | null;
  ativa: boolean;
  atual: boolean;
}

export async function listarSessoes(): Promise<Sessao[]> {
  const { data } = await api.get<Sessao[]>("/user/sessions", { withCredentials: true });
  return data;
}

export async function terminarSessao(id: number) {
  const { data } = await api.delete(`/user/sessions/${id}`, { withCredentials: true });
  return data;
}
