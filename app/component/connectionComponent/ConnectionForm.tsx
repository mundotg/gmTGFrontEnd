"use client";
import React, { useCallback, useState } from "react";
import { ChevronDown, Eye, EyeOff, Plus, Server, CheckCircle2, XCircle } from "lucide-react";
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
  connect
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
      name: t("connectionNamePlaceholder") || "Ex: Produção DB",
      host: "localhost",
      port: selectedDatabase?.port?.toString() || "5432",
      database:
        selectedDb === "sqlite"
          ? "/path/to/database.db"
          : t("databaseNamePlaceholder") || "nome_do_banco",
      username: "postgres",
      password: "••••••••",
      sslmode: "disable / require / verify-ca",
      service: "xe / orcl",
    };
    return map[field] || "";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {t("newConnection") || "Nova Conexão"}
        </h2>

        {/* Selecionar tipo de DB */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-700 mb-2">
            {t("dbType") || "TIPO DE BANCO DE DADOS"}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className={`w-full px-4 py-3 text-left border rounded-xl flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                showDropdown 
                  ? "border-blue-500 bg-white shadow-sm" 
                  : "border-gray-200 bg-gray-50 hover:bg-white"
              }`}
            >
              {selectedDatabase ? (
                <div className="flex items-center">
                  <span className="text-xl mr-3">{selectedDatabase.icon}</span>
                  <span className="font-bold text-gray-900">{selectedDatabase.name}</span>
                </div>
              ) : (
                <span className="text-gray-500 font-medium">{t("selectDatabase") || "Selecione o tipo..."}</span>
              )}
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  showDropdown ? "rotate-180 text-blue-500" : ""
                }`}
              />
            </button>

            {showDropdown && (
              <>
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {databases.map((db) => (
                    <button
                      key={db.id}
                      onClick={() => handleDbSelect(db.id)}
                      className="w-full px-4 py-3.5 text-left hover:bg-gray-50 flex items-center transition-colors border-b border-gray-100 last:border-0"
                    >
                      <span className="text-xl mr-3">{db.icon}</span>
                      <span className="font-semibold text-gray-700">{db.name}</span>
                    </button>
                  ))}
                </div>
                {/* Invisible overlay for closing dropdown */}
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              </>
            )}
          </div>
        </div>

        {/* Campos dinâmicos */}
        {selectedDb && (
          <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <InputField
                label={t("connectionName") || "NOME DA CONEXÃO"}
                value={formData.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder={getPlaceholder("name")}
              />

              <InputField
                label={t("host") || "HOST / IP"}
                value={formData.host || ""}
                onChange={(e) => updateField("host", e.target.value)}
                placeholder={getPlaceholder("host")}
              />

              <InputField
                label={t("port") || "PORTA"}
                value={formData.port || ""}
                onChange={(e) => updateField("port", e.target.value)}
                placeholder={getPlaceholder("port")}
              />

              <InputField
                label={
                  selectedDb === "sqlite" ? (t("filePath") || "CAMINHO DO ARQUIVO") : (t("database") || "NOME DO BANCO")
                }
                value={formData.database || ""}
                onChange={(e) => updateField("database", e.target.value)}
                placeholder={getPlaceholder("database")}
              />

              {selectedDb !== "sqlite" && (
                <>
                  <InputField
                    label={t("username") || "USUÁRIO"}
                    value={formData.username || ""}
                    onChange={(e) => updateField("username", e.target.value)}
                    placeholder={getPlaceholder("username")}
                  />

                  <PasswordField
                    label={t("password") || "SENHA"}
                    value={formData.password || ""}
                    showPassword={showPassword}
                    togglePassword={() => setShowPassword((p) => !p)}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder={getPlaceholder("password")}
                  />
                </>
              )}

              {selectedDb === "postgresql" && (
                <InputField
                  label="SSL MODE"
                  value={formData.sslmode || ""}
                  onChange={(e) => updateField("sslmode", e.target.value)}
                  placeholder={getPlaceholder("sslmode")}
                />
              )}

              {selectedDb === "oracle" && (
                <InputField
                  label="SERVICE NAME"
                  value={formData.service || ""}
                  onChange={(e) => updateField("service", e.target.value)}
                  placeholder={getPlaceholder("service")}
                />
              )}

              {selectedDb === "sqlserver" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    TRUST SERVER CERTIFICATE
                  </label>
                  <select
                    value={formData.trustServerCertificate || "yes"}
                    onChange={(e) => updateField("trustServerCertificate", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors appearance-none cursor-pointer"
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
            className={`mt-6 p-4 rounded-xl flex items-center gap-3 border shadow-sm animate-in fade-in zoom-in-95 ${
              connectionStatus === "success" || connectionStatus === "connected"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {connectionStatus === "success" || connectionStatus === "connected" 
              ? <CheckCircle2 className="w-5 h-5 text-green-600" />
              : <XCircle className="w-5 h-5 text-red-600" />
            }
            <span className="font-bold text-sm tracking-wide">
              {connectionStatus === "success"
                ? (t("testSuccess") || "Conexão testada com sucesso!")
                : connectionStatus === "connected"
                ? (t("connectedSuccess") || "Conectado e salvo com sucesso!")
                : (t("connectionError") || "Erro ao conectar. Verifique as credenciais.")}
            </span>
          </div>
        )}

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-100">
          <ActionButton
            onClick={testConnection}
            disabled={isConnecting || !selectedDb}
            icon={<Server className="w-4 h-4" />}
            text={isConnecting ? (t("testing") || "Testando...") : (t("test") || "Testar Conexão")}
            loading={isConnecting}
            variant="outline"
          />
          <ActionButton
            onClick={connect}
            disabled={isConnecting || !selectedDb}
            icon={<Plus className="w-4 h-4" />}
            text={isConnecting ? (t("connecting") || "Conectando...") : (t("connect") || "Salvar & Conectar")}
            loading={isConnecting}
            variant="solid"
          />
        </div>
      </div>
    </div>
  );
};

/* =========================================
   SUB-COMPONENTES INTERNOS (PADRÃO OFICIAL)
   ========================================= */

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-xs font-bold text-gray-700 mb-2">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors placeholder:text-gray-400 placeholder:font-normal"
    />
  </div>
);

const PasswordField: React.FC<{
  label: string;
  value: string;
  showPassword: boolean;
  togglePassword: () => void;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, value, showPassword, togglePassword, onChange, placeholder }) => (
  <div>
    <label className="block text-xs font-bold text-gray-700 mb-2">
      {label}
    </label>
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors placeholder:text-gray-400 placeholder:font-normal"
      />
      <button
        type="button"
        onClick={togglePassword}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 p-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  </div>
);

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
    className={`flex-1 px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all focus:outline-none focus:ring-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
      variant === "solid"
        ? "bg-blue-600 text-white hover:bg-blue-700 border border-transparent focus:ring-blue-500/50"
        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 focus:ring-blue-500/50"
    }`}
  >
    {loading ? (
      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
    ) : (
      icon
    )}
    {text}
  </button>
);