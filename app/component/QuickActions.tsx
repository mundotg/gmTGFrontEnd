import React from 'react';
import { Search, Database, BarChart3 } from 'lucide-react';

export default function QuickActions() {
  return (
    <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
      <h3 className="text-xl font-semibold mb-4">Ações Rápidas</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors">
          <Search className="w-6 h-6" />
          <span className="font-medium">Nova Consulta</span>
        </button>
        <button className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors">
          <Database className="w-6 h-6" />
          <span className="font-medium">Conectar BD</span>
        </button>
        <button className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors">
          <BarChart3 className="w-6 h-6" />
          <span className="font-medium">Ver Análises</span>
        </button>
      </div>
    </div>
  );
}