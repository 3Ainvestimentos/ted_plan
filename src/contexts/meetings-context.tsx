
"use client";

import type { RecurringMeeting } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';

interface MeetingsContextType {
  meetings: RecurringMeeting[];
  addMeeting: (meeting: Omit<RecurringMeeting, 'id' | 'lastOccurrence'>) => Promise<void>;
  updateMeeting: (meetingId: string, data: Partial<RecurringMeeting>) => Promise<void>;
  isLoading: boolean;
}

const MeetingsContext = createContext<MeetingsContextType | undefined>(undefined);

export const MeetingsProvider = ({ children }: { children: ReactNode }) => {
  const [meetings, setMeetings] = useState<RecurringMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const meetingsCollectionRef = collection(db, 'recurringMeetings');

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    try {
        const q = query(meetingsCollectionRef, orderBy('name'));
        const querySnapshot = await getDocs(q);
        const meetingsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as RecurringMeeting));
        setMeetings(meetingsData);
    } catch (error) {
        console.error("Error fetching meetings: ", error);
    } finally {
        setIsLoading(false);
    }
  }, []); // Removed dependency on collection ref as it's stable

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const addMeeting = useCallback(async (meetingData: Omit<RecurringMeeting, 'id' | 'lastOccurrence'>) => {
    const newMeeting = {
        ...meetingData,
        lastOccurrence: new Date().toISOString().split('T')[0], // Sets today as the first "last occurrence"
    };

    try {
        await addDoc(meetingsCollectionRef, newMeeting);
        fetchMeetings(); // Refetch to get the updated list
    } catch (error) {
        console.error("Error adding meeting: ", error);
    }
  }, [fetchMeetings, meetingsCollectionRef]);
  
  const updateMeeting = useCallback(async (meetingId: string, data: Partial<RecurringMeeting>) => {
    const meetingDocRef = doc(db, 'recurringMeetings', meetingId);
    try {
      await updateDoc(meetingDocRef, data);
      fetchMeetings(); // Refetch to get updated data
    } catch (error) {
        console.error("Error updating meeting: ", error);
    }
  }, [fetchMeetings]);

  return (
    <MeetingsContext.Provider value={{ meetings, addMeeting, updateMeeting, isLoading }}>
      {children}
    </MeetingsContext.Provider>
  );
};

export const useMeetings = () => {
  const context = useContext(MeetingsContext);
  if (context === undefined) {
    throw new Error('useMeetings must be used within a MeetingsProvider');
  }
  return context;
};
