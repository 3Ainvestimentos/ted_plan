
"use client";

import type { UserRole } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
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
           // If a user is logged in but not in the allowed list, sign them out.
           signOut(auth);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      if (!email || !ALLOWED_EMAILS.includes(email)) {
        await signOut(auth); // Sign out unauthorized user
        throw new Error("Usuário não autorizado.");
      }
      // onAuthStateChanged will handle setting the user and redirecting
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      // Let the user know they are not authorized
      if (error.message === "Usuário não autorizado.") {
        throw error;
      }
      // Handle other potential errors like popup closed by user, etc.
      throw new Error("Falha ao fazer login com o Google.");
    }
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
