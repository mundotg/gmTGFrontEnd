"use client";
import React, { useCallback, useState } from 'react';
import {
  Database,
  Trash2,
  Edit,
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
        port: parseInt(formData.port), // <- Converte para número
        type: selectedDb.toLowerCase(), // <- Converte para minúsculas
        database_name: formData.database, // <- Renomeia corretamente
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
  }, [formData, api,selectedDb]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setConnectionStatus("");
    try {
      const payload = {
        name: formData.name,
        host: formData.host,
        port: parseInt(formData.port), // <- Converte para número
        type: selectedDb.toLowerCase(), // <- Converte para minúsculas
        database_name: formData.database, // <- Renomeia corretamente
        username: formData.username,
        password: formData.password,
        service: formData.service,
        sslmode: formData.sslmode,
        trustServerCertificate: formData.trustServerCertificate || "yes"
      };

      console.log("payload: ", formData)
      const response = await api.post('/conn/connect', { conn_data: payload, tipo: "upsert" }, { withCredentials: true });
      // console.log("response=", response)
      if (response.data.connect) {
        setConnectionStatus("connected");
        setIsConnecting(false);
        setExecute(true)
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

  }, [selectedDb,formData,api,setIsConnecting,setConnectionStatus,setExecute]);

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
  }, [setFormData, setSelectedDb, setConnectionStatus,api]);

  const deleteConnection = async (id: string) => {
    if (!id) {
      console.error("ID da conexão não fornecido");
      return;
    }
    try {
      await api.delete(`/conn/delete_connection/${id}`, {
        withCredentials: true,
      });

      console.log("✅ Conexão deletada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao deletar conexão:", error);
      // Aqui você pode exibir uma notificação para o usuário
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white mr-4">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('dbConnections')}</h1>
              <p className="text-gray-600">{t('dbConnectionsSubtitle')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Conexão */}
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
          {/* Painéis */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('savedConnections')}</h2>
              <div className="space-y-3">
                {paginatedConnections.length > 0 ? paginatedConnections.map((connection, index) => {
                  const db = databases.find(d => d.id === connection.type);
                  return (
                    <div key={"sav-connection" + connection.id + index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{db?.icon}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{connection.name}</h3>
                            <p className="text-sm text-gray-500">{connection.host} • {connection.database}</p>
                            <p className="text-xs text-gray-400">{t('lastUsed')}: {formatDate(connection.last_used)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusColor(connection.status)}`}>
                            {getStatusIcon(connection.status)}
                            {connection.status}
                          </span>
                          <button onClick={() => loadConnection(connection)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title={t('loadConnection')}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <ConnectionToggleButton
                            connection={connection}
                            onConnect={toggleConnection}
                            onDisconnect={toggleConnection}
                            titleConnect={t("upConnection")}
                            titleDisconnect={t("offConnection")}
                          />
                          <button onClick={() => deleteConnection(connection.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title={t('deleteConnection')}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }) : t('noSavedConnections')}

              </div>
              <Pagination page={connPage} totalPages={connTotal} size='md' onPageChange={setConn} maxVisiblePages={5} showPageNumbers={true} /* goToNext={nextConn} goToPrev={prevConn} */ />
            </div>

            {/* Histórico */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('connectionHistory')}</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {paginatedHistory.length > 0 ? paginatedHistory.map((entry, index) => (
                  <div key={"history" + entry.id + index} className="border-l-4 border-gray-200 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{entry.connection}</h3>
                        <p className="text-sm text-gray-600">{entry.action}</p>
                        <p className="text-xs text-gray-400">{formatDate(entry.timestamp)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusColor(entry.status)}`}>
                        {getStatusIcon(entry.status)}
                      </span>
                    </div>
                  </div>
                )) : t('noHistory')}
              </div>
              <Pagination page={historyPage} totalPages={historyTotal} size='md' onPageChange={setPagehistory} maxVisiblePages={5} showPageNumbers={true} /* setPage={setPagehistory} goToNext={nextHistory} goToPrev={prevHistory} */ />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};

export default DatabaseConnectionForm;