

"use client";

import type { RecurringMeeting, AgendaItem, MeetingOccurrence } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, deleteDoc, arrayUnion } from 'firebase/firestore';

interface MeetingsContextType {
  meetings: RecurringMeeting[];
  addMeeting: (meeting: Omit<RecurringMeeting, 'id' | 'lastOccurrence' | 'currentOccurrenceAgenda' | 'occurrenceHistory'>) => Promise<void>;
  updateMeeting: (meetingId: string, data: Partial<RecurringMeeting>) => Promise<void>;
  deleteMeeting: (meetingId: string) => Promise<void>;
  updateAgendaItem: (meetingId: string, agenda: AgendaItem[]) => Promise<void>;
  markMeetingAsDone: (meeting: RecurringMeeting) => Promise<void>;
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
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const addMeeting = useCallback(async (meetingData: Omit<RecurringMeeting, 'id' | 'lastOccurrence' | 'currentOccurrenceAgenda' | 'occurrenceHistory'>) => {
    const newMeeting = {
        ...meetingData,
        lastOccurrence: new Date().toISOString().split('T')[0], // Sets today as the first "last occurrence"
        currentOccurrenceAgenda: meetingData.agenda.map(item => ({ ...item, completed: false, id: item.id || crypto.randomUUID() })),
        occurrenceHistory: [],
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
    
    const dataToUpdate = { ...data };
    if (dataToUpdate.scheduledDate === undefined) {
        dataToUpdate.scheduledDate = null;
    }
    
    try {
      await updateDoc(meetingDocRef, dataToUpdate);
      fetchMeetings(); // Refetch to get updated data
    } catch (error) {
        console.error("Error updating meeting: ", error);
    }
  }, [fetchMeetings]);

  const deleteMeeting = useCallback(async (meetingId: string) => {
    const meetingDocRef = doc(db, 'recurringMeetings', meetingId);
    try {
        await deleteDoc(meetingDocRef);
        fetchMeetings();
    } catch (error) {
        console.error("Error deleting meeting: ", error);
        throw error;
    }
  }, [fetchMeetings]);
  
  const markMeetingAsDone = useCallback(async (meeting: RecurringMeeting) => {
      if (!meeting.scheduledDate) return;
      
      const newHistoryItem: MeetingOccurrence = {
          executedDate: meeting.scheduledDate,
          agenda: meeting.currentOccurrenceAgenda
      };

      const meetingDocRef = doc(db, 'recurringMeetings', meeting.id);
      try {
        await updateDoc(meetingDocRef, {
            lastOccurrence: meeting.scheduledDate,
            scheduledDate: null,
            currentOccurrenceAgenda: meeting.agenda.map(item => ({ ...item, completed: false, id: item.id || crypto.randomUUID() })), // Reset agenda for next occurrence
            occurrenceHistory: arrayUnion(newHistoryItem)
        });
        fetchMeetings();
      } catch (error) {
        console.error("Error marking meeting as done: ", error);
      }
  }, [fetchMeetings]);


  const updateAgendaItem = useCallback(async (meetingId: string, agenda: AgendaItem[]) => {
      const meeting = meetings.find(m => m.id === meetingId);
      if (!meeting) return;

      await updateMeeting(meetingId, { currentOccurrenceAgenda: agenda });
  }, [meetings, updateMeeting]);


  return (
    <MeetingsContext.Provider value={{ meetings, addMeeting, updateMeeting, deleteMeeting, updateAgendaItem, markMeetingAsDone, isLoading }}>
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
