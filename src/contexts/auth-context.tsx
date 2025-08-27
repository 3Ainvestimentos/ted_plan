
"use client";

import type { UserRole } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import type { MaintenanceSettings } from '@/types';


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
  isUnderMaintenance: boolean;
  setIsUnderMaintenance: (isUnder: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  const isAuthenticated = !!user;
  const isAdmin = user ? adminEmails.includes(user.email || '') : false;

  const isUserAuthorized = async (email: string, currentAdminEmails: string[]): Promise<boolean> => {
    if (!email) return false;

    // 1. Admins always have access
    if (currentAdminEmails.includes(email)) {
        return true;
    }
    
    // 2. Check for individual email in collaborators list
    try {
        const collaboratorsRef = collection(db, 'collaborators');
        const q = query(collaboratorsRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Erro ao verificar autorização do usuário:", error);
        return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true);
      
      const maintenanceDocRef = doc(db, 'settings', 'maintenance');
      const maintenanceSnap = await getDoc(maintenanceDocRef);
      const maintenanceSettings = maintenanceSnap.exists() ? (maintenanceSnap.data() as MaintenanceSettings) : { isEnabled: false, adminEmails: [] };
      setAdminEmails(maintenanceSettings.adminEmails);

      if (firebaseUser && firebaseUser.email) {
        
        // Maintenance Mode Check
        if(maintenanceSettings.isEnabled && !maintenanceSettings.adminEmails.includes(firebaseUser.email)) {
            setIsUnderMaintenance(true);
            await signOut(auth);
            setUser(null);
            setIsLoading(false);
            router.push('/login');
            return;
        }

        setIsUnderMaintenance(false);
        const isAuthorized = await isUserAuthorized(firebaseUser.email, maintenanceSettings.adminEmails);

        if (isAuthorized) {
          const appUser: User = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            role: maintenanceSettings.adminEmails.includes(firebaseUser.email) ? 'PMO' : 'Colaborador',
          };
          setUser(appUser);
        } else {
          toast({
              variant: 'destructive',
              title: 'Acesso Negado',
              description: 'Seu e-mail não está autorizado a acessar esta aplicação.',
          });
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const login = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error("Falha na autenticação com o Google", error);
       toast({
          variant: 'destructive',
          title: 'Erro de Autenticação',
          description: 'Não foi possível fazer o login. Por favor, tente novamente.',
      });
       setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Falha ao fazer logout", error);
    }
  };
  
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
