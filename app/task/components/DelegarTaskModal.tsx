import React, { useState, useEffect, useCallback, useRef } from "react";
import { UserPlus, Search, Users, Check, Loader2 } from "lucide-react";
import { Usuario } from "../types";
import { Modal } from "./modalComponent";
import { PaginatedResponse } from "./Paginacao";
import { useSessionTask } from "../contexts/UserContext";

interface DelegateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelegate: (userId: string) => void;
  taskTitle: string;
  currentAssignee?: string;
  loading?: boolean;
}

const DelegateTaskModal: React.FC<DelegateTaskModalProps> = ({
  isOpen,
  onClose,
  onDelegate,
  taskTitle,
  currentAssignee,
  loading = false,
}) => {
  const { api } = useSessionTask();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<Usuario[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastUserRef = useRef<HTMLButtonElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Buscar usuários com paginação
  const fetchUsers = useCallback(async (pageNum: number, search: string, reset: boolean = false) => {
    if (isLoadingUsers) return;
    
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        tipo: "user",
        page: String(pageNum),
        limit: "20",
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const { data } = await api.get<PaginatedResponse<Usuario>>("/geral/paginate?" + params);

      setUsers(prev => reset ? data.items : [...prev, ...data.items]);
      setHasMore(data.items.length === 20 && data.total > pageNum * 20);
      setTotalUsers(data.total);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
      setUsers([]);
      setHasMore(false);
      setTotalUsers(0);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [api, isLoadingUsers]);

  // Resetar estado ao abrir modal
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedUserId(currentAssignee || "");
      setUsers([]);
      setPage(1);
      setHasMore(true);
      fetchUsers(1, "", true);
    }
  }, [isOpen, currentAssignee]);

  // Busca com debounce
  useEffect(() => {
    if (!isOpen) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setUsers([]);
      setPage(1);
      setHasMore(true);
      fetchUsers(1, searchTerm, true);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, isOpen]);

  // Infinite scroll observer
  useEffect(() => {
    if (!isOpen || isLoadingUsers || !hasMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingUsers) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchUsers(nextPage, searchTerm, false);
      }
    });

    if (lastUserRef.current) {
      observerRef.current.observe(lastUserRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [isOpen, users.length, hasMore, isLoadingUsers, page, searchTerm]);

  const handleDelegate = () => {
    if (selectedUserId) {
      onDelegate(selectedUserId);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Delegar Tarefa"
      onClose={onClose}
      size="md"
    >
      {/* Subtítulo com o nome da tarefa */}
      <div className="mb-6 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
        <div className="flex items-start gap-2">
          <UserPlus size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-indigo-600 mb-1">Tarefa:</p>
            <p className="text-sm text-gray-900 font-medium line-clamp-2">
              {taskTitle}
            </p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Buscar usuário
        </label>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            autoFocus
          />
          {isLoadingUsers && searchTerm && (
            <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 animate-spin" />
          )}
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users size={16} />
            <span>Selecione um usuário</span>
          </div>
          <span className="text-xs text-gray-500">
            {users.length} de {totalUsers}
          </span>
        </div>

        {!isLoadingUsers && users.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário disponível"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm ? "Tente buscar por outro nome ou email" : "Não há usuários cadastrados"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {users.map((user, index) => {
              const isLast = index === users.length - 1;
              return (
                <button
                  key={user.id}
                  ref={isLast ? lastUserRef : null}
                  onClick={() => setSelectedUserId(user.id!)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    selectedUserId === user.id
                      ? "bg-indigo-50 border-indigo-500 shadow-sm"
                      : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.nome}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {getInitials(user.nome)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {user.nome}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user.email}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {currentAssignee === user.id && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        Atual
                      </span>
                    )}
                    
                    {selectedUserId === user.id && (
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                        <Check size={14} className="text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Loading indicator */}
            {isLoadingUsers && users.length > 0 && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={24} className="text-indigo-600 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Carregando mais usuários...</span>
              </div>
            )}

            {/* Initial loading */}
            {isLoadingUsers && users.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="text-indigo-600 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer com Botões */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button
          onClick={handleDelegate}
          disabled={!selectedUserId || loading || selectedUserId === currentAssignee}
          className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Delegando...</span>
            </>
          ) : (
            <>
              <UserPlus size={16} />
              <span>Delegar Tarefa</span>
            </>
          )}
        </button>
      </div>

      {/* Mensagem de ajuda */}
      {selectedUserId === currentAssignee && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            ℹ️ Este usuário já é o responsável atual pela tarefa.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default DelegateTaskModal;