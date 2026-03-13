"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Database, Trash2, Edit, History, Link as LinkIcon, PlusCircle } from "lucide-react";

import { useI18n } from "@/context/I18nContext";
import { useSession } from "@/context/SessionContext";

import { ConnectionFormData, ConnectionLog, SavedConnection } from "@/types";
import { databases } from "@/constant";

import { usePagination } from "@/hook";
import usePersistedState from "@/hook/localStoreUse";

import Pagination from "@/app/component/pagination-component";
import { ConnectionToggleButton } from "@/app/component/ConnectionToggleButton";
import { ConnectionForm } from "@/app/component/connectionComponent/ConnectionForm";

import { formatDate, getStatusColor, getStatusIcon } from "@/util/connectioPage/func";
import { aes_decrypt, aes_encrypt } from "@/service";
import { DatasetImportModal, DatasetImportResponse } from "./component/DatasetImportModal";

const DEFAULT_FORM_DATA: ConnectionFormData = {
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
};

const DatabaseConnectionForm = () => {
  const { t } = useI18n();
  const { api } = useSession();

  const [selectedDb, setSelectedDb] = usePersistedState<string>("selectedDb", "");
  const [showDropdown, setShowDropdown] = usePersistedState<boolean>("showDropdown", false);
  const [formData, setFormData] = usePersistedState<ConnectionFormData>(
    "ConnectionFormData",
    DEFAULT_FORM_DATA
  );

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);

  const {
    page: historyPage,
    totalPages: historyTotal,
    data: paginatedHistory = [],
    setPage: setHistoryPage,
  } = usePagination<ConnectionLog>((page) =>
    api
      .get("/log/connection_logs/", {
        params: { page, limit: 10 },
        withCredentials: true,
      })
      .then((res) => res.data)
  );

  const {
    page: connPage,
    totalPages: connTotal,
    data: paginatedConnections = [],
    setData: setPaginatedConnections,
    setPage: setConnPage,
    setExecute,
  } = usePagination<SavedConnection>((page) =>
    api
      .get("/conn/connections/", {
        params: { page, limit: 10 },
        withCredentials: true,
      })
      .then((res) => res.data)
  );

  const selectedDatabase = useMemo(
    () => databases.find((db) => db.id === selectedDb),
    [selectedDb]
  );

  const refreshConnections = useCallback(() => {
    setExecute((prev) => !prev);
  }, [setExecute]);

  const buildConnectionPayload = useCallback(() => {
    return {
      name: formData.name.trim(),
      host: aes_encrypt(formData.host.trim()),
      port: Number(formData.port),
      type: selectedDb.toLowerCase(),
      database_name: formData.database.trim(),
      username: aes_encrypt(formData.username.trim()),
      password: aes_encrypt(formData.password),
      service: formData.service?.trim() || "",
      sslmode: formData.sslmode?.trim() || "",
      trustServerCertificate: formData.trustServerCertificate || "yes",
    };
  }, [formData, selectedDb]);

  const resetStatus = useCallback(() => {
    setConnectionStatus("");
  }, []);

  const handleDbSelect = useCallback(
    (dbId: string) => {
      setSelectedDb(dbId);
      setShowDropdown(false);

      const db = databases.find((item) => item.id === dbId);
      if (!db) return;

      const existingConnection = paginatedConnections.find((conn) => conn.type === dbId);

      if (existingConnection) {
        setFormData((prev) => ({
          ...prev,
          name: existingConnection.name,
          host: existingConnection.host,
          port: db.port,
          type: existingConnection.type,
          database: existingConnection.database,
          username: "",
          password: "",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        ...DEFAULT_FORM_DATA,
        port: db.port,
      }));
    },
    [paginatedConnections, setFormData, setSelectedDb, setShowDropdown]
  );

  const testConnection = useCallback(async () => {
    try {
      setConnectionStatus("");

      const payload = buildConnectionPayload();
      const response = await api.post(
        "/conn/connect",
        { conn_data: payload, tipo: "con" },
        { withCredentials: true }
      );

      setConnectionStatus(response.data?.connect ? "success" : "error");
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setConnectionStatus("error");
    }
  }, [api, buildConnectionPayload]);

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus("");

      const payload = buildConnectionPayload();
      const response = await api.post(
        "/conn/connect",
        { conn_data: payload, tipo: "upsert" },
        { withCredentials: true }
      );

      if (response.data?.connect) {
        setConnectionStatus("connected");
        refreshConnections();
        return;
      }

      setConnectionStatus("error");
    } catch (error) {
      console.error("Erro ao conectar:", error);
      setConnectionStatus("error");
    } finally {
      setIsConnecting(false);
    }
  }, [api, buildConnectionPayload, refreshConnections]);

  const loadConnection = useCallback(
    async (connection: SavedConnection) => {
      try {
        const db = databases.find((item) => item.id === connection.type);
        if (!db) return;

        setSelectedDb(connection.type);

        const { data } = await api.get(`/conn/get_credencial_db/${connection.id}`, {
          withCredentials: true,
        });

        const { password, username, service, sslmode, trustServerCertificate } = data;

        setFormData((prev) => ({
          ...prev,
          name: connection.name,
          host: aes_decrypt(connection.host),
          port: db.port,
          type: connection.type,
          database: connection.database,
          username: aes_decrypt(username),
          password: aes_decrypt(password),
          service: service || "",
          sslmode: sslmode || "",
          trustServerCertificate:
            trustServerCertificate || prev.trustServerCertificate || "yes",
        }));

        resetStatus();
      } catch (error) {
        console.error("Erro ao carregar conexão:", error);
        setConnectionStatus("error");
      }
    },
    [api, resetStatus, setFormData, setSelectedDb]
  );

  const deleteConnection = useCallback(
    async (id: string) => {
      if (!id) {
        console.error("ID da conexão não fornecido");
        return;
      }

      const confirmed = window.confirm(
        t("actions.confirmDeleteConnection") ||
        "Tem certeza que deseja deletar esta conexão?"
      );

      if (!confirmed) return;

      try {
        await api.delete(`/conn/delete_connection/${id}`, {
          withCredentials: true,
        });

        refreshConnections();
      } catch (error) {
        console.error("❌ Erro ao deletar conexão:", error);
      }
    },
    [api, refreshConnections, t]
  );

  const toggleConnection = useCallback(
    async (connectionId: string) => {
      try {
        const response = await api.put(
          "/conn/connect-toggle/",
          { conn_id: connectionId },
          { withCredentials: true }
        );

        const { connect } = response.data;

        const updatedConnections: SavedConnection[] = paginatedConnections.map((conn) => {
          if (conn.id === connectionId) {
            return {
              ...conn,
              status: connect ? "connected" : "disconnected",
            };
          }

          if (connect) {
            return {
              ...conn,
              status: conn.status === "connected" ? "disconnected" : conn.status,
            };
          }

          return conn;
        });

        setPaginatedConnections(updatedConnections);
        refreshConnections();
      } catch (error: unknown) {
        console.error("❌ Erro ao alternar conexão:", error);
      }
    },
    [api, paginatedConnections, refreshConnections, setPaginatedConnections]
  );

  const handleDatasetImported = useCallback((result: DatasetImportResponse) => {
  console.log("Dataset importado:", result);
  refreshConnections();
}, [refreshConnections]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-100 text-blue-600 shadow-sm">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {t("dbConnections")}
              </h1>
              <p className="mt-1 text-sm font-medium text-gray-500">
                {t("dbConnectionsSubtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDatasetModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
            Importar dataset
          </button>
        </div>

        <DatasetImportModal
          isOpen={isDatasetModalOpen}
          onClose={() => setIsDatasetModalOpen(false)}
          onImported={handleDatasetImported}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
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

          <div className="space-y-6 lg:space-y-8">
            <div className="flex h-fit max-h-[500px] flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900">
                <LinkIcon className="h-5 w-5 text-gray-400" />
                {t("savedConnections")}
              </h2>

              <div className="scrollbar-thin scrollbar-thumb-gray-200 flex-1 space-y-3 overflow-y-auto pr-1">
                {paginatedConnections.length > 0 ? (
                  paginatedConnections.map((connection, index) => {
                    const db = databases.find((item) => item.id === connection.type);

                    return (
                      <div
                        key={`sav-connection-${connection.id}-${index}`}
                        className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-sm"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 shadow-sm">
                              <span className="text-xl">{db?.icon}</span>
                            </div>

                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-bold text-gray-900">
                                {connection.name}
                              </h3>
                              <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
                                {connection.host} • {connection.database}
                              </p>
                              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                {t("lastUsed")}: {formatDate(connection.last_used)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:ml-auto">
                            <span
                              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(
                                connection.status
                              )}`}
                            >
                              {getStatusIcon(connection.status)}
                              {connection.status}
                            </span>

                            <button
                              onClick={() => loadConnection(connection)}
                              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              title={t("loadConnection")}
                            >
                              <Edit className="h-4 w-4" />
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
                              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                              title={t("deleteConnection")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-10">
                    <LinkIcon className="mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">
                      {t("noSavedConnections")}
                    </p>
                  </div>
                )}
              </div>

              {paginatedConnections.length > 0 && (
                <div className="mt-2 border-t border-gray-100 pt-4">
                  <Pagination
                    page={connPage}
                    totalPages={connTotal}
                    size="sm"
                    onPageChange={setConnPage}
                    maxVisiblePages={5}
                    showPageNumbers
                  />
                </div>
              )}
            </div>

            <div className="flex h-fit max-h-[500px] flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900">
                <History className="h-5 w-5 text-gray-400" />
                {t("connectionHistory")}
              </h2>

              <div className="scrollbar-thin scrollbar-thumb-gray-200 flex-1 space-y-0 overflow-y-auto pr-1">
                {paginatedHistory.length > 0 ? (
                  paginatedHistory.map((entry, index) => (
                    <div
                      key={`history-${entry.id}-${index}`}
                      className="group relative border-l-2 border-gray-200 py-3 pl-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="absolute -left-[5px] top-4 h-2 w-2 rounded-full bg-gray-200 transition-colors group-hover:bg-blue-400" />

                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-gray-900">
                            {entry.connection}
                          </h3>
                          <p className="mt-0.5 truncate text-xs font-medium text-gray-600">
                            {entry.action}
                          </p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {formatDate(entry.timestamp)}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(
                            entry.status
                          )}`}
                        >
                          {getStatusIcon(entry.status)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-10">
                    <History className="mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">{t("noHistory")}</p>
                  </div>
                )}
              </div>

              {paginatedHistory.length > 0 && (
                <div className="mt-2 border-t border-gray-100 pt-4">
                  <Pagination
                    page={historyPage}
                    totalPages={historyTotal}
                    size="sm"
                    onPageChange={setHistoryPage}
                    maxVisiblePages={5}
                    showPageNumbers
                  />
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