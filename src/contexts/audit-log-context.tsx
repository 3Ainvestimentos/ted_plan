

"use client";

import type { AuditLog, AuditLogEvent, UserAuditSummaryData } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy, Timestamp, where, limit, startAfter, getCountFromServer, QueryConstraint, DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from './auth-context';

interface AuditLogContextType {
  logs: AuditLog[];
  logActivity: (event: AuditLogEvent, details: string) => Promise<void>;
  fetchLogs: (options?: { lastVisible?: any, pageLimit?: number, filterType?: string, filterStartDate?: Date | null, filterEndDate?: Date | null }) => Promise<any>;
  getLogsCount: (options?: { filterType?: string, filterStartDate?: Date | null, filterEndDate?: Date | null }) => Promise<number>;
  getLoginSummary: () => Promise<UserAuditSummaryData[]>;
  isLoading: boolean;
  isLoadingSummary: boolean;
}

const AuditLogContext = createContext<AuditLogContextType | undefined>(undefined);

const buildQueryConstraints = (filterType?: string, filterStartDate?: Date | null, filterEndDate?: Date | null): QueryConstraint[] => {
    const constraints: QueryConstraint[] = [];
    
    // Firestore limitation: Cannot have inequality filters on a field other than the first orderBy field
    // when an equality filter is present. To avoid this, we won't apply the 'event' filter on the query directly
    // if date range is also present. We will filter in-memory later.
    // However, if ONLY the event type is filtered, we can use the equality filter.
    if (filterType && filterType !== 'all' && !filterStartDate && !filterEndDate) {
        constraints.push(where('event', '==', filterType));
    }
    
    if (filterStartDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(filterStartDate)));
    }
    if (filterEndDate) {
        // To include the whole day, we set the time to the end of the day.
        const endOfDay = new Date(filterEndDate);
        endOfDay.setHours(23, 59, 59, 999);
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(endOfDay)));
    }
    return constraints;
};

export const AuditLogProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const { user } = useAuth();
  
  const getLogsCount = useCallback(async (options: { filterType?: string, filterStartDate?: Date | null, filterEndDate?: Date | null } = {}) => {
      const { filterType, filterStartDate, filterEndDate } = options;
      // Note: This count might not be perfectly accurate if we are client-side filtering.
      // For a precise count, we'd need to fetch all and count, which is inefficient.
      // We will return the count based on the query, which is a reasonable approximation.
      const constraints = buildQueryConstraints(filterType, filterStartDate, filterEndDate);
      const q = query(collection(db, 'auditLogs'), ...constraints);
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
  }, []);

  const fetchLogs = useCallback(async (options: { lastVisible?: any, pageLimit?: number, filterType?: string, filterStartDate?: Date | null, filterEndDate?: Date | null } = {}) => {
    setIsLoading(true);
    const { lastVisible, pageLimit = 10, filterType, filterStartDate, filterEndDate } = options;
    
    try {
        const filterConstraints = buildQueryConstraints(filterType, filterStartDate, filterEndDate);
        const q = query(
            collection(db, 'auditLogs'), 
            ...filterConstraints,
            orderBy('timestamp', 'desc'),
            ...(lastVisible ? [startAfter(lastVisible)] : []),
            limit(pageLimit)
        );

        const querySnapshot = await getDocs(q);
        let logsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as AuditLog));

        // Client-side filtering if we couldn't apply it in the query
         if (filterType && filterType !== 'all' && (filterStartDate || filterEndDate)) {
            logsData = logsData.filter(log => log.event === filterType);
        }

        setLogs(logsData);
        return querySnapshot.docs[querySnapshot.docs.length - 1]; // Return last visible document for pagination
    } catch (error) {
        console.error("Error fetching audit logs: ", error);
        if (error instanceof Error && (error.message.includes("requires an index") || error.message.includes("inequality filter property and the first sort order must be the same"))) {
            console.error("Firestore composite index required. Please create it in the Firebase console or adjust filters.");
            setLogs([]); // Clear logs to avoid showing stale data
        }
        return null;
    } finally {
        setIsLoading(false);
    }
  }, []);


  const getLoginSummary = useCallback(async (): Promise<UserAuditSummaryData[]> => {
    setIsLoadingSummary(true);
    try {
        // Temporarily return empty array to avoid the query error
        return [];
        /*
        const loginLogsQuery = query(
            collection(db, 'auditLogs'),
            where('event', '==', 'login'),
            orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(loginLogsQuery);
        const loginLogs = querySnapshot.docs.map(doc => doc.data() as AuditLog);

        const summary = new Map<string, { loginCount: number, lastLogin: Date }>();

        loginLogs.forEach(log => {
            const email = log.userEmail;
            const logDate = (log.timestamp as Timestamp).toDate();

            if (!summary.has(email)) {
                summary.set(email, { loginCount: 0, lastLogin: logDate });
            }

            const userData = summary.get(email)!;
            userData.loginCount++;
            if (logDate > userData.lastLogin) {
                userData.lastLogin = logDate;
            }
        });
        
        return Array.from(summary.entries()).map(([userEmail, data]) => ({
            userEmail,
            ...data
        })).sort((a, b) => b.lastLogin.getTime() - a.lastLogin.getTime());
        */

    } catch (error) {
        console.error("Error fetching login summary: ", error);
        return [];
    } finally {
        setIsLoadingSummary(false);
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

  return (
    <AuditLogContext.Provider value={{ logs, logActivity, fetchLogs, getLogsCount, getLoginSummary, isLoading, isLoadingSummary }}>
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
