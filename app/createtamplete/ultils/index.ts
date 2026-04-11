export const generateId = () => `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const STORAGE_KEY = "orionforge_template_v2";