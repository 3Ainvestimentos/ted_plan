"use client";

import type { UserType } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User as FirebaseUser, getRedirectResult, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useSettings } from './settings-context';
import { MOCK_COLLABORATORS } from '@/lib/constants';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { canAccessPage, isAdminOnlyPage } from '@/lib/permissions-config';

// ============================================
// INTERFACES E TIPOS
// ============================================

interface User {
  uid: string;
  name: string | null;
  email: string | null;
  userType?: UserType;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  hasPermission: (page: string) => boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isUnderMaintenance: boolean;
}

// ============================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lista de emails específicos permitidos (fallback para mock data)
const ALLOWED_EMAILS = ['matheus@3ainvestimentos.com.br', 'thiago@3ainvestimentos.com.br'];
const MAPPED_USERS = new Map(MOCK_COLLABORATORS.map(c => [c.email, c]));

// ============================================
// FUNÇÃO HELPER: Verificação de Email Permitido
// ============================================
/**
 * Verifica se um email é permitido para acessar a aplicação.
 * Permite:
 * - Emails na lista ALLOWED_EMAILS
 * - Qualquer email dos domínios @3ainvestimentos.com.br ou @3ariva.com.br
 */
const isAllowedEmail = (email: string | null): boolean => {
  if (!email) return false;
  
  // Verificar se está na lista de emails específicos
  if (ALLOWED_EMAILS.includes(email)) {
    return true;
  }
  
  // Verificar se é do domínio permitido
  const allowedDomains = ['@3ainvestimentos.com.br', '@3ariva.com.br'];
  return allowedDomains.some(domain => email.endsWith(domain));
};

