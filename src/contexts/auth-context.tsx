
"use client";

import type { UserRole } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Lista de e-mails com permissão de administrador
const ADMIN_EMAILS = ['matheus@3ainvestimentos.com.br'];
// Lista de domínios autorizados a fazer login
const ALLOWED_DOMAINS = ['3ainvestimentos.com.br', '3ariva.com.br'];

interface User {
  uid: string;
  name: string | null;
  email: string | null;
  role: UserRole;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  const isAuthenticated = !!user;
  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || '') : false;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userEmail = firebaseUser.email || '';
        const userDomain = userEmail.split('@')[1];

        if (ALLOWED_DOMAINS.includes(userDomain)) {
          const appUser: User = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            role: ADMIN_EMAILS.includes(userEmail) ? 'PMO' : 'Colaborador',
          };
          setUser(appUser);
        } else {
          // Se o usuário logado não for de um domínio permitido, desloga-o.
          signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);
  
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
        router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, pathname]);


  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
       if (firebaseUser) {
          const userEmail = firebaseUser.email || '';
          const userDomain = userEmail.split('@')[1];

          if (ALLOWED_DOMAINS.includes(userDomain)) {
            router.push('/strategic-panel');
          } else {
            // Se o domínio não for permitido, desloga o usuário imediatamente e exibe uma mensagem.
            await signOut(auth);
            setUser(null);
            toast({
                variant: 'destructive',
                title: 'Acesso Negado',
                description: 'O seu domínio de e-mail não tem permissão para acessar esta aplicação.',
            });
          }
       }
    } catch (error) {
      console.error("Falha na autenticação com o Google", error);
       toast({
          variant: 'destructive',
          title: 'Erro de Autenticação',
          description: 'Não foi possível fazer o login. Por favor, tente novamente.',
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Falha ao fazer logout", error);
    }
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isAdmin, login, logout, isLoading }}>
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
