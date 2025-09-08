// hooks/usePopupReference.ts
import { useCallback } from "react";

interface PopupOptions {
  width?: number;
  height?: number;
  scrollbars?: boolean;
  resizable?: boolean;
  name?: string; // Nome opcional do popup
}

export function usePopupReference() {
  const openReferencePopup = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (params: Record<string, any>, options: PopupOptions = {}) => {
      const {
        width = 900,
        height = 600,
        scrollbars = true,
        resizable = true,
        name,
      } = options;

      // Evita loop infinito: só aceita objetos "simples"
      if (typeof params !== "object" || params === null) {
        throw new Error("Parâmetros devem ser um objeto válido");
      }

      // Converte o objeto para query string
      const query = new URLSearchParams();
      for (const key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
          const value = params[key];
          // Garante que valores não-serializáveis não quebrem
          query.append(key, String(value));
        }
      }

      const features = [
        `width=${width}`,
        `height=${height}`,
        `scrollbars=${scrollbars ? "yes" : "no"}`,
        `resizable=${resizable ? "yes" : "no"}`,
      ].join(",");

      // Nome único baseado nos parâmetros ou nome custom
      const popupName =
        name || `referencePopup_${Object.keys(params).join("_")}`;

      const url = `/referencia?${query.toString()}`;
      const popup = window.open(url, popupName, features);

      return popup;
    },
    []
  );

  return { openReferencePopup };
}