// ============================================
// COMPONENTE: AuthProvider
// ============================================
/**
 * Provider que gerencia toda a autenticação da aplicação.
 * Responsável por:
 * - Verificar autenticação do usuário
 * - Buscar dados do usuário no Firestore
 * - Gerenciar login/logout
 * - Controlar permissões e acesso
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Estados do componente
  const [user, setUser] = useState<User | null>(null); // Usuário autenticado
  const [isLoading, setIsLoading] = useState(true); // Estado de carregamento
  
  // Ref para armazenar unsubscribe do listener do Firestore
  const collaboratorUnsubscribeRef = useRef<(() => void) | null>(null);
  
  // Hooks e contextos
  const { maintenanceSettings, isLoading: isLoadingSettings } = useSettings();
  const router = useRouter();
  const pathname = usePathname();

  // ============================================
  // EFEITO: Listener de Autenticação
  // ============================================
  /**
   * Este useEffect é executado uma vez quando o componente monta.
   * Configura um listener que monitora mudanças no estado de autenticação do Firebase.
   * 
   * Fluxo:
   * 1. Quando usuário faz login → firebaseUser existe
   * 2. Verifica se email é permitido
   * 3. Busca dados do colaborador no Firestore
   * 4. Cria perfil do usuário com dados encontrados
   * 5. Quando usuário faz logout → firebaseUser é null
   */
  useEffect(() => {
    const auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence); // Manter sessão no navegador

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // CASO 1: Usuário está autenticado
      if (firebaseUser && firebaseUser.email) {
        // Verificar se o email é permitido ANTES de processar
        if (!isAllowedEmail(firebaseUser.email)) {
          console.log("Email não autorizado:", firebaseUser.email);
          setUser(null);
          signOut(auth); // Fazer logout automático
          setIsLoading(false);
          return;
        }
        
        try {
          // Limpar listener anterior se existir
          if (collaboratorUnsubscribeRef.current) {
            collaboratorUnsubscribeRef.current();
            collaboratorUnsubscribeRef.current = null;
          }
          
          // Buscar colaborador no Firestore usando email como ID
          const collaboratorDocRef = doc(db, 'collaborators', firebaseUser.email);
          
          // Usar onSnapshot para monitorar mudanças no documento em tempo real
          const unsubscribeCollaborator = onSnapshot(
            collaboratorDocRef,
            (collaboratorDoc) => {
              // OBRIGATÓRIO: Usuário DEVE estar na coleção collaborators
              if (!collaboratorDoc.exists()) {
                console.log("Usuário não encontrado na coleção collaborators:", firebaseUser.email);
                setUser(null);
                signOut(auth);
                setIsLoading(false);
                return;
              }
              
              // Colaborador encontrado no Firestore
              const collaboratorData = collaboratorDoc.data();

              // OBRIGATÓRIO: userType DEVE estar definido
              if (!collaboratorData.userType) {
                console.warn("Colaborador sem userType definido:", firebaseUser.email);
                setUser(null);
                signOut(auth);
                setIsLoading(false);
                return;
              }

              // Criar perfil do usuário com os dados encontrados
              // Isso será atualizado automaticamente quando o documento mudar
              const userProfile: User = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || collaboratorData?.name || null,
                email: firebaseUser.email,
                userType: collaboratorData.userType as UserType,
              };
              setUser(userProfile);
              setIsLoading(false);
            },
            (error) => {
              console.error("Error listening to collaborator data: ", error);
              setUser(null);
              signOut(auth);
              setIsLoading(false);
            }
          );
          
          // Armazenar unsubscribe para limpar quando necessário
          collaboratorUnsubscribeRef.current = unsubscribeCollaborator;
          
        } catch (error: any) {
          console.error("Error setting up collaborator listener: ", error);
          
          // Se der erro ao configurar o listener, não permitir acesso
          console.error("Erro ao configurar listener do colaborador. Acesso negado.");
          setUser(null);
          signOut(auth);
          setIsLoading(false);
        }
      } 
      // CASO 2: Usuário NÃO está autenticado
      else {
        // Limpar listener do Firestore quando usuário fizer logout
        if (collaboratorUnsubscribeRef.current) {
          collaboratorUnsubscribeRef.current();
          collaboratorUnsubscribeRef.current = null;
        }
        setUser(null);
        if (firebaseUser) {
          signOut(auth);
        }
        setIsLoading(false);
      }
    });

    // Cleanup: remover listeners quando componente desmontar
    return () => {
      unsubscribe();
      if (collaboratorUnsubscribeRef.current) {
        collaboratorUnsubscribeRef.current();
        collaboratorUnsubscribeRef.current = null;
      }
    };
  }, []);

  // ============================================
  // FUNÇÃO: Login
  // ============================================
  /**
   * Inicia o processo de login com Google.
   * Abre um popup para autenticação.
   * O listener onAuthStateChanged detecta automaticamente quando login é bem-sucedido.
   */
  const login = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // O onAuthStateChanged listener vai detectar o login e processar
    } catch (error) {
      console.error("Popup login error:", error);
      throw error; // Re-lançar para ser tratado no componente de login
    }
  };

  // ============================================
  // FUNÇÃO: Logout
  // ============================================
  /**
   * Faz logout do usuário e redireciona para página de login.
   */
  const logout = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    setUser(null); // Limpar estado do usuário
    router.push('/login'); // Redirecionar para login
  };

  // ============================================
  // VALORES COMPUTADOS
  // ============================================
  const isAuthenticated = !!user; // true se user não for null
  const userType = user?.userType || 'head';
  const isAdmin = userType === 'admin';
  // Modo de manutenção: bloqueia todos exceto admins (userType === 'admin')
  // Também verifica se o email está na lista de adminEmails como fallback
  const isUnderMaintenance = !!maintenanceSettings?.isEnabled && 
                            !isAdmin && 
                            !maintenanceSettings?.adminEmails.includes(user?.email || '');

  // ============================================
  // FUNÇÃO: Verificação de Permissão
  // ============================================
  /**
   * Verifica se o usuário tem permissão para acessar uma página específica.
   * 
   * NOVA LÓGICA BASEADA EM ROLES:
   * 
   * 1. Admin: Acesso total a todas as páginas
   * 2. PMO: Acesso a todas as páginas (exceto Settings)
   * 3. Head: Acesso apenas a:
   *    - Painel Estratégico (/)
   *    - Iniciativas Estratégicas (/strategic-initiatives)
   * 
   * PERMISSÕES CUSTOMIZADAS:
   * - Se o usuário tiver permissões customizadas no banco (campo permissions),
   *   elas podem sobrescrever as regras padrão do role
   * 
   * @param page - Path da página (ex: '/strategic-initiatives' ou 'strategic-initiatives')
   * @returns true se o usuário tem permissão para acessar a página
   */
  const hasPermission = useCallback((page: string): boolean => {
    if (!user) return false;
    
    const currentUserType = user.userType || 'head';
    
    // Normalizar a chave da página (remover barra inicial se houver)
    const pageKey = page.startsWith('/') ? page.substring(1) : page;
    
    // Páginas exclusivas de admin (Settings)
    if (isAdminOnlyPage(pageKey) && currentUserType !== 'admin') {
      return false;
    }
    
    // Verificar permissão usando a configuração de roles baseada apenas no userType
    return canAccessPage(currentUserType, pageKey);
  }, [user]);

  // ============================================
  // RENDERIZAÇÃO: Loading State
  // ============================================
  /**
   * Mostra spinner de carregamento enquanto:
   * - Autenticação está sendo verificada
   * - Settings estão sendo carregados
   */
  if (isLoading || isLoadingSettings) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  // ============================================
  // RENDERIZAÇÃO: Provider
  // ============================================
  /**
   * Fornece o contexto de autenticação para todos os componentes filhos.
   */
  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      isAdmin, 
      hasPermission, 
      login, 
      logout, 
      isLoading: (isLoading || isLoadingSettings), 
      isUnderMaintenance 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// HOOK: useAuth
// ============================================
/**
 * Hook para acessar o contexto de autenticação.
 * Deve ser usado dentro de um AuthProvider.
 * 
 * Exemplo de uso:
 * const { user, login, logout, isAdmin } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};