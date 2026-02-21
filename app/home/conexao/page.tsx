"use client";
import React, { useCallback, useState } from 'react';
import {
  Database,
  Trash2,
  Edit,
  History,
  Link as LinkIcon
} from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { ConnectionFormData, ConnectionLog, SavedConnection } from '@/types';
import { useSession } from '@/context/SessionContext';
import { databases } from '@/constant';
import { usePagination } from '@/hook';
import Pagination from '@/app/component/pagination-component';
import { ConnectionToggleButton } from '@/app/component/ConnectionToggleButton';
import { ConnectionForm } from '@/app/component/connectionComponent/ConnectionForm';
import { formatDate, getStatusColor, getStatusIcon } from '@/util/connectioPage/func';
import usePersistedState from '@/hook/localStoreUse';


const DatabaseConnectionForm = () => {
  const [selectedDb, setSelectedDb] = usePersistedState<string>("selectedDb", "");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");
  const [showDropdown, setShowDropdown] = usePersistedState<boolean>("showDropdown", false);
  const { t } = useI18n();
  const { api } = useSession();
  
  const [formData, setFormData] = usePersistedState<ConnectionFormData>("ConnectionFormData", {
    name: "",
    host: "",
    port: "",
    type: "",
    database: "",
    username: "",
    password: "",
    trustServerCertificate: "yes",
    sslmode: "",
    service: "",
  });

  const { page: historyPage, totalPages: historyTotal, data: paginatedHistory, setPage: setPagehistory } = usePagination<ConnectionLog>((page) =>
    api.get("/log/connection_logs/", {
      params: { page, limit: 10 },
      withCredentials: true,
    }).then(res => res.data)
  );

  const { page: connPage, totalPages: connTotal, data: paginatedConnections, setData: setPageConnetion, setPage: setConn, setExecute } = usePagination<SavedConnection>((page) =>
    api.get("/conn/connections/", {
      params: { page, limit: 10 },
      withCredentials: true,
    }).then(res => res.data)
  );

  const handleDbSelect = (dbId: string) => {
    setSelectedDb(dbId);
    setShowDropdown(false);
    const db = databases.find(d => d.id === dbId);
    if (!db) return;

    const existingConnection = paginatedConnections.find(conn => conn.type === dbId);

    if (existingConnection) {
      setFormData(prev => ({
        ...prev,
        name: existingConnection.name,
        host: existingConnection.host,
        port: db.port,
        type: existingConnection.type,
        database: existingConnection.database,
        username: "",
        password: "",
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        name: "",
        host: "",
        type: "",
        port: db.port,
        database: "",
        username: "",
        password: "",
      }));
    }
  };

  const testConnection = useCallback(async () => {
    try {
      const payload = {
        name: formData.name,
        host: formData.host,
        port: parseInt(formData.port),
        type: selectedDb.toLowerCase(),
        database_name: formData.database,
        username: formData.username,
        password: formData.password,
        service: formData.service,
        sslmode: formData.sslmode,
        trustServerCertificate: formData.trustServerCertificate || "yes"
      };
      const response = await api.post('/conn/connect', { conn_data: payload, tipo: "con" }, { withCredentials: true });

      if (response.data.success) {
        setConnectionStatus("success");
      }

    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setConnectionStatus("error");
      return;
    }
  }, [formData, api, selectedDb]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setConnectionStatus("");
    try {
      const payload = {
        name: formData.name,
        host: formData.host,
        port: parseInt(formData.port),
        type: selectedDb.toLowerCase(),
        database_name: formData.database,
        username: formData.username,
        password: formData.password,
        service: formData.service,
        sslmode: formData.sslmode,
        trustServerCertificate: formData.trustServerCertificate || "yes"
      };

      const response = await api.post('/conn/connect', { conn_data: payload, tipo: "upsert" }, { withCredentials: true });
      if (response.data.connect) {
        setConnectionStatus("connected");
        setIsConnecting(false);
        setExecute(true);
      } else {
        setConnectionStatus("error");
        setIsConnecting(false);
      }
    } catch (error) {
      console.error("Erro ao conectar:", error);
      setConnectionStatus("error");
      setIsConnecting(false);
      return;
    }
  }, [selectedDb, formData, api, setIsConnecting, setConnectionStatus, setExecute]);

  const loadConnection = useCallback(async (connection: SavedConnection) => {
    const db = databases.find(d => d.id === connection.type);
    if (!db) return;

    setSelectedDb(connection.type);
    const { data } = await api.get(`/conn/get_credencial_db/${connection.id}`, { withCredentials: true });

    const { password, username, service, sslmode, trustServerCertificate } = data;

    setFormData(prev => ({
      ...prev,
      name: connection.name,
      host: connection.host,
      port: db.port,
      type: connection.type,
      database: connection.database,
      username,
      password,
      service: service || prev.service,
      sslmode: sslmode || prev.sslmode,
      trustServerCertificate: trustServerCertificate || prev.trustServerCertificate || "yes",
    }));

    setConnectionStatus("");
  }, [setFormData, setSelectedDb, setConnectionStatus, api]);

  const deleteConnection = async (id: string) => {
    if (!id) {
      console.error("ID da conexão não fornecido");
      return;
    }
    if (!window.confirm(t("actions.confirmDeleteConnection") || "Tem certeza que deseja deletar esta conexão?")) return;

    try {
      await api.delete(`/conn/delete_connection/${id}`, {
        withCredentials: true,
      });
      setExecute(prev => !prev);
      console.log("✅ Conexão deletada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao deletar conexão:", error);
    }
  };

  const toggleConnection = async (connection_id: string) => {
    try {
      const response = await api.put("/conn/connect-toggle/", {
        conn_id: connection_id,
      });
      const { connect } = response.data;
      const atualizados: SavedConnection[] = paginatedConnections.map((conn) =>
        conn.id === connection_id ? { ...conn, status: connect ? "connected" : "disconnected" } : conn
      );
      setPageConnetion(atualizados);
      setExecute(prev => !prev);
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("❌ Erro ao alternar conexão:", error.response?.data || error.message);
    }
  };

  const selectedDatabase = databases.find(db => db.id === selectedDb);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Principal */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 border border-blue-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('dbConnections')}</h1>
              <p className="text-sm font-medium text-gray-500 mt-1">{t('dbConnectionsSubtitle')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Coluna Esquerda: Formulário de Conexão */}
          <ConnectionForm
            t={t}
            databases={databases}
            selectedDatabase={selectedDatabase}
            setFormData={setFormData}
            selectedDb={selectedDb}
            formData={formData}
            connectionStatus={connectionStatus}
            isConnecting={isConnecting}
            handleDbSelect={handleDbSelect}
            testConnection={testConnection}
            connect={connect}
            getStatusIcon={getStatusIcon}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
          />
          
          {/* Coluna Direita: Painéis de Histórico e Salvos */}
          <div className="space-y-6 lg:space-y-8">
            
            {/* Conexões Salvas */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col h-fit max-h-[500px]">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-gray-400" />
                {t('savedConnections')}
              </h2>
              
              <div className="space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 flex-1">
                {paginatedConnections.length > 0 ? (
                  paginatedConnections.map((connection, index) => {
                    const db = databases.find(d => d.id === connection.type);
                    return (
                      <div 
                        key={`sav-connection-${connection.id}-${index}`} 
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                              <span className="text-xl">{db?.icon}</span>
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-900 truncate text-sm">{connection.name}</h3>
                              <p className="text-xs font-medium text-gray-500 truncate mt-0.5">{connection.host} • {connection.database}</p>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1.5">{t('lastUsed')}: {formatDate(connection.last_used)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:ml-auto">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${getStatusColor(connection.status)}`}>
                              {getStatusIcon(connection.status)}
                              {connection.status}
                            </span>
                            <button 
                              onClick={() => loadConnection(connection)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              title={t('loadConnection')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <ConnectionToggleButton
                              connection={connection}
                              onConnect={toggleConnection}
                              onDisconnect={toggleConnection}
                              titleConnect={t("upConnection")}
                              titleDisconnect={t("offConnection")}
                            />
                            <button 
                              onClick={() => deleteConnection(connection.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                              title={t('deleteConnection')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                     <LinkIcon className="w-8 h-8 text-gray-300 mb-2" />
                     <p className="text-sm font-medium text-gray-500">{t('noSavedConnections')}</p>
                  </div>
                )}
              </div>
              
              {paginatedConnections.length > 0 && (
                <div className="pt-4 mt-2 border-t border-gray-100">
                  <Pagination page={connPage} totalPages={connTotal} size='sm' onPageChange={setConn} maxVisiblePages={5} showPageNumbers={true} />
                </div>
              )}
            </div>

            {/* Histórico de Conexões */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col h-fit max-h-[500px]">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                {t('connectionHistory')}
              </h2>
              
              <div className="space-y-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 flex-1">
                {paginatedHistory.length > 0 ? paginatedHistory.map((entry, index) => (
                  <div 
                    key={`history-${entry.id}-${index}`} 
                    className="border-l-2 border-gray-200 pl-4 py-3 hover:bg-gray-50 transition-colors group relative"
                  >
                    <div className="absolute w-2 h-2 rounded-full bg-gray-200 -left-[5px] top-4 group-hover:bg-blue-400 transition-colors" />
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{entry.connection}</h3>
                        <p className="text-xs font-medium text-gray-600 mt-0.5 truncate">{entry.action}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">{formatDate(entry.timestamp)}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border shrink-0 ${getStatusColor(entry.status)}`}>
                        {getStatusIcon(entry.status)}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <History className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm font-medium text-gray-500">{t('noHistory')}</p>
                  </div>
                )}
              </div>

              {paginatedHistory.length > 0 && (
                <div className="pt-4 mt-2 border-t border-gray-100">
                  <Pagination page={historyPage} totalPages={historyTotal} size='sm' onPageChange={setPagehistory} maxVisiblePages={5} showPageNumbers={true} />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConnectionForm;