// utils/status.ts

import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
    case 'connected': return 'text-green-600 bg-green-50';
    case 'error': return 'text-red-600 bg-red-50';
    case 'info': return 'text-blue-600 bg-blue-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
    case 'connected': return <CheckCircle className="w-4 h-4" />;
    case 'error': return <AlertCircle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};


export const formatDate = (dateString?: string) => {
    if (!dateString) return "Data indisponível";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data inválida";
    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

