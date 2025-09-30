
"use client";

import type { UserRole } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isUnderMaintenance: boolean;
  setIsUnderMaintenance: (isUnder: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALLOWED_EMAILS = [
    'matheus@3ainvestimentos.com.br',
    'thiago@3ainvestimentos.com.br'
];


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const router = useRouter();
  const auth = getAuth();

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'PMO';
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, 'collaborators', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: userData.name || firebaseUser.email,
                    role: userData.role || 'Colaborador',
                });
            } else {
                 setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.email,
                    role: 'Colaborador',
                 });
            }
        } else {
            setUser(null);
        }
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);


  const login = async (email: string, pass: string) => {
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
        throw new Error('Usuário não autorizado.');
    }
    
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // onAuthStateChanged will handle setting the user and loading state
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            // If user does not exist, create it.
            try {
                await createUserWithEmailAndPassword(auth, email, pass);
                // After creation, signIn will be automatic, and onAuthStateChanged will trigger.
            } catch (createError: any) {
                 throw new Error(`Falha ao criar usuário: ${'createError.message'} `);
            }
        } else {
            // For other errors like wrong password
            throw new Error('Credenciais inválidas.');
        }
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isAdmin, login, logout, isLoading, isUnderMaintenance, setIsUnderMaintenance }}>
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
