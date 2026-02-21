"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Plus,
  Check,
  Users,
  Search,
  AlertTriangle,
  Loader2,
  Trash2,
  Lock,
  Save,
  X
} from "lucide-react";
// import { useSession } from "@/context/SessionContext";

/* =====================
   TIPOS
===================== */
interface Permission {
  id: number;
  name: string;
  description?: string;
  category?: string;
}

interface Role {
  id: number;
  name: string;
  is_system?: boolean;
  permissions: Permission[];
}

interface EmpresaUser {
  id: number;
  nome: string;
  email: string;
  role?: Role;
  is_active: boolean;
}

/* =====================
   COMPONENT
===================== */
export const EquipeTab = () => {
  // const { user } = useSession();
  // Fallback seguro caso user seja undefined
  // const permissionsUser = user?.permissions || [];
  
  // Simulação de permissões para teste (pode remover se seu contexto estiver funcionando)
  const canManageRoles = true; // permissionsUser.includes("role:manage");
  const canManageUsers = true; // permissionsUser.includes("user:manage");

  /* =====================
       STATE
  ===================== */
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<EmpresaUser[]>([]);

  // UI States
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  /* =====================
       MOCK LOAD (API)
  ===================== */
  useEffect(() => {
    // Simulating API latency
    setTimeout(() => {
      setRoles([
        { id: 1, name: "Admin", is_system: true, permissions: [] },
        { id: 2, name: "Developer", permissions: [] },
        { id: 3, name: "Viewer", permissions: [] }
      ]);

      setPermissions([
        { id: 1, name: "db:connect", category: "Database", description: "Conectar ao banco" },
        { id: 2, name: "db:read", category: "Database", description: "Ler dados sensíveis" },
        { id: 3, name: "user:create", category: "Usuários", description: "Criar novos membros" },
        { id: 4, name: "user:delete", category: "Usuários", description: "Remover membros" },
        { id: 5, name: "role:manage", category: "Segurança", description: "Gerenciar RBAC" },
        { id: 6, name: "project:create", category: "Projetos", description: "Criar projetos" },
        { id: 7, name: "report:view", category: "Relatórios", description: "Visualizar dashboard" },
      ]);

      setUsers([
        { id: 1, nome: "Carlos Silva", email: "carlos@empresa.com", role: { id: 1, name: "Admin", permissions: [] }, is_active: true },
        { id: 2, nome: "Ana Costa", email: "ana@empresa.com", role: { id: 2, name: "Developer", permissions: [] }, is_active: true }
      ]);
    }, 500);
  }, []);

  /* =====================
       HANDLERS
  ===================== */
  
  // Feedback visual temporário
  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const togglePermission = (permission: Permission) => {
    if (!selectedRole) return;
    if (selectedRole.is_system && selectedRole.name === "Admin") return; // Admin geralmente tem tudo fixo

    const exists = selectedRole.permissions.some(p => p.id === permission.id);
    const updatedPermissions = exists
      ? selectedRole.permissions.filter(p => p.id !== permission.id)
      : [...selectedRole.permissions, permission];

    setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
    setHasUnsavedChanges(true);
  };

  const toggleCategory = (categoryName: string, categoryPermissions: Permission[]) => {
    if (!selectedRole) return;
    
    // Verifica se todos da categoria já estão selecionados
    const allSelected = categoryPermissions.every(p => 
      selectedRole.permissions.some(rp => rp.id === p.id)
    );

    let newPermissions = [...selectedRole.permissions];

    if (allSelected) {
      // Remove todos da categoria
      newPermissions = newPermissions.filter(rp => 
        !categoryPermissions.some(cp => cp.id === rp.id)
      );
    } else {
      // Adiciona os que faltam
      const missing = categoryPermissions.filter(cp => 
        !newPermissions.some(rp => rp.id === cp.id)
      );
      newPermissions = [...newPermissions, ...missing];
    }

    setSelectedRole({ ...selectedRole, permissions: newPermissions });
    setHasUnsavedChanges(true);
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setLoadingSave(true);
    
    // 🔗 API CALL HERE
    await new Promise(r => setTimeout(r, 800));
    
    // Atualiza a lista principal de roles com as novas permissões do selecionado
    setRoles(prev => prev.map(r => r.id === selectedRole.id ? selectedRole : r));
    
    setLoadingSave(false);
    setHasUnsavedChanges(false);
    showNotification("Permissões salvas com sucesso!");
  };

  const createRole = () => {
    if (!newRoleName.trim()) return;
    const newRole = { id: Date.now(), name: newRoleName, permissions: [] };
    setRoles([...roles, newRole]);
    setNewRoleName("");
    setIsCreatingRole(false);
    setSelectedRole(newRole); // Já seleciona o novo
    showNotification("Role criado com sucesso!");
  };

  const deleteRole = (roleId: number) => {
    if (confirm("Tem certeza? Usuários com este role perderão acesso.")) {
       setRoles(roles.filter(r => r.id !== roleId));
       if (selectedRole?.id === roleId) setSelectedRole(null);
       showNotification("Role removido.");
    }
  };

  /* =====================
       COMPUTED
  ===================== */
  // Agrupa permissões filtradas
  const permissionsGrouped = useMemo(() => {
    const filtered = permissions.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.reduce((acc: Record<string, Permission[]>, p) => {
      const key = p.category || "Outros";
      acc[key] = acc[key] || [];
      acc[key].push(p);
      return acc;
    }, {});
  }, [permissions, searchTerm]);

  /* =====================
       RENDER
  ===================== */
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      
      {/* HEADER & NOTIFICATION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Controle de Acesso (RBAC)
          </h2>
          <p className="text-slate-500 text-sm">
            Gerencie funções, permissões granulares e atribuições de equipe.
          </p>
        </div>
        
        {notification && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm animate-in slide-in-from-top-2
            ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}
          `}>
            {notification.type === 'success' ? <Check className="inline w-4 h-4 mr-2"/> : <AlertTriangle className="inline w-4 h-4 mr-2"/>}
            {notification.msg}
          </div>
        )}
      </div>

      {/* MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ROLES & USERS (Mobile: Top, Desktop: Left Sidebar) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* ROLES CARD */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[500px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center sticky top-0">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Shield size={18} className="text-indigo-600"/> Funções (Roles)
              </h3>
              {canManageRoles && (
                <button 
                  onClick={() => setIsCreatingRole(!isCreatingRole)}
                  className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md transition-colors"
                >
                  {isCreatingRole ? <X size={18} /> : <Plus size={18} />}
                </button>
              )}
            </div>

            {/* Create Role Input */}
            {isCreatingRole && (
              <div className="p-3 bg-slate-50 border-b animate-in slide-in-from-top-2">
                <div className="flex gap-2">
                  <input 
                    className="flex-1 text-sm border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 px-3 py-1.5"
                    placeholder="Nome ex: Gerente"
                    autoFocus
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && createRole()}
                  />
                  <button onClick={createRole} className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-indigo-700">
                    Criar
                  </button>
                </div>
              </div>
            )}

            {/* Role List */}
            <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {roles.map(role => (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer border
                    ${selectedRole?.id === role.id 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" 
                      : "bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {role.is_system ? <Lock size={14} className="opacity-50"/> : <div className="w-3.5 h-3.5 rounded-full bg-slate-200 group-hover:bg-indigo-200 transition-colors"></div>}
                    <span>{role.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedRole?.id === role.id ? "bg-white text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
                      {role.permissions.length}
                    </span>
                    {!role.is_system && canManageRoles && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteRole(role.id); }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* USERS CARD */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
             <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-emerald-600"/> Membros
              </h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {users.map(u => (
                <div key={u.id} className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{u.nome}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${u.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  </div>
                  {canManageUsers && (
                    <select 
                      className="w-full text-xs border-slate-200 rounded bg-slate-50 py-1 px-2 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      value={u.role?.id || ""}
                      onChange={(e) => {
                        // Lógica para atualizar role do user (simulada)
                        const role = roles.find(r => r.id === Number(e.target.value));
                        setUsers(prev => prev.map(user => user.id === u.id ? {...user, role} : user));
                        showNotification(`Role de ${u.nome} atualizado.`);
                      }}
                    >
                      <option value="" disabled>Selecione um role</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PERMISSIONS MATRIX (Desktop: Main Content) */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm min-h-[600px] flex flex-col relative">
            
            {/* Permission Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white rounded-t-xl sticky top-0 z-10">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <h3 className="font-semibold text-slate-800">
                  {selectedRole ? `Permissões: ${selectedRole.name}` : "Selecione um Role"}
                </h3>
                {selectedRole?.is_system && (
                   <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                     READ-ONLY
                   </span>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar permissão..."
                  className="w-full pl-9 pr-4 py-1.5 text-sm border-slate-200 rounded-full bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  disabled={!selectedRole}
                />
              </div>
            </div>

            {/* Permission Content */}
            <div className="flex-1 p-6 bg-slate-50/30">
              {!selectedRole ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                  <Shield size={64} className="mb-4 stroke-1" />
                  <p className="text-lg font-medium">Nenhum role selecionado</p>
                  <p className="text-sm">Selecione uma função à esquerda para editar permissões</p>
                </div>
              ) : (
                <div className="space-y-8 pb-20"> {/* pb-20 para dar espaço ao footer flutuante */}
                   {Object.keys(permissionsGrouped).length === 0 && (
                     <div className="text-center py-10 text-slate-500">
                       Nenhuma permissão encontrada para &quot;{searchTerm}&quot;
                     </div>
                   )}

                   {Object.entries(permissionsGrouped).map(([category, perms]) => {
                     const isCategoryFullySelected = perms.every(p => selectedRole.permissions.some(rp => rp.id === p.id));
                     
                     return (
                      <div key={category} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                          <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{category}</h4>
                          <button 
                            onClick={() => toggleCategory(category, perms)}
                            disabled={selectedRole.is_system}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isCategoryFullySelected ? "Desmarcar Todos" : "Selecionar Todos"}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {perms.map(p => {
                            const isSelected = selectedRole.permissions.some(x => x.id === p.id);
                            return (
                              <label 
                                key={p.id}
                                className={`
                                  relative flex items-start p-3 rounded-lg border cursor-pointer transition-all duration-200
                                  ${isSelected 
                                    ? "bg-indigo-50/50 border-indigo-200 shadow-sm" 
                                    : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm"}
                                  ${selectedRole.is_system ? "cursor-not-allowed opacity-75" : ""}
                                `}
                              >
                                <div className="flex items-center h-5">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                    checked={isSelected}
                                    onChange={() => togglePermission(p)}
                                    disabled={selectedRole.is_system}
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <span className={`font-medium block ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>
                                    {p.name}
                                  </span>
                                  {p.description && (
                                    <span className="text-slate-500 text-xs mt-0.5 block">
                                      {p.description}
                                    </span>
                                  )}
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                   })}
                </div>
              )}
            </div>

            {/* Floating Action Footer */}
            {selectedRole && !selectedRole.is_system && (
              <div className={`
                absolute bottom-4 left-4 right-4 bg-slate-900 text-white p-4 rounded-xl shadow-xl flex items-center justify-between transition-all duration-300 transform
                ${hasUnsavedChanges ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"}
              `}>
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 rounded-full p-1.5 animate-pulse">
                    <AlertTriangle size={16} className="text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">Alterações não salvas</p>
                    <p className="text-slate-400 text-xs">As permissões só serão aplicadas após salvar.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      // Reverter (Reload from state original - simplificado aqui apenas recarregando o role)
                      const original = roles.find(r => r.id === selectedRole.id);
                      if (original) setSelectedRole({...original});
                      setHasUnsavedChanges(false);
                    }}
                    className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    Descartar
                  </button>
                  <button 
                    onClick={savePermissions}
                    disabled={loadingSave}
                    className="bg-white text-slate-900 px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 disabled:opacity-70 flex items-center gap-2 transition-all"
                  >
                    {loadingSave ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};