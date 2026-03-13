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

export type Update2FAPayload = {
  enabled: boolean;
};

export async function changePassword(payload: ChangePasswordPayload) {
  const { data } = await api.put("/user/security/password", payload, { withCredentials: true });
  return data;
}

export async function updateTwoFactor(payload: Update2FAPayload) {
  const { data } = await api.put("/user/security/2fa", payload, { withCredentials: true });
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
  return data; // json
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