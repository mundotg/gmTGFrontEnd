import React from 'react';
import { Plus, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export type DatabaseItem = {
  name: string;
  status: string;
  color: string;
  icon: React.ReactNode;
  type?: string;
};

interface DatabaseListProps {
  databases: DatabaseItem[];
}

export default function DatabaseList({ databases }: DatabaseListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 mb-8 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Motores de Dados Suportados</h3>
          <p className="text-xs text-gray-500 mt-0.5">Conecte-se nativamente a bases relacionais e não-relacionais</p>
        </div>
        <Link
          href="/home/conexao"
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conexão</span>
        </Link>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {databases.map((db, index) => {
          const isConnected = db.status === 'Conectado' || db.status.toLowerCase().includes('conect');
          const href = isConnected
            ? '/home/tabelas'
            : db.type
            ? `/home/conexao?type=${encodeURIComponent(db.type)}`
            : '/home/conexao';

          return (
            <Link
              key={index}
              href={href}
              className={`flex items-center space-x-4 p-4 rounded-xl border transition-all duration-200 group ${
                isConnected
                  ? 'bg-gradient-to-r from-green-50/70 to-emerald-50/40 border-green-200 hover:border-green-300 shadow-sm'
                  : 'bg-white border-gray-200/80 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm'
              }`}
            >
              <div
                className={`w-12 h-12 ${db.color} rounded-xl flex items-center justify-center text-white text-2xl shadow-sm group-hover:scale-105 transition-transform`}
              >
                {db.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {db.name}
                  </h4>
                  {isConnected && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isConnected ? (
                    <span className="text-xs font-medium text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-600" /> Ativo
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                      Configurar conexão
                    </span>
                  )}
                </div>
              </div>

              <div className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
                {isConnected ? <ArrowRight className="w-4 h-4 text-green-600" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
