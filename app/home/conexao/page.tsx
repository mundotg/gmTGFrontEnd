"use client";
import React, { use, useEffect, useState } from 'react';
import {
  Database,
  Plus,
  Eye,
  EyeOff,
  Server,
  Clock,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { ConnectionFormData, ConnectionLog, DatabaseOption, SavedConnection } from '@/types';
import { useSession } from '@/context/SessionContext';
import { databases } from '@/constant';
import { usePagination } from '@/hook';
import Pagination from '@/app/component/pagination-component';
import { ConnectionToggleButton } from '@/app/component/ConnectionToggleButton';

const DatabaseConnectionForm = () => {
  const [selectedDb, setSelectedDb] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { t } = useI18n();
  const { api } = useSession();



  const [formData, setFormData] = useState<ConnectionFormData>({
    name: "",
    host: "",
    port: "",
    type: "",
    database: "",
    username: "",
    password: ""
  });

  const { page: historyPage, totalPages: historyTotal, data: paginatedHistory, setData: setPaginatedHist, goToNext: nextHistory,
    goToPrev: prevHistory, setPage: setPagehistory } = usePagination<ConnectionLog>((page) =>
      api.get("/conn/connection_logs/", {
        params: { page, limit: 10 },
        withCredentials: true,
      }).then(res => res.data)
    );

  const { page: connPage, totalPages: connTotal, data: paginatedConnections, setData: setPageConnetion,
    goToNext: nextConn, goToPrev: prevConn, setPage: setPageConn,setExecute } = usePagination<SavedConnection>((page) =>
      api.get("/conn/connections/", {
        params: { page, limit: 10 },
        withCredentials: true,
      }).then(res => res.data)
    );


  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  useEffect(() => {
    // Atualiza o localStorage sempre que savedConnections mudar
    const formSave = localStorage.getItem('formData');
    if (formSave) {
      setFormData(JSON.parse(formSave));
    }
    const Dbform = localStorage.getItem("Dbform");
    if (Dbform) {
      const { select, isShowdropdown } = JSON.parse(Dbform);
      setSelectedDb(select);
      setShowDropdown(isShowdropdown);
    }
  }, []);

  useEffect(() => {
    // Atualiza o localStorage sempre que formData mudar
    localStorage.setItem('formData', JSON.stringify(formData));
  }, [formData]);


  const handleDbSelect = (dbId: string) => {
    setSelectedDb(dbId);
    setShowDropdown(false);
    localStorage.setItem("Dbform", JSON.stringify({ "select": dbId, "isShowdropdown": false }));
    const db: DatabaseOption | undefined = databases.find(d => d.id === dbId);
    if (!db) return;
    // updateField("port", db.port);

    // Buscar conexão existente para este tipo de banco
    const existingConnection = paginatedConnections.find(conn => conn.type === dbId);
    if (existingConnection) {
      setFormData({
        name: existingConnection.name,
        host: existingConnection.host,
        port: db.port,
        type: existingConnection.type,
        database: existingConnection.database,
        username: "",
        password: "",
      });
    } else {
      setFormData({
        name: "",
        host: "",
        type: "",
        port: db.port,
        database: "",
        username: "",
        password: ""
      });
    }
  };

  const testConnection = async () => {

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
        trustServerCertificate: formData.trustServerCertificate
      };
      const response = await api.post('/conn/test-connection',
        payload, { withCredentials: true });

      if (response.data.success) {
        setConnectionStatus("success");
      }

    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setConnectionStatus("error");
      return;

    }
  };

  const connect = async () => {
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
        trustServerCertificate: formData.trustServerCertificate
      };
      const response = await api.post('/conn/connect', payload, { withCredentials: true });
      console.log("response=", response)
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

  };

  const loadConnection = async (connection: SavedConnection) => {
    const db: DatabaseOption | undefined = databases.find(d => d.id === connection.type);
    if (!db) return;
    setSelectedDb(connection.type);
    const { data: { password, username,service,sslmode, trustServerCertificate} } = await api.get('/conn/get_credencial_db/' + connection.id, { withCredentials: true })
    console.log(service,sslmode, trustServerCertificate)
    setFormData({
      name: connection.name,
      host: connection.host,
      port: db.port,
      type: connection.type,
      database: connection.database,
      username: username,
      password: password,
      service,sslmode, trustServerCertificate
    });
    setConnectionStatus("");
  };

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
      setExecute(prev => !prev)

    } catch (error: any) {
      console.error("❌ Erro ao alternar conexão:", error.response?.data || error.message);
    }
  };


  const formatDate = (dateString?: string) => {
    if (!dateString) return "Data indisponível";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data inválida";
    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('newConnection')}</h2>

              {/* Database Type Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dbType')}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                  >
                    {selectedDatabase ? (
                      <div className="flex items-center">
                        <span className="text-xl mr-3">{selectedDatabase.icon}</span>
                        <span>{selectedDatabase.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">{t('selectDatabase')}</span>
                    )}
                    <ChevronDown className={`w-5 h-5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {databases.map((db) => (
                        <button
                          key={db.id}
                          onClick={() => handleDbSelect(db.id)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center first:rounded-t-lg last:rounded-b-lg"
                        >
                          <span className="text-xl mr-3">{db.icon}</span>
                          <span>{db.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedDb && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nome da Conexão */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('connectionName')}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder={t('connectionNamePlaceholder')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Host */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('host')}
                      </label>
                      <input
                        type="text"
                        value={formData.host}
                        onChange={(e) => updateField("host", e.target.value)}
                        placeholder="localhost"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Porta */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('port')}
                      </label>
                      <input
                        type="text"
                        value={formData.port}
                        onChange={(e) => updateField("port", e.target.value)}
                        placeholder={selectedDatabase?.port || "5432"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Database ou Caminho SQLite */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {selectedDb === 'sqlite' ? t('filePath') : t('database')}
                      </label>
                      <input
                        type="text"
                        value={formData.database}
                        onChange={(e) => updateField("database", e.target.value)}
                        placeholder={selectedDb === 'sqlite' ? "/path/to/database.db" : t('databaseNamePlaceholder')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Usuário */}
                    {selectedDb !== 'sqlite' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('username')}
                          </label>
                          <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => updateField("username", e.target.value)}
                            placeholder="user"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Senha */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('password')}
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={formData.password}
                              onChange={(e) => updateField("password", e.target.value)}
                              placeholder="••••••"
                              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* 🔒 Campo SSL (PostgreSQL) */}
                    {selectedDb === "postgresql" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SSL Mode
                        </label>
                        <input
                          type="text"
                          value={formData.sslmode || ""}
                          onChange={(e) => updateField("sslmode", e.target.value)}
                          placeholder="disable / require / verify-ca"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* 🔐 Campo Service (Oracle) */}
                    {selectedDb === "oracle" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Service Name
                        </label>
                        <input
                          type="text"
                          value={formData.service || ""}
                          onChange={(e) => updateField("service", e.target.value)}
                          placeholder="xe / orcl"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* ✅ Campo trustServerCertificate (SQL Server) */}
                    {selectedDb === "sqlserver" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Trust Server Certificate
                        </label>
                        <select
                          value={formData.trustServerCertificate || "yes"}
                          onChange={(e) => updateField("trustServerCertificate", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="yes">yes</option>
                          <option value="no">no</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}



              {connectionStatus && (
                <div className={`p-4 rounded-lg flex items-center ${connectionStatus === 'success' ? 'bg-green-50 text-green-700' :
                  connectionStatus === 'connected' ? 'bg-blue-50 text-blue-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                  {getStatusIcon(connectionStatus)}
                  <span className="ml-2">
                    {connectionStatus === 'success' ? t('testSuccess') :
                      connectionStatus === 'connected' ? t('connectedSuccess') :
                        t('connectionError')}
                  </span>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={testConnection} disabled={isConnecting}
                  className="flex-1 px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center">
                  {isConnecting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-b-2 border-blue-600 rounded-full mr-2"></div>
                      {t('testing')}
                    </>
                  ) : (
                    <>
                      <Server className="w-4 h-4 mr-2" />
                      {t('test')}
                    </>
                  )}
                </button>

                <button type="button" onClick={connect} disabled={isConnecting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center">
                  {isConnecting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></div>
                      {t('connecting')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('connect')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

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
                <Pagination page={connPage} totalPages={connTotal} setPage={setPagehistory} goToNext={nextConn} goToPrev={prevConn} />
              </div>
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

                <Pagination page={historyPage} totalPages={historyTotal} setPage={setPagehistory} goToNext={nextHistory} goToPrev={prevHistory} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};

export default DatabaseConnectionForm;