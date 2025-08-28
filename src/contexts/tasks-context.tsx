
"use client";

import type { Task } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './auth-context';
import { useToast } from '@/hooks/use-toast';

interface TasksContextType {
  tasks: Task[];
  addTask: (title: string) => Promise<void>;
  updateTask: (id: string, newTitle: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  isLoading: boolean;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const getTasksCollectionRef = useCallback(() => {
    if (!user) return null;
    return collection(db, 'tasks');
  }, [user]);
  
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const tasksCollectionRef = getTasksCollectionRef();
    if (!tasksCollectionRef) return;
    
    try {
      const q = query(tasksCollectionRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const tasksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
      
      // Sort on the client-side to avoid composite index
      tasksData.sort((a, b) => {
        const aTimestamp = a.createdAt?.seconds || 0;
        const bTimestamp = b.createdAt?.seconds || 0;
        return bTimestamp - aTimestamp;
      });

      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, getTasksCollectionRef]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async (title: string) => {
    if (!user) return;
    const tasksCollectionRef = getTasksCollectionRef();
    if (!tasksCollectionRef) return;

    try {
        await addDoc(tasksCollectionRef, {
            userId: user.uid,
            title,
            completed: false,
            archived: false,
            createdAt: serverTimestamp(),
        });
        fetchTasks();
    } catch (error) {
        console.error("Error adding task: ", error);
        toast({ variant: 'destructive', title: "Erro ao adicionar tarefa." });
    }
  }, [user, getTasksCollectionRef, fetchTasks, toast]);

  const updateTask = useCallback(async (id: string, newTitle: string) => {
    const taskDocRef = doc(db, 'tasks', id);
    try {
      await updateDoc(taskDocRef, { title: newTitle });
      fetchTasks();
      toast({ title: "Tarefa atualizada!" });
    } catch (error) {
      console.error("Error updating task: ", error);
      toast({ variant: 'destructive', title: "Erro ao atualizar tarefa." });
    }
  }, [fetchTasks, toast]);

  const toggleTaskCompletion = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const taskDocRef = doc(db, 'tasks', id);
    try {
        await updateDoc(taskDocRef, { completed: !task.completed });
        fetchTasks();
    } catch (error) {
        console.error("Error toggling task completion: ", error);
    }
  }, [tasks, fetchTasks]);
  
  const archiveTask = useCallback(async (id: string) => {
    const taskDocRef = doc(db, 'tasks', id);
    try {
        await updateDoc(taskDocRef, { archived: true });
        fetchTasks();
        toast({ title: "Tarefa arquivada." });
    } catch (error) {
        console.error("Error archiving task: ", error);
    }
  }, [fetchTasks, toast]);

  const deleteTask = useCallback(async (id: string) => {
    const taskDocRef = doc(db, 'tasks', id);
    try {
        await deleteDoc(taskDocRef);
        fetchTasks();
        toast({ title: "Tarefa removida permanentemente." });
    } catch (error) {
        console.error("Error deleting task: ", error);
    }
  }, [fetchTasks, toast]);

  return (
    <TasksContext.Provider value={{ tasks, addTask, updateTask, toggleTaskCompletion, archiveTask, deleteTask, isLoading }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};
