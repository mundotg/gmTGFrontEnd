"use client";
import React, { useCallback, useState } from "react";
import { ChevronDown, Eye, EyeOff, Plus, Server } from "lucide-react";
import { ConnectionFormData, DatabaseOption } from "@/types";

interface ConnectionFormProps {
  t: (key: string) => string;
  databases: DatabaseOption[];
  selectedDatabase?: DatabaseOption | null;
  selectedDb: string | null;
  formData: ConnectionFormData;
  setFormData: React.Dispatch<React.SetStateAction<ConnectionFormData>>;
  connectionStatus?: "success" | "connected" | "error" | string;
  isConnecting?: boolean;
  showDropdown: boolean;
  setShowDropdown: (v: boolean) => void;
  handleDbSelect: (id: string) => void;
  testConnection: () => void;
  connect: () => void;
  getStatusIcon: (status: string) => React.ReactNode;
}

export const ConnectionForm: React.FC<ConnectionFormProps> = ({
  t,
  databases,
  selectedDatabase = null,
  selectedDb = null,
  formData,
  setFormData,
  connectionStatus = "",
  isConnecting = false,
  showDropdown,
  setShowDropdown,
  handleDbSelect,
  testConnection,
  connect,
  getStatusIcon,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  /** Atualiza campo do formulário */
  const updateField = useCallback(
    (field: keyof ConnectionFormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value ?? "",
      }));
    },
    [setFormData]
  );

  /** Garante placeholders e valores padrão dinâmicos */
  const getPlaceholder = (field: string) => {
    const map: Record<string, string> = {
      name: t("connectionNamePlaceholder"),
      host: "localhost",
      port: selectedDatabase?.port?.toString() || "5432",
      database:
        selectedDb === "sqlite"
          ? "/path/to/database.db"
          : t("databaseNamePlaceholder"),
      username: "user",
      password: "••••••",
      sslmode: "disable / require / verify-ca",
      service: "xe / orcl",
    };
    return map[field] || "";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("newConnection")}
        </h2>

        {/* Selecionar tipo de DB */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("dbType")}
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
                <span className="text-gray-500">{t("selectDatabase")}</span>
              )}
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
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

        {/* Campos dinâmicos */}
        {selectedDb && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label={t("connectionName")}
                value={formData.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder={getPlaceholder("name")}
              />

              <InputField
                label={t("host")}
                value={formData.host || ""}
                onChange={(e) => updateField("host", e.target.value)}
                placeholder={getPlaceholder("host")}
              />

              <InputField
                label={t("port")}
                value={formData.port || ""}
                onChange={(e) => updateField("port", e.target.value)}
                placeholder={getPlaceholder("port")}
              />

              <InputField
                label={
                  selectedDb === "sqlite" ? t("filePath") : t("database")
                }
                value={formData.database || ""}
                onChange={(e) => updateField("database", e.target.value)}
                placeholder={getPlaceholder("database")}
              />

              {selectedDb !== "sqlite" && (
                <>
                  <InputField
                    label={t("username")}
                    value={formData.username || ""}
                    onChange={(e) => updateField("username", e.target.value)}
                    placeholder={getPlaceholder("username")}
                  />

                  <PasswordField
                    label={t("password")}
                    value={formData.password || ""}
                    showPassword={showPassword}
                    togglePassword={() => setShowPassword((p) => !p)}
                    onChange={(e) => updateField("password", e.target.value)}
                  />
                </>
              )}

              {selectedDb === "postgresql" && (
                <InputField
                  label="SSL Mode"
                  value={formData.sslmode || ""}
                  onChange={(e) => updateField("sslmode", e.target.value)}
                  placeholder={getPlaceholder("sslmode")}
                />
              )}

              {selectedDb === "oracle" && (
                <InputField
                  label="Service Name"
                  value={formData.service || ""}
                  onChange={(e) => updateField("service", e.target.value)}
                  placeholder={getPlaceholder("service")}
                />
              )}

              {selectedDb === "sqlserver" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trust Server Certificate
                  </label>
                  <select
                    value={formData.trustServerCertificate || "yes"}
                    onChange={(e) =>
                      updateField("trustServerCertificate", e.target.value)
                    }
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

        {/* Status da conexão */}
        {connectionStatus && (
          <div
            className={`p-4 rounded-lg flex items-center ${
              connectionStatus === "success"
                ? "bg-green-50 text-green-700"
                : connectionStatus === "connected"
                ? "bg-blue-50 text-blue-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {getStatusIcon(connectionStatus)}
            <span className="ml-2">
              {connectionStatus === "success"
                ? t("testSuccess")
                : connectionStatus === "connected"
                ? t("connectedSuccess")
                : t("connectionError")}
            </span>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <ActionButton
            onClick={testConnection}
            disabled={isConnecting || !selectedDb}
            icon={<Server className="w-4 h-4 mr-2" />}
            text={isConnecting ? t("testing") : t("test")}
            loading={isConnecting}
            variant="outline"
          />
          <ActionButton
            onClick={connect}
            disabled={isConnecting}
            icon={<Plus className="w-4 h-4 mr-2" />}
            text={isConnecting ? t("connecting") : t("connect")}
            loading={isConnecting}
            variant="solid"
          />
        </div>
      </div>
    </div>
  );
};

/* Input genérico */
const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

/* Campo de senha isolado */
const PasswordField: React.FC<{
  label: string;
  value: string;
  showPassword: boolean;
  togglePassword: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, value, showPassword, togglePassword, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder="••••••"
        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={togglePassword}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  </div>
);

/* Botão com loading e variantes */
const ActionButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  text: string;
  loading?: boolean;
  variant?: "solid" | "outline";
}> = ({ onClick, disabled, icon, text, loading, variant = "solid" }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center disabled:opacity-50 ${
      variant === "solid"
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : "border border-blue-500 text-blue-600 hover:bg-blue-50"
    }`}
  >
    {loading && (
      <div className="animate-spin h-4 w-4 border-b-2 border-current rounded-full mr-2"></div>
    )}
    {icon}
    {text}
  </button>
);
