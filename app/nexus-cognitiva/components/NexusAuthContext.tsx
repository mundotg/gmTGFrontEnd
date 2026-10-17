"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useSession } from "@/context/SessionContext";
import { NexusLoginModal } from "./NexusLoginModal";

interface NexusAuthContextType {
  openLoginModal: (redirectTo?: string) => void;
  closeLoginModal: () => void;
  isLoginModalOpen: boolean;
  requireAuth: (action: () => void, redirectTo?: string) => void;
}

const NexusAuthContext = createContext<NexusAuthContextType | undefined>(undefined);

export const NexusAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSession();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string>("/nexus-cognitiva");

  const openLoginModal = useCallback((redirectTo: string = "/nexus-cognitiva") => {
    setRedirectTarget(redirectTo);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const requireAuth = useCallback(
    (action: () => void, redirectTo?: string) => {
      if (isAuthenticated) {
        action();
      } else {
        const target = redirectTo || (typeof window !== "undefined" ? window.location.pathname : "/nexus-cognitiva");
        openLoginModal(target);
      }
    },
    [isAuthenticated, openLoginModal]
  );

  return (
    <NexusAuthContext.Provider
      value={{
        openLoginModal,
        closeLoginModal,
        isLoginModalOpen,
        requireAuth,
      }}
    >
      {children}
      <NexusLoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onSuccess={() => {
          closeLoginModal();
        }}
        redirectTo={redirectTarget}
      />
    </NexusAuthContext.Provider>
  );
};

export const useNexusAuth = (): NexusAuthContextType => {
  const context = useContext(NexusAuthContext);
  if (!context) {
    throw new Error("useNexusAuth deve ser utilizado dentro de NexusAuthProvider");
  }
  return context;
};
export default NexusAuthContext;
