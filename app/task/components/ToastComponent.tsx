import { AlertCircle, CheckCircle2 } from "lucide-react";
import React, { useEffect } from "react";

// Componente de Toast para feedback
interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

const ToastComponent: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-green-50 border-green-500 text-green-800",
    error: "bg-red-50 border-red-500 text-red-800",
    info: "bg-blue-50 border-blue-500 text-blue-800",
  };

  const icons = {
    success: <CheckCircle2 size={20} className="text-green-600" />,
    error: <AlertCircle size={20} className="text-red-600" />,
    info: <AlertCircle size={20} className="text-blue-600" />,
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg animate-slide-in ${styles[type]} max-w-md`}
    >
      {icons[type]}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  );
};

export const Toast = React.memo(ToastComponent)