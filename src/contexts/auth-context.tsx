
"use client";

import type { UserRole } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, signOut, User as FirebaseUser, getRedirectResult, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useSettings } from './settings-context';
import { MOCK_COLLABORATORS } from '@/lib/constants';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface User {
  uid: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  permissions?: Record<string, boolean>;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isUnderMaintenance: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALLOWED_EMAILS = ['matheus@3ainvestimentos.com.br', 'thiago@3ainvestimentos.com.br'];
const MAPPED_USERS = new Map(MOCK_COLLABORATORS.map(c => [c.email, c]));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { maintenanceSettings, isLoading: isLoadingSettings } = useSettings();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const auth = getAuth(app);

    const handleAuth = async () => {
        try {
            await setPersistence(auth, browserLocalPersistence);

            const result = await getRedirectResult(auth);
            if (result) {
                const email = result.user.email;
                if (!email || !ALLOWED_EMAILS.includes(email)) {
                    await signOut(auth);
                    throw new Error("Usuário não autorizado.");
                }
            }

            const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
              if (firebaseUser && firebaseUser.email && ALLOWED_EMAILS.includes(firebaseUser.email)) {
                const collaboratorData = MAPPED_USERS.get(firebaseUser.email);
                const userProfile: User = {
                  uid: firebaseUser.uid,
                  name: firebaseUser.displayName,
                  email: firebaseUser.email,
                  role: collaboratorData?.cargo as UserRole || 'Colaborador',
                  permissions: collaboratorData?.permissions || {},
                };
                setUser(userProfile);
              } else {
                setUser(null);
                if (firebaseUser) {
                   signOut(auth);
                }
              }
              setIsLoading(false);
            });

            return unsubscribe;

        } catch (error) {
            console.error("Auth process error:", error);
            setIsLoading(false);
            setUser(null);
            router.push('/login');
        }
    };
    
    const unsubscribePromise = handleAuth();

    return () => {
        unsubscribePromise.then(unsubscribe => {
            if(unsubscribe) unsubscribe();
        });
    };
  }, [router]);

  const login = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const logout = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'PMO';
  const isUnderMaintenance = !!maintenanceSettings?.isEnabled && !maintenanceSettings?.adminEmails.includes(user?.email || '');

  // Redirect logic within a useEffect to avoid rendering protected routes unnecessarily
  useEffect(() => {
    const isLoginPage = pathname === '/login';

    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace('/login');
    }

    if (!isLoading && isAuthenticated && (isLoginPage || pathname === '/')) {
      router.replace('/strategic-initiatives');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading || (!isAuthenticated && pathname !== '/login')) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <LoadingSpinner className="h-12 w-12" />
        </div>
      );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isAdmin, login, logout, isLoading, isUnderMaintenance }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
