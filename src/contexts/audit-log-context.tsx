
"use client";

import type { AuditLog, AuditLogEvent } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy, Timestamp, where, limit, startAfter, getCountFromServer } from 'firebase/firestore';
import { useAuth } from './auth-context';

interface AuditLogContextType {
  logs: AuditLog[];
  logActivity: (event: AuditLogEvent, details: string) => Promise<void>;
  fetchLogs: (options?: { lastVisible?: any, pageLimit?: number, filterType?: string, filterStartDate?: Date | null, filterEndDate?: Date | null }) => Promise<any>;
  getLogsCount: (options?: { filterType?: string, filterStartDate?: Date | null, filterEndDate?: Date | null }) => Promise<number>;
  isLoading: boolean;
}

const AuditLogContext = createContext<AuditLogContextType | undefined>(undefined);

export const AuditLogProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  const getLogsCount = useCallback(async (options: { filterType?: string, filterStartDate?: Date | null, filterEndDate?: Date | null } = {}) => {
      const { filterType, filterStartDate, filterEndDate } = options;
      let constraints = [];
      if(filterType && filterType !== 'all') constraints.push(where('event', '==', filterType));
      if(filterStartDate) constraints.push(where('timestamp', '>=', Timestamp.fromDate(filterStartDate)));
      if(filterEndDate) constraints.push(where('timestamp', '<=', Timestamp.fromDate(filterEndDate)));
      
      const q = query(collection(db, 'auditLogs'), ...constraints);
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
  }, []);


  const fetchLogs = useCallback(async (options: { lastVisible?: any, pageLimit?: number, filterType?: string, filterStartDate?: Date | null, filterEndDate?: Date | null } = {}) => {
    setIsLoading(true);
    const { lastVisible, pageLimit = 10, filterType, filterStartDate, filterEndDate } = options;
    
    let constraints = [orderBy('timestamp', 'desc'), limit(pageLimit)];

    if(filterType && filterType !== 'all') constraints.unshift(where('event', '==', filterType));
    if(filterStartDate) constraints.unshift(where('timestamp', '>=', Timestamp.fromDate(filterStartDate)));
    if(filterEndDate) constraints.unshift(where('timestamp', '<=', Timestamp.fromDate(filterEndDate)));
    if(lastVisible) constraints.push(startAfter(lastVisible));
    
    try {
      const auditLogsCollectionRef = collection(db, 'auditLogs');
      const q = query(auditLogsCollectionRef, ...constraints as any);
      const querySnapshot = await getDocs(q);
      const logsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuditLog));

      setLogs(logsData);
      return querySnapshot.docs[querySnapshot.docs.length - 1]; // Return last visible document for pagination
    } catch (error) {
      console.error("Error fetching audit logs: ", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logActivity = useCallback(async (event: AuditLogEvent, details: string) => {
    if (!user) return; // Don't log if user is not authenticated

    const newLog = {
      userId: user.uid,
      userEmail: user.email,
      event,
      details,
      timestamp: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, 'auditLogs'), newLog);
    } catch (error) {
      console.error("Error logging activity: ", error);
    }
  }, [user]);

  // Initial fetch is now handled by the component itself
  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <AuditLogContext.Provider value={{ logs, logActivity, fetchLogs, getLogsCount, isLoading }}>
      {children}
    </AuditLogContext.Provider>
  );
};

export const useAuditLog = () => {
  const context = useContext(AuditLogContext);
  if (context === undefined) {
    throw new Error('useAuditLog must be used within an AuditLogProvider');
  }
  return context;
};
