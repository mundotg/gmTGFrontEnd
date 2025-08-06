import { Plus, ChevronRight } from 'lucide-react';

type Database = {
  name: string;
  status: string;
  color: string;
  icon: React.ReactNode;
};

interface DatabaseListProps {
  databases: Database[];
}

export default function DatabaseList({ databases }: DatabaseListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Bases de Dados Suportadas</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span>Nova Conexão</span>
        </button>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {databases.map((db, index) => (
          <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md">
            <div className={`w-12 h-12 ${db.color} rounded-lg flex items-center justify-center text-white text-xl`}>
              {db.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{db.name}</h4>
              <p className={`text-sm ${db.status === 'Conectado' ? 'text-green-600' : 'text-gray-500'}`}>
                {db.status}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
}
